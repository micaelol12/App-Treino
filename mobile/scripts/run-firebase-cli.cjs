const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const mobileRoot = path.resolve(__dirname, '..');
const bundledNode = path.join(
  mobileRoot,
  'node_modules',
  'node',
  'bin',
  process.platform === 'win32' ? 'node.exe' : 'node',
);
const firebaseCli = path.join(
  mobileRoot,
  'node_modules',
  'firebase-tools',
  'lib',
  'bin',
  'firebase.js',
);
const firebaseRuntimeRoot = path.join(mobileRoot, '.firebase-runtime');
const firebaseEnvironment = {
  ...process.env,
  XDG_CONFIG_HOME: path.join(firebaseRuntimeRoot, 'config'),
  FIREBASE_EMULATORS_PATH: path.join(firebaseRuntimeRoot, 'emulators'),
};

if (process.platform === 'win32') {
  const programFilesRoot = process.env.ProgramFiles ?? 'C:\\Program Files';
  const microsoftRuntimeRoot = path.join(programFilesRoot, 'Microsoft');
  const jdkDirectory = fs.existsSync(microsoftRuntimeRoot)
    ? fs
        .readdirSync(microsoftRuntimeRoot, { withFileTypes: true })
        .find((entry) => entry.isDirectory() && entry.name.startsWith('jdk-21'))
    : undefined;

  if (jdkDirectory) {
    const javaBin = path.join(microsoftRuntimeRoot, jdkDirectory.name, 'bin');
    const pathEnvironmentKey =
      Object.keys(process.env).find((key) => key.toLowerCase() === 'path') ??
      'PATH';
    firebaseEnvironment[pathEnvironmentKey] =
      `${javaBin}${path.delimiter}${process.env[pathEnvironmentKey] ?? ''}`;
  }
}

const result = spawnSync(bundledNode, [firebaseCli, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: firebaseEnvironment,
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
