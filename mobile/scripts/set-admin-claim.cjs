const { applicationDefault, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const email = process.argv[2];

if (!email) {
  console.error('Uso: node scripts/set-admin-claim.cjs usuario@email.com');
  process.exit(1);
}

const usingEmulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);

initializeApp(
  usingEmulator
    ? { projectId: process.env.GCLOUD_PROJECT ?? 'demo-app-treino' }
    : { credential: applicationDefault() },
);

async function main() {
  const auth = getAuth();
  const user = await auth.getUserByEmail(email);

  // Preserva outras claims que o usuário já tenha.
  await auth.setCustomUserClaims(user.uid, {
    ...(user.customClaims ?? {}),
    admin: true,
  });

  console.log(`Claim admin adicionada para ${email} (${user.uid}).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});