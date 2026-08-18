import fs from 'node:fs';
import path from 'node:path';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

const PROJECT_ID = 'demo-app-treino';
const ONE_MEGABYTE = 1024 * 1024;

let testEnvironment: RulesTestEnvironment;

beforeAll(async () => {
  const rulesPath = path.resolve(__dirname, '../../firebase/storage.rules');
  testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: { rules: fs.readFileSync(rulesPath, 'utf8') },
  });
});

beforeEach(async () => {
  await testEnvironment.clearStorage();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

function upload(
  user: 'admin' | 'regular',
  objectPath: string,
  size: number,
  contentType: string,
) {
  const claims = user === 'admin' ? { admin: true } : undefined;
  const storage = testEnvironment.authenticatedContext(user, claims).storage();
  return storage.ref(objectPath).put(new Uint8Array(size), { contentType });
}

describe('exercise media storage rules', () => {
  it('accepts supported images up to and including 1 MB for administrators', async () => {
    await assertSucceeds(
      upload('admin', 'exercise-media/exercise-1/images/photo.jpg', ONE_MEGABYTE, 'image/jpeg'),
    );
  });

  it('rejects images larger than 1 MB and uploads from regular users', async () => {
    await assertFails(
      upload(
        'admin',
        'exercise-media/exercise-1/images/photo.png',
        ONE_MEGABYTE + 1,
        'image/png',
      ),
    );
    await assertFails(
      upload('regular', 'exercise-media/exercise-1/images/photo.webp', 1, 'image/webp'),
    );
  });

  it('accepts only GIF animations up to and including 1 MB', async () => {
    await assertSucceeds(
      upload('admin', 'exercise-media/exercise-1/videos/demo.gif', ONE_MEGABYTE, 'image/gif'),
    );
    await assertFails(
      upload('admin', 'exercise-media/exercise-1/videos/demo.gif', ONE_MEGABYTE + 1, 'image/gif'),
    );
    await assertFails(
      upload('admin', 'exercise-media/exercise-1/videos/demo.mp4', 1, 'video/mp4'),
    );
  });
});
