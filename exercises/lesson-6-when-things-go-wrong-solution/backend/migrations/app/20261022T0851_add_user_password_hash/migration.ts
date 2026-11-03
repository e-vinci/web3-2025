#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/36d08ae6dc4502531c6692b363c04e9aaa9077a6d14e61539dc4892da2e38a31/contract';
import endContract from '../../snapshots/36d08ae6dc4502531c6692b363c04e9aaa9077a6d14e61539dc4892da2e38a31/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/95f37b9b12fec5762ac676ab11c49cdd4c278d51c361c943fdefb78b8a34c160/contract';
import startContract from '../../snapshots/95f37b9b12fec5762ac676ab11c49cdd4c278d51c361c943fdefb78b8a34c160/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, placeholder } from '@prisma/orm-postgres/migration';
import postgres from '@prisma/orm-postgres/runtime';

const { sql: db, contract } = postgres<End>({ contractJson: endContract });

/**
 * The bcrypt hash of "topsecret".
 *
 * Why a value at all? `passwordHash` is NOT NULL, and the `user` table already
 * has rows. Every one of them needs something in the new column before the NOT
 * NULL constraint can be switched on. There is no correct answer the database
 * can work out for itself, so the migration has to supply one.
 *
 * Why this value? Because it is a course, and a demo database you can log into
 * is worth more than one nobody can open. In a real product you would write an
 * unguessable random value here — a different one for every row — so that the
 * column is full, no account is reachable, and every user is pushed through
 * "forgot my password". We have no password-reset feature, so we cannot do that
 * here without locking ourselves out.
 */
const DEMO_PASSWORD_HASH = '$2b$10$Uz3U4mBwsgUKte9bQKBNX.5LGJjYw1Z9Qvhxzy4gxdZrahpUU9/N2';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      // Step 1: add the column, nullable. A NOT NULL column cannot be added to
      // a table that already has rows — there would be nothing to put in it.
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('passwordHash', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      // Step 2: fill it. `check` describes the work that remains: rows whose
      // passwordHash is still null. The runner uses it twice — before, to see
      // whether there is anything to do, and after, to confirm there is not.
      this.dataTransform(contract, 'backfill-user-passwordHash', {
        check: () =>
          db.public.user.select('id').where((f, fns) => fns.eq(f.passwordHash, null)).limit(1),
        run: () =>
          db.public.user
            .update({ passwordHash: DEMO_PASSWORD_HASH })
            .where((f, fns) => fns.eq(f.passwordHash, null)),
      }),
      // Step 3: only now can the constraint go on.
      this.setNotNull({ schema: 'public', table: 'user', column: 'passwordHash' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
