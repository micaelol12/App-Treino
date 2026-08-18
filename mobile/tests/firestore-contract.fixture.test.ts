import fs from 'node:fs';
import path from 'node:path';

import { mapWorkoutConfigDocument } from '../src/features/workout-plans/infrastructure/firestore/workout-config.mapper';
import { mapWorkoutHistoryDocument } from '../src/features/workout-session/infrastructure/firestore/workout-history.mapper';
import { mapWeightEntryDocument } from '../src/features/weight/infrastructure/firestore/weight-entry.mapper';

interface FixtureDocument {
  readonly id: string;
  readonly data: unknown;
}

interface FixtureUser {
  readonly fixtureUserId: string;
  readonly collections: {
    readonly config_treinos: readonly FixtureDocument[];
    readonly historico_treinos: readonly FixtureDocument[];
    readonly historico_pesos: readonly FixtureDocument[];
  };
}

interface FirestoreFixture {
  readonly fixtureVersion: number;
  readonly users: readonly FixtureUser[];
}

function loadFixture(): FirestoreFixture {
  const fixturePath = path.resolve(
    __dirname,
    '../../docs/migration/phase-0/fixtures/firestore-baseline.json',
  );

  return JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as FirestoreFixture;
}

describe('phase 0 Firestore fixture contract', () => {
  it('maps every legacy document without accessing Firebase', () => {
    const fixture = loadFixture();
    const primaryUser = fixture.users.find(
      (user) => user.fixtureUserId === 'qa_primary_user',
    );

    expect(primaryUser).toBeDefined();

    const plans = primaryUser!.collections.config_treinos.map((document) =>
      mapWorkoutConfigDocument(document.id, document.data),
    );
    const history = primaryUser!.collections.historico_treinos.map((document) =>
      mapWorkoutHistoryDocument(document.id, document.data),
    );
    const weights = primaryUser!.collections.historico_pesos.map((document) =>
      mapWeightEntryDocument(document.id, document.data),
    );

    expect(plans).toHaveLength(5);
    expect(history).toHaveLength(4);
    expect(weights).toHaveLength(8);
    expect(plans.find((plan) => plan.id === 'legacy:push_legacy_sem_ordem')?.order).toBe(
      99,
    );
  });
});
