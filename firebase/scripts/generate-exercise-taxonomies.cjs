const fs = require("node:fs");
const path = require("node:path");

const [, , inputArgument, outputArgument] = process.argv;

if (!inputArgument) {
  console.error(
    "Uso: node firebase/scripts/generate-exercise-taxonomies.cjs <exercises.json> [output-directory]",
  );
  process.exit(1);
}

const inputPath = path.resolve(inputArgument);
const outputDirectory = path.resolve(
  outputArgument ?? path.join(__dirname, "..", "import", "exercise-taxonomies"),
);

const labels = {
  "bola-de-exercicio": "Bola de exercício",
  "bola-medicinal": "Bola medicinal",
  "barra-w": "Barra W",
  maquina: "Máquina",
  "peso-do-corpo": "Peso do corpo",
  "rolo-de-espuma": "Rolo de espuma",
  forca: "Força",
  "levantamento-olimpico": "Levantamento olímpico",
  pliometria: "Pliometria",
  push: "Empurrar",
  pull: "Puxar",
  static: "Estática",
  avancado: "Avançado",
  intermediario: "Intermediário",
  composto: "Composto",
  isolado: "Isolado",
  abdominais: "Abdominais",
  abdutores: "Abdutores",
  adutores: "Adutores",
  antebracos: "Antebraços",
  biceps: "Bíceps",
  dorsais: "Dorsais",
  gluteos: "Glúteos",
  "inferior-das-costas": "Inferior das costas",
  isquiotibiais: "Isquiotibiais",
  "meio-das-costas": "Meio das costas",
  ombros: "Ombros",
  panturrilhas: "Panturrilhas",
  peito: "Peito",
  pescoco: "Pescoço",
  quadriceps: "Quadríceps",
  trapezio: "Trapézio",
  triceps: "Tríceps",
};

const specifications = [
  {
    sourceField: "equipment",
    collection: "equipamentos",
    order: [
      "peso-do-corpo",
      "halteres",
      "barra",
      "barra-w",
      "cabo",
      "maquina",
      "kettlebell",
      "faixas",
      "bola-de-exercicio",
      "bola-medicinal",
      "rolo-de-espuma",
      "outros",
    ],
  },
  {
    sourceField: "category",
    collection: "categorias",
    order: [
      "forca",
      "alongamento",
      "cardio",
      "powerlifting",
      "levantamento-olimpico",
      "pliometria",
      "strongman",
    ],
  },
  {
    sourceField: "force",
    collection: "forcas",
    order: ["push", "pull", "static"],
  },
  {
    sourceField: "level",
    collection: "niveis",
    order: ["iniciante", "intermediario", "avancado"],
  },
  {
    sourceField: "mechanic",
    collection: "mecanicas",
    order: ["composto", "isolado"],
  },
];

function fallbackLabel(value) {
  const label = value.replaceAll("-", " ");
  return label.charAt(0).toLocaleUpperCase("pt-BR") + label.slice(1);
}

function orderedValues(values, preferredOrder) {
  const distinct = [
    ...new Set(values.filter((value) => typeof value === "string")),
  ];
  const preferred = preferredOrder.filter((value) => distinct.includes(value));
  const remaining = distinct
    .filter((value) => !preferredOrder.includes(value))
    .sort((left, right) => left.localeCompare(right, "pt-BR"));
  return [...preferred, ...remaining];
}

function writeJson(filename, value) {
  fs.writeFileSync(
    path.join(outputDirectory, filename),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

const exercises = JSON.parse(fs.readFileSync(inputPath, "utf8"));
if (!Array.isArray(exercises)) {
  throw new TypeError(
    "O arquivo de origem deve conter um array JSON de exercícios.",
  );
}

fs.mkdirSync(outputDirectory, { recursive: true });

const manifestCollections = [];

for (const specification of specifications) {
  const values = orderedValues(
    exercises.map((exercise) => exercise[specification.sourceField]),
    specification.order,
  );
  const documents = values.map((id, index) => ({
    id,
    name: labels[id] ?? fallbackLabel(id),
    active: true,
    order: index + 1,
    exerciseCount: exercises.filter(
      (exercise) => exercise[specification.sourceField] === id,
    ).length,
    schemaVersion: 1,
  }));
  const filename = `${specification.collection}.json`;

  writeJson(filename, documents);
  manifestCollections.push({
    name: specification.collection,
    sourceFields: [specification.sourceField],
    file: filename,
    documentCount: documents.length,
    nullExerciseCount: exercises.filter(
      (exercise) => exercise[specification.sourceField] == null,
    ).length,
    logicalIdField: "id",
    supportsAutomaticDocumentIds: true,
  });
}

const preferredMuscleOrder = [
  "peito",
  "dorsais",
  "meio-das-costas",
  "inferior-das-costas",
  "ombros",
  "trapezio",
  "biceps",
  "triceps",
  "antebracos",
  "abdominais",
  "gluteos",
  "quadriceps",
  "isquiotibiais",
  "adutores",
  "abdutores",
  "panturrilhas",
  "pescoco",
];
const muscleValues = orderedValues(
  exercises.flatMap((exercise) => [
    ...(exercise.primaryMuscles ?? []),
    ...(exercise.secondaryMuscles ?? []),
  ]),
  preferredMuscleOrder,
);
const muscleDocuments = muscleValues.map((id, index) => {
  const primaryExerciseCount = exercises.filter((exercise) =>
    (exercise.primaryMuscles ?? []).includes(id),
  ).length;
  const secondaryExerciseCount = exercises.filter((exercise) =>
    (exercise.secondaryMuscles ?? []).includes(id),
  ).length;

  return {
    id,
    name: labels[id] ?? fallbackLabel(id),
    active: true,
    order: index + 1,
    exerciseCount: exercises.filter(
      (exercise) =>
        (exercise.primaryMuscles ?? []).includes(id) ||
        (exercise.secondaryMuscles ?? []).includes(id),
    ).length,
    primaryExerciseCount,
    secondaryExerciseCount,
    schemaVersion: 1,
  };
});

writeJson("musculos.json", muscleDocuments);
manifestCollections.push({
  name: "musculos",
  sourceFields: ["primaryMuscles", "secondaryMuscles"],
  file: "musculos.json",
  documentCount: muscleDocuments.length,
  nullExerciseCount: exercises.filter(
    (exercise) =>
      !(exercise.primaryMuscles?.length || exercise.secondaryMuscles?.length),
  ).length,
  logicalIdField: "id",
  supportsAutomaticDocumentIds: true,
});

writeJson("manifest.json", {
  schemaVersion: 1,
  sourceFile: path.basename(inputPath),
  sourceExerciseCount: exercises.length,
  collections: manifestCollections,
});

console.log(
  `${manifestCollections.length} coleções geradas em ${outputDirectory} a partir de ${exercises.length} exercícios.`,
);
