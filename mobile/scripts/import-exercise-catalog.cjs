const fs = require('node:fs');
const path = require('node:path');
const { createHash, randomUUID } = require('node:crypto');

const { applicationDefault, getApps, initializeApp } = require('firebase-admin/app');
const { Timestamp, getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

const REPOSITORY_ROOT = path.resolve(__dirname, '../..');
const DEFAULT_DATASET =
  'C:\\Users\\User\\Desktop\\Micael\\code\\exercises-dataset\\data\\exercises.json';
const DEFAULT_OUTPUT = path.join(REPOSITORY_ROOT, 'firebase/import/exercises.pt-BR.json');
const DEFAULT_CACHE = path.join(
  REPOSITORY_ROOT,
  'firebase/import/.exercise-translations.pt-BR.json',
);
const CATALOG_COLLECTIONS = [
  'exercicios',
  'equipamentos',
  'categorias',
  'forcas',
  'niveis',
  'mecanicas',
  'musculos',
];

const CATEGORY_MAP = {
  back: 'costas',
  cardio: 'cardio',
  chest: 'peito',
  'lower arms': 'antebracos',
  'lower legs': 'panturrilhas',
  neck: 'pescoco',
  shoulders: 'ombros',
  'upper arms': 'bracos',
  'upper legs': 'pernas',
  waist: 'abdomen',
};

const EQUIPMENT_MAP = {
  assisted: 'assistido',
  band: 'faixa',
  barbell: 'barra',
  'body weight': 'peso-do-corpo',
  'bosu ball': 'bosu',
  cable: 'cabo',
  dumbbell: 'halteres',
  'elliptical machine': 'eliptico',
  'ez barbell': 'barra-w',
  hammer: 'martelo',
  kettlebell: 'kettlebell',
  'leverage machine': 'maquina-articulada',
  'medicine ball': 'bola-medicinal',
  'olympic barbell': 'barra-olimpica',
  'resistance band': 'faixa-de-resistencia',
  roller: 'rolo',
  rope: 'corda',
  'skierg machine': 'maquina-ski-erg',
  'sled machine': 'treno',
  'smith machine': 'maquina-smith',
  'stability ball': 'bola-de-estabilidade',
  'stationary bike': 'bicicleta-ergometrica',
  'stepmill machine': 'simulador-de-escada',
  tire: 'pneu',
  'trap bar': 'barra-hexagonal',
  'upper body ergometer': 'ergometro-de-bracos',
  weighted: 'com-peso',
  'wheel roller': 'roda-abdominal',
};

const MUSCLE_MAP = {
  abductors: 'abdutores',
  abdominals: 'abdominais',
  abs: 'abdominais',
  adductors: 'adutores',
  'ankle stabilizers': 'estabilizadores-do-tornozelo',
  ankles: 'tornozelos',
  back: 'costas',
  biceps: 'biceps',
  brachialis: 'braquial',
  calves: 'panturrilhas',
  'cardiovascular system': 'sistema-cardiovascular',
  chest: 'peito',
  core: 'core',
  deltoids: 'deltoides',
  delts: 'deltoides',
  forearms: 'antebracos',
  feet: 'pes',
  glutes: 'gluteos',
  groin: 'virilha',
  'grip muscles': 'musculos-da-pegada',
  hamstrings: 'isquiotibiais',
  hands: 'maos',
  'hip flexors': 'flexores-do-quadril',
  lats: 'dorsais',
  'latissimus dorsi': 'dorsais',
  'levator scapulae': 'levantador-da-escapula',
  'lower back': 'lombar',
  'lower abs': 'abdominais-inferiores',
  obliques: 'obliquos',
  pectorals: 'peito',
  quadriceps: 'quadriceps',
  quads: 'quadriceps',
  'rear deltoids': 'deltoides-posteriores',
  rhomboids: 'romboides',
  'rotator cuff': 'manguito-rotador',
  serratus: 'serril-anterior',
  'serratus anterior': 'serril-anterior',
  shoulders: 'ombros',
  shins: 'tibiais-anteriores',
  soleus: 'soleo',
  spine: 'coluna',
  sternocleidomastoid: 'esternocleidomastoideo',
  trapezius: 'trapezio',
  traps: 'trapezio',
  triceps: 'triceps',
  'upper back': 'parte-superior-das-costas',
  'upper chest': 'parte-superior-do-peito',
  'inner thighs': 'parte-interna-das-coxas',
  'wrist extensors': 'extensores-do-punho',
  'wrist flexors': 'flexores-do-punho',
  wrists: 'punhos',
};

const LABELS = {
  abdomen: 'Abdômen',
  abdutores: 'Abdutores',
  abdominais: 'Abdominais',
  'abdominais-inferiores': 'Abdominais inferiores',
  adutores: 'Adutores',
  antebracos: 'Antebraços',
  assistido: 'Assistido',
  'barra-hexagonal': 'Barra hexagonal',
  'barra-olimpica': 'Barra olímpica',
  'barra-w': 'Barra W',
  'bicicleta-ergometrica': 'Bicicleta ergométrica',
  bracos: 'Braços',
  braquial: 'Braquial',
  'bola-de-estabilidade': 'Bola de estabilidade',
  'bola-medicinal': 'Bola medicinal',
  'com-peso': 'Com peso',
  costas: 'Costas',
  deltoides: 'Deltoides',
  'deltoides-posteriores': 'Deltoides posteriores',
  dorsais: 'Dorsais',
  eliptico: 'Elíptico',
  'ergometro-de-bracos': 'Ergômetro de braços',
  'estabilizadores-do-tornozelo': 'Estabilizadores do tornozelo',
  'extensores-do-punho': 'Extensores do punho',
  'faixa-de-resistencia': 'Faixa de resistência',
  'flexores-do-punho': 'Flexores do punho',
  'flexores-do-quadril': 'Flexores do quadril',
  gluteos: 'Glúteos',
  halteres: 'Halteres',
  isquiotibiais: 'Isquiotibiais',
  'levantador-da-escapula': 'Levantador da escápula',
  lombar: 'Lombar',
  maos: 'Mãos',
  'maquina-articulada': 'Máquina articulada',
  'maquina-ski-erg': 'Máquina SkiErg',
  'maquina-smith': 'Máquina Smith',
  'manguito-rotador': 'Manguito rotador',
  'musculos-da-pegada': 'Músculos da pegada',
  'nao-informado': 'Não informado',
  obliquos: 'Oblíquos',
  ombros: 'Ombros',
  panturrilhas: 'Panturrilhas',
  'parte-interna-das-coxas': 'Parte interna das coxas',
  'parte-superior-do-peito': 'Parte superior do peito',
  pernas: 'Pernas',
  pescoco: 'Pescoço',
  pes: 'Pés',
  'peso-do-corpo': 'Peso do corpo',
  quadriceps: 'Quadríceps',
  'roda-abdominal': 'Roda abdominal',
  romboides: 'Romboides',
  'serril-anterior': 'Serrátil anterior',
  'simulador-de-escada': 'Simulador de escada',
  soleo: 'Sóleo',
  'sistema-cardiovascular': 'Sistema cardiovascular',
  tornozelos: 'Tornozelos',
  'tibiais-anteriores': 'Tibiais anteriores',
  trapezio: 'Trapézio',
  triceps: 'Tríceps',
  virilha: 'Virilha',
  esternocleidomastoideo: 'Esternocleidomastoideo',
};

function usage() {
  return `Uso:
  npm run catalog:import -- --project <firebase-project-id> [opções]

Opções:
  --dataset <arquivo>             Origem JSON (padrão: ${DEFAULT_DATASET})
  --output <arquivo>              Catálogo pt-BR preparado (padrão: ${DEFAULT_OUTPUT})
  --translation-cache <arquivo>   Cache retomável das traduções
  --translation-project <id>      Projeto da Cloud Translation API (padrão: --project)
  --bucket <nome>                 Bucket do Firebase Storage (obrigatório com --apply)
  --apply                         Substitui o catálogo remoto
  --confirm-project <id>          Deve ser idêntico a --project com --apply
  --help                          Mostra esta ajuda

Sem --apply, o script traduz, valida e grava somente o arquivo pt-BR local.
Credenciais: GOOGLE_APPLICATION_CREDENTIALS ou gcloud auth application-default login.
O projeto precisa ter a Cloud Translation API habilitada para traduções ainda não cacheadas.`;
}

function parseArguments(arguments_) {
  const options = {
    apply: false,
    datasetPath: DEFAULT_DATASET,
    outputPath: DEFAULT_OUTPUT,
    cachePath: DEFAULT_CACHE,
  };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === '--apply') options.apply = true;
    else if (argument === '--help') options.help = true;
    else if (argument === '--project') options.projectId = arguments_[++index];
    else if (argument === '--bucket') options.bucket = arguments_[++index];
    else if (argument === '--dataset') options.datasetPath = arguments_[++index];
    else if (argument === '--output') options.outputPath = arguments_[++index];
    else if (argument === '--translation-cache') options.cachePath = arguments_[++index];
    else if (argument === '--translation-project') {
      options.translationProjectId = arguments_[++index];
    } else if (argument === '--confirm-project') {
      options.confirmProjectId = arguments_[++index];
    } else throw new Error(`Argumento desconhecido: ${argument}`);
  }
  if (options.help) return options;
  if (!options.projectId) throw new Error('Informe --project <firebase-project-id>.');
  options.translationProjectId ??= options.projectId;
  if (options.apply && !options.bucket) {
    throw new Error('Informe --bucket <nome-do-bucket> para usar --apply.');
  }
  if (options.apply && options.confirmProjectId !== options.projectId) {
    throw new Error(
      'Por segurança, use --confirm-project com exatamente o mesmo valor de --project.',
    );
  }
  return options;
}

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.resolve(filename), 'utf8'));
}

function writeJson(filename, value) {
  const absolute = path.resolve(filename);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function sourceHash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function loadTranslationCache(filename) {
  if (!fs.existsSync(path.resolve(filename))) {
    return { schemaVersion: 1, sourceLanguage: 'en', targetLanguage: 'pt', entries: {} };
  }
  const cache = readJson(filename);
  if (
    cache?.schemaVersion !== 1 ||
    cache?.sourceLanguage !== 'en' ||
    cache?.targetLanguage !== 'pt' ||
    !cache.entries ||
    typeof cache.entries !== 'object'
  ) {
    throw new Error(`Cache de tradução incompatível: ${filename}`);
  }
  return cache;
}

function groupTranslationBatches(texts) {
  const batches = [];
  let current = [];
  let characters = 0;
  for (const text of texts) {
    if (current.length >= 100 || (current.length && characters + text.length > 20_000)) {
      batches.push(current);
      current = [];
      characters = 0;
    }
    current.push(text);
    characters += text.length;
  }
  if (current.length) batches.push(current);
  return batches;
}

async function delay(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function translateBatch({ credential, projectId, texts }) {
  const endpoint = `https://translation.googleapis.com/v3/projects/${encodeURIComponent(
    projectId,
  )}/locations/global:translateText`;
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const { access_token: accessToken } = await credential.getAccessToken();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          contents: texts,
          mimeType: 'text/plain',
          sourceLanguageCode: 'en',
          targetLanguageCode: 'pt',
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        const error = new Error(
          `Cloud Translation respondeu ${response.status}: ${body}`,
        );
        error.retryable = response.status === 429 || response.status >= 500;
        throw error;
      }
      const body = await response.json();
      const translations = body.translations?.map((item) => item.translatedText);
      if (!translations || translations.length !== texts.length) {
        throw new Error(
          'A Cloud Translation retornou uma quantidade inesperada de textos.',
        );
      }
      return translations;
    } catch (error) {
      lastError = error;
      if (!error.retryable || attempt === 5) break;
      await delay(500 * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

async function translateAll({ texts, credential, projectId, cachePath }) {
  const cache = loadTranslationCache(cachePath);
  const distinct = [...new Set(texts.map((text) => text.trim()).filter(Boolean))];
  const missing = distinct.filter((text) => !cache.entries[sourceHash(text)]);
  const batches = groupTranslationBatches(missing);

  for (const [batchIndex, batch] of batches.entries()) {
    const translations = await translateBatch({ credential, projectId, texts: batch });
    for (const [index, source] of batch.entries()) {
      cache.entries[sourceHash(source)] = {
        source,
        translated: translations[index].trim(),
      };
    }
    writeJson(cachePath, cache);
    console.log(
      `Tradução: lote ${batchIndex + 1}/${batches.length} salvo no cache (${batch.length} textos).`,
    );
  }

  return new Map(
    distinct.map((source) => [source, cache.entries[sourceHash(source)].translated]),
  );
}

function mapRequired(map, value, field, exerciseId) {
  const mapped = map[value];
  if (!mapped) {
    throw new Error(
      `Valor sem mapeamento em ${field} do exercício ${exerciseId}: ${value}`,
    );
  }
  return mapped;
}

function buildCatalog(sourceExercises, translations) {
  return sourceExercises.map((source) => {
    const instructions = source.instruction_steps?.en;
    if (!Array.isArray(instructions) || instructions.length === 0) {
      throw new Error(`Exercício ${source.id} não possui instruction_steps.en.`);
    }
    const primaryMuscle = mapRequired(MUSCLE_MAP, source.target, 'target', source.id);
    const secondaryMuscles = [source.muscle_group, ...(source.secondary_muscles ?? [])]
      .map((muscle) => mapRequired(MUSCLE_MAP, muscle, 'secondary_muscles', source.id))
      .filter(
        (muscle, index, values) =>
          muscle !== primaryMuscle && values.indexOf(muscle) === index,
      );

    return {
      id: source.id,
      name: translations.get(source.name.trim()),
      force: null,
      level: 'nao-informado',
      mechanic: null,
      equipment: mapRequired(EQUIPMENT_MAP, source.equipment, 'equipment', source.id),
      primaryMuscles: [primaryMuscle],
      secondaryMuscles,
      instructions: instructions.map((instruction) =>
        translations.get(instruction.trim()),
      ),
      category: mapRequired(CATEGORY_MAP, source.category, 'category', source.id),
      images: [source.image],
      videoUrl: source.gif_url,
      active: true,
    };
  });
}

function validateCatalog(catalog, datasetRoot) {
  if (!Array.isArray(catalog) || catalog.length === 0) {
    throw new Error('O catálogo preparado está vazio.');
  }
  const ids = new Set();
  for (const exercise of catalog) {
    if (!/^\d{4}$/.test(exercise.id) || ids.has(exercise.id)) {
      throw new Error(`ID inválido ou duplicado: ${exercise.id}`);
    }
    ids.add(exercise.id);
    if (!exercise.name || exercise.name.length > 160) {
      throw new Error(`Nome inválido no exercício ${exercise.id}.`);
    }
    if (
      !exercise.instructions.length ||
      exercise.instructions.length > 50 ||
      exercise.instructions.some((instruction) => !instruction?.trim())
    ) {
      throw new Error(`Quantidade de instruções inválida no exercício ${exercise.id}.`);
    }
    const localFiles = [...exercise.images, exercise.videoUrl];
    for (const relativeFilename of localFiles) {
      const absolute = resolveDatasetMedia(datasetRoot, relativeFilename);
      if (!fs.existsSync(absolute)) {
        throw new Error(`Mídia ausente no exercício ${exercise.id}: ${absolute}`);
      }
      if (fs.statSync(absolute).size > 1024 * 1024) {
        throw new Error(`Mídia maior que 1 MiB no exercício ${exercise.id}: ${absolute}`);
      }
    }
  }
}

function resolveDatasetMedia(datasetRoot, relativeFilename) {
  const normalized = relativeFilename.replaceAll('/', path.sep);
  const absolute = path.resolve(datasetRoot, normalized);
  const root = `${path.resolve(datasetRoot)}${path.sep}`;
  if (!absolute.startsWith(root))
    throw new Error(`Caminho de mídia inseguro: ${relativeFilename}`);
  return absolute;
}

function humanizeSlug(value) {
  const text = value.replaceAll('-', ' ');
  return text.charAt(0).toLocaleUpperCase('pt-BR') + text.slice(1);
}

function taxonomyDocuments(catalog) {
  const specifications = [
    ['equipamentos', (exercise) => [exercise.equipment]],
    ['categorias', (exercise) => [exercise.category]],
    ['forcas', (exercise) => [exercise.force]],
    ['niveis', (exercise) => [exercise.level]],
    ['mecanicas', (exercise) => [exercise.mechanic]],
    [
      'musculos',
      (exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles],
    ],
  ];
  return Object.fromEntries(
    specifications.map(([collectionName, valuesFor]) => {
      const values = [
        ...new Set(
          catalog.flatMap(valuesFor).filter((value) => typeof value === 'string'),
        ),
      ].sort((left, right) => left.localeCompare(right, 'pt-BR'));
      return [
        collectionName,
        values.map((id, index) => ({
          id,
          name: LABELS[id] ?? humanizeSlug(id),
          active: true,
          order: index + 1,
          exerciseCount: catalog.filter((exercise) => valuesFor(exercise).includes(id))
            .length,
          schemaVersion: 1,
        })),
      ];
    }),
  );
}

async function runWithConcurrency(items, concurrency, operation) {
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await operation(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
}

function downloadUrl(bucketName, objectName, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(
    bucketName,
  )}/o/${encodeURIComponent(objectName)}?alt=media&token=${token}`;
}

async function uploadStagingMedia({ bucket, catalog, datasetRoot, runId }) {
  const media = catalog.flatMap((exercise) => [
    ...exercise.images.map((relativeFilename) => ({
      exerciseId: exercise.id,
      kind: 'images',
      relativeFilename,
      contentType: 'image/jpeg',
    })),
    {
      exerciseId: exercise.id,
      kind: 'videos',
      relativeFilename: exercise.videoUrl,
      contentType: 'image/gif',
    },
  ]);
  const uploaded = [];
  await runWithConcurrency(media, 12, async (item, index) => {
    const filename = path.basename(item.relativeFilename);
    const stagingPath = `_exercise-imports/${runId}/${item.exerciseId}/${item.kind}/${filename}`;
    const finalPath = `exercise-media/${item.exerciseId}/${item.kind}/${filename}`;
    const token = randomUUID();
    await bucket.upload(resolveDatasetMedia(datasetRoot, item.relativeFilename), {
      destination: stagingPath,
      resumable: false,
      metadata: {
        contentType: item.contentType,
        cacheControl: 'public,max-age=31536000,immutable',
        metadata: { firebaseStorageDownloadTokens: token, exerciseImportRunId: runId },
      },
    });
    uploaded[index] = { ...item, stagingPath, finalPath, token };
    if ((index + 1) % 100 === 0 || index + 1 === media.length) {
      console.log(
        `Storage: ${index + 1}/${media.length} arquivos enviados à área temporária.`,
      );
    }
  });
  return uploaded;
}

async function publishStagingMedia(bucket, uploaded) {
  await runWithConcurrency(uploaded, 12, async (item, index) => {
    await bucket.file(item.stagingPath).copy(bucket.file(item.finalPath));
    if ((index + 1) % 100 === 0 || index + 1 === uploaded.length) {
      console.log(`Storage: ${index + 1}/${uploaded.length} arquivos publicados.`);
    }
  });
}

function catalogWithRemoteMedia(catalog, uploaded, bucketName) {
  const byKey = new Map(
    uploaded.map((item) => [
      `${item.exerciseId}:${item.kind}`,
      downloadUrl(bucketName, item.finalPath, item.token),
    ]),
  );
  return catalog.map((exercise) => ({
    ...exercise,
    images: [byKey.get(`${exercise.id}:images`)],
    videoUrl: byKey.get(`${exercise.id}:videos`),
  }));
}

async function deleteExistingCatalog(database) {
  for (const collectionName of CATALOG_COLLECTIONS) {
    await database.recursiveDelete(database.collection(collectionName));
    console.log(`Firestore: coleção ${collectionName} removida.`);
  }
}

async function writeCatalog(database, catalog, taxonomies) {
  const now = Timestamp.now();
  const writer = database.bulkWriter();
  for (const exercise of catalog) {
    writer.set(database.collection('exercicios').doc(exercise.id), {
      ...exercise,
      createdAt: now,
      updatedAt: now,
    });
  }
  for (const [collectionName, documents] of Object.entries(taxonomies)) {
    for (const document of documents) {
      writer.set(database.collection(collectionName).doc(document.id), {
        ...document,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
  await writer.close();
  console.log(`Firestore: ${catalog.length} exercícios e taxonomias gravados.`);
}

async function removeStaleMedia(bucket, expectedPaths) {
  const [files] = await bucket.getFiles({ prefix: 'exercise-media/' });
  const stale = files.filter((file) => !expectedPaths.has(file.name));
  await runWithConcurrency(stale, 20, (file) => file.delete({ ignoreNotFound: true }));
  console.log(`Storage: ${stale.length} arquivos antigos removidos.`);
}

async function removeStaging(bucket, runId) {
  await bucket.deleteFiles({ prefix: `_exercise-imports/${runId}/`, force: true });
}

async function importRemote({ options, credential, catalog, taxonomies, datasetRoot }) {
  const app =
    getApps()[0] ??
    initializeApp({
      credential,
      projectId: options.projectId,
      storageBucket: options.bucket,
    });
  const database = getFirestore(app);
  const bucket = getStorage(app).bucket(options.bucket);
  const runId = `${new Date().toISOString().replaceAll(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
  let destructivePhaseStarted = false;

  try {
    const uploaded = await uploadStagingMedia({ bucket, catalog, datasetRoot, runId });
    await publishStagingMedia(bucket, uploaded);
    const remoteCatalog = catalogWithRemoteMedia(catalog, uploaded, bucket.name);
    const expectedPaths = new Set(uploaded.map((item) => item.finalPath));

    destructivePhaseStarted = true;
    await deleteExistingCatalog(database);
    await writeCatalog(database, remoteCatalog, taxonomies);
    await removeStaleMedia(bucket, expectedPaths);
    await removeStaging(bucket, runId);

    return { runId, remoteCatalog };
  } catch (error) {
    if (!destructivePhaseStarted) {
      await removeStaging(bucket, runId).catch(() => undefined);
    } else {
      console.error(
        `Falha após iniciar a substituição. A área temporária foi preservada em _exercise-imports/${runId}/ para recuperação.`,
      );
    }
    throw error;
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const datasetPath = path.resolve(options.datasetPath);
  const datasetRoot = path.resolve(path.dirname(datasetPath), '..');
  const sourceExercises = readJson(datasetPath);
  if (!Array.isArray(sourceExercises) || !sourceExercises.length) {
    throw new Error('O dataset precisa ser um array JSON não vazio.');
  }

  const englishTexts = sourceExercises.flatMap((exercise) => [
    exercise.name,
    ...(exercise.instruction_steps?.en ?? []),
  ]);
  const credential = applicationDefault();
  const translations = await translateAll({
    texts: englishTexts,
    credential,
    projectId: options.translationProjectId,
    cachePath: options.cachePath,
  });
  const catalog = buildCatalog(sourceExercises, translations);
  validateCatalog(catalog, datasetRoot);
  const taxonomies = taxonomyDocuments(catalog);
  writeJson(options.outputPath, catalog);

  console.log(
    `Catálogo pt-BR validado: ${catalog.length} exercícios. Arquivo: ${path.resolve(options.outputPath)}`,
  );
  if (!options.apply) {
    console.log(
      'Simulação concluída. O Firebase não foi alterado; use --apply para substituir o catálogo.',
    );
    return;
  }

  const result = await importRemote({
    options,
    credential,
    catalog,
    taxonomies,
    datasetRoot,
  });
  writeJson(options.outputPath, result.remoteCatalog);
  console.log(
    `Importação ${result.runId} concluída no projeto ${options.projectId} e bucket ${options.bucket}.`,
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

module.exports = {
  CATEGORY_MAP,
  EQUIPMENT_MAP,
  MUSCLE_MAP,
  buildCatalog,
  groupTranslationBatches,
  parseArguments,
  taxonomyDocuments,
  validateCatalog,
};
