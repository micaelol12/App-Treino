const fs = require('node:fs');
const path = require('node:path');

const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, writeBatch } = require('firebase/firestore');

const PROJECT_ID = 'demo-app-treino';
const FIRESTORE_HOST = '127.0.0.1';
const FIRESTORE_PORT = 8080;

async function seedFirestoreEmulator() {
  const fixturePath = path.resolve(
    __dirname,
    '../../docs/migration/phase-0/fixtures/firestore-baseline.json',
  );
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: FIRESTORE_HOST,
      port: FIRESTORE_PORT,
    },
  });

  try {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const database = context.firestore();
      const batch = writeBatch(database);

      for (const user of fixture.users) {
        for (const [collectionName, documents] of Object.entries(
          user.collections,
        )) {
          for (const document of documents) {
            batch.set(
              doc(
                database,
                `usuarios/${user.fixtureUserId}/${collectionName}/${document.id}`,
              ),
              document.data,
            );
          }
        }
      }

      await batch.commit();
    });

    console.log(
      `Fixture v${fixture.fixtureVersion} loaded into ${PROJECT_ID} at ${FIRESTORE_HOST}:${FIRESTORE_PORT}.`,
    );
  } finally {
    await testEnvironment.cleanup();
  }
}

seedFirestoreEmulator().catch((error) => {
  console.error('Failed to seed the Firestore Emulator.', error);
  process.exitCode = 1;
});
