const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const { applicationDefault, getApps, initializeApp } = require('firebase-admin/app');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');

function parseArguments(arguments_) {
  const options = { apply: false };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === '--apply') options.apply = true;
    else if (argument === '--project') options.projectId = arguments_[++index];
    else if (argument === '--user') options.userId = arguments_[++index];
    else if (argument === '--aliases') options.aliasesPath = arguments_[++index];
    else if (argument === '--report') options.reportPath = arguments_[++index];
    else throw new Error(`Argumento desconhecido: ${argument}`);
  }
  if (!options.projectId || !options.userId) {
    throw new Error(
      'Uso: npm run migrate:plans:v2 -- --project <id> --user <uid> [--aliases arquivo.json] [--report relatorio.json] [--apply]',
    );
  }
  return options;
}

function normalize(value) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function divisionDocumentId(name) {
  return `division-${createHash('sha1').update(normalize(name)).digest('hex').slice(0, 12)}`;
}

function loadAliases(filename) {
  if (!filename) return {};
  const value = JSON.parse(fs.readFileSync(path.resolve(filename), 'utf8'));
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new TypeError('O arquivo de aliases deve ser um objeto JSON.');
  }
  return value;
}

function catalogIndexes(snapshot) {
  const byId = new Map();
  const byName = new Map();
  for (const document of snapshot.docs) {
    const data = document.data();
    if (typeof data.id !== 'string' || typeof data.name !== 'string') continue;
    const exercise = {
      documentId: document.id,
      id: data.id,
      name: data.name.trim(),
    };
    byId.set(exercise.id, exercise);
    const name = normalize(exercise.name);
    byName.set(name, [...(byName.get(name) ?? []), exercise]);
  }
  return { byId, byName };
}

function resolveExercise(legacyName, aliases, indexes) {
  const aliasId = aliases[legacyName] ?? aliases[normalize(legacyName)];
  if (aliasId) {
    const exercise = indexes.byId.get(aliasId);
    return exercise
      ? { status: 'resolved', strategy: 'alias', exercise }
      : { status: 'unresolved', reason: `alias aponta para ID ausente: ${aliasId}` };
  }
  const candidates = indexes.byName.get(normalize(legacyName)) ?? [];
  if (candidates.length === 1) {
    return {
      status: 'resolved',
      strategy: 'exact-normalized-name',
      exercise: candidates[0],
    };
  }
  if (candidates.length > 1) {
    return {
      status: 'ambiguous',
      candidates: candidates.map(({ id, name }) => ({ id, name })),
    };
  }
  return { status: 'unresolved', reason: 'nenhum nome exato normalizado' };
}

async function migrate() {
  const options = parseArguments(process.argv.slice(2));
  const aliases = loadAliases(options.aliasesPath);
  const emulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
  const app =
    getApps()[0] ??
    initializeApp({
      projectId: options.projectId,
      ...(emulator ? {} : { credential: applicationDefault() }),
    });
  const database = getFirestore(app);
  const [catalog, legacy] = await Promise.all([
    database.collection('exercicios').get(),
    database
      .collection(`usuarios/${options.userId}/config_treinos`)
      .orderBy('Divisao')
      .get(),
  ]);
  const indexes = catalogIndexes(catalog);
  const divisions = new Map();
  const resolved = [];
  const pending = [];

  for (const document of legacy.docs) {
    const data = document.data();
    const divisionName = typeof data.Divisao === 'string' ? data.Divisao.trim() : '';
    const exerciseName = typeof data.Exercicio === 'string' ? data.Exercicio.trim() : '';
    if (!divisionName || !exerciseName) {
      pending.push({ legacyDocumentId: document.id, status: 'invalid-legacy-document' });
      continue;
    }
    const divisionKey = normalize(divisionName);
    if (!divisions.has(divisionKey)) {
      divisions.set(divisionKey, {
        id: divisionDocumentId(divisionName),
        name: divisionName,
        order: divisions.size + 1,
      });
    }
    const resolution = resolveExercise(exerciseName, aliases, indexes);
    if (resolution.status !== 'resolved') {
      pending.push({
        legacyDocumentId: document.id,
        division: divisionName,
        exercise: exerciseName,
        ...resolution,
      });
      continue;
    }
    resolved.push({
      legacyDocumentId: document.id,
      division: divisions.get(divisionKey),
      exercise: resolution.exercise,
      strategy: resolution.strategy,
      defaultSets: Number.isInteger(data.Series_Padrao) ? data.Series_Padrao : 3,
      order: Number.isInteger(data.Ordem) ? data.Ordem : 99,
    });
  }

  const report = {
    schemaVersion: 1,
    projectId: options.projectId,
    userId: options.userId,
    mode: options.apply ? 'apply' : 'dry-run',
    applied: options.apply && pending.length === 0,
    catalogDocuments: catalog.size,
    legacyDocuments: legacy.size,
    divisions: [...divisions.values()],
    resolved: resolved.map((item) => ({
      legacyDocumentId: item.legacyDocumentId,
      divisionId: item.division.id,
      division: item.division.name,
      exerciseId: item.exercise.id,
      exerciseDocumentId: item.exercise.documentId,
      exercise: item.exercise.name,
      strategy: item.strategy,
    })),
    pending,
  };

  if (options.apply && pending.length === 0) {
    const divisionReferences = [...divisions.values()].map((division) =>
      database.doc(`usuarios/${options.userId}/divisoes/${division.id}`),
    );
    const itemReferences = resolved.map((item) =>
      database.doc(
        `usuarios/${options.userId}/divisoes/${item.division.id}/exercicios/${item.exercise.documentId}`,
      ),
    );
    const references = [...divisionReferences, ...itemReferences];
    const existing = new Map(
      (references.length ? await database.getAll(...references) : []).map((snapshot) => [
        snapshot.ref.path,
        snapshot.exists,
      ]),
    );
    const writer = database.bulkWriter();
    for (const [index, division] of [...divisions.values()].entries()) {
      const reference = divisionReferences[index];
      writer.set(
        reference,
        {
          name: division.name,
          order: division.order,
          active: true,
          schemaVersion: 2,
          ...(existing.get(reference.path)
            ? {}
            : { createdAt: FieldValue.serverTimestamp() }),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
    for (const [index, item] of resolved.entries()) {
      const reference = itemReferences[index];
      writer.set(
        reference,
        {
          exerciseId: item.exercise.id,
          exerciseDocumentId: item.exercise.documentId,
          exerciseNameSnapshot: item.exercise.name,
          defaultSets: item.defaultSets,
          order: item.order,
          active: true,
          schemaVersion: 2,
          ...(existing.get(reference.path)
            ? {}
            : { createdAt: FieldValue.serverTimestamp() }),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
    await writer.close();
    await database.doc(`usuarios/${options.userId}/migracoes/workout-plan-v2`).set(
      {
        status: pending.length ? 'pending-review' : 'complete',
        resolvedCount: resolved.length,
        pendingCount: pending.length,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  if (options.reportPath) {
    fs.writeFileSync(path.resolve(options.reportPath), serialized, 'utf8');
  } else {
    process.stdout.write(serialized);
  }
  if (pending.length) {
    if (options.apply) {
      console.error('Migração não aplicada: resolva todos os itens de pending.');
    }
    process.exitCode = 2;
  }
}

if (require.main === module) {
  migrate().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

module.exports = {
  catalogIndexes,
  divisionDocumentId,
  normalize,
  resolveExercise,
};
