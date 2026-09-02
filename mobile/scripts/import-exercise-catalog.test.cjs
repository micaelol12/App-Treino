const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildCatalog,
  groupTranslationBatches,
  parseArguments,
  taxonomyDocuments,
} = require('./import-exercise-catalog.cjs');

test('bloqueia apply sem confirmação exata do projeto', () => {
  assert.throws(
    () =>
      parseArguments([
        '--project',
        'producao',
        '--bucket',
        'producao.firebasestorage.app',
        '--apply',
      ]),
    /--confirm-project/,
  );
  assert.throws(
    () =>
      parseArguments([
        '--project',
        'producao',
        '--bucket',
        'producao.firebasestorage.app',
        '--confirm-project',
        'outro-projeto',
        '--apply',
      ]),
    /mesmo valor/,
  );
});

test('converte o dataset para o contrato do catálogo em português', () => {
  const source = {
    id: '0001',
    name: 'sit-up',
    category: 'waist',
    equipment: 'body weight',
    instruction_steps: { en: ['Lie down.', 'Raise your torso.'] },
    muscle_group: 'hip flexors',
    secondary_muscles: ['lower back'],
    target: 'abs',
    image: 'images/0001.jpg',
    gif_url: 'videos/0001.gif',
  };
  const translations = new Map([
    ['sit-up', 'Abdominal'],
    ['Lie down.', 'Deite-se.'],
    ['Raise your torso.', 'Eleve o tronco.'],
  ]);

  const [exercise] = buildCatalog([source], translations);

  assert.deepEqual(exercise, {
    id: '0001',
    name: 'Abdominal',
    force: null,
    level: 'nao-informado',
    mechanic: null,
    equipment: 'peso-do-corpo',
    primaryMuscles: ['abdominais'],
    secondaryMuscles: ['flexores-do-quadril', 'lombar'],
    instructions: ['Deite-se.', 'Eleve o tronco.'],
    category: 'abdomen',
    images: ['images/0001.jpg'],
    videoUrl: 'videos/0001.gif',
    active: true,
  });
  assert.equal(taxonomyDocuments([exercise]).musculos.length, 3);
});

test('limita lotes de tradução por quantidade e caracteres', () => {
  assert.deepEqual(
    groupTranslationBatches(
      Array.from({ length: 201 }, (_, index) => `texto-${index}`),
    ).map((batch) => batch.length),
    [100, 100, 1],
  );
  assert.deepEqual(
    groupTranslationBatches(['a'.repeat(15_000), 'b'.repeat(6_000)]).map(
      (batch) => batch.length,
    ),
    [1, 1],
  );
});
