// src/server/sql/apply.js
//
// One-off migration runner. Uses the app's own pool, so it inherits whatever
// host / SSL / credentials db.js already has working.
//
//   node src/server/sql/apply.js
//
// Safe to run twice: the schema uses CREATE TABLE IF NOT EXISTS and the seed
// rows are guarded by a UNIQUE key on action_type.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(here, '001_credits.sql');

/** Strip `--` comments (whole-line and trailing) and split into statements. */
function statements(sql) {
  return sql
    .split('\n')
    .map((line) => {
      const i = line.indexOf('--');
      return i === -1 ? line : line.slice(0, i);
    })
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}
async function main() {
  const sql = await fs.readFile(file, 'utf8');
  const stmts = statements(sql);

  console.log(`Applying ${stmts.length} statements from 001_credits.sql\n`);

  for (const [i, stmt] of stmts.entries()) {
    const label = stmt.slice(0, 60).replace(/\s+/g, ' ');
    try {
      await pool.query(stmt);
      console.log(`  ok   [${i + 1}] ${label}...`);
    } catch (err) {
      // Duplicate seed rows on a re-run are expected, not a failure.
      if (err.code === 'ER_DUP_ENTRY') {
        console.log(`  skip [${i + 1}] already seeded`);
        continue;
      }
      console.error(`  FAIL [${i + 1}] ${label}...`);
      console.error(`       ${err.code}: ${err.sqlMessage ?? err.message}`);
      throw err;
    }
  }

  console.log('\nVerifying:');
  const [[types]] = await pool.query(
    'SELECT COUNT(*) AS n FROM engine4_credit_actiontypes',
  );
  const [[earning]] = await pool.query(
    'SELECT COUNT(*) AS n FROM engine4_credit_actiontypes WHERE credit > 0',
  );
  const [[balances]] = await pool.query(
    'SELECT COUNT(*) AS n FROM engine4_credit_balances',
  );
  const [[logs]] = await pool.query(
    'SELECT COUNT(*) AS n FROM engine4_credit_logs',
  );

  console.log(`  action types : ${types.n}  (expect 33)`);
  console.log(`  earning rules: ${earning.n}  (expect 21)`);
  console.log(`  balance rows : ${balances.n}  (one per existing user)`);
  console.log(`  log rows     : ${logs.n}  (expect 0)`);

  await pool.end();
}

main().catch(async (err) => {
  console.error('\nMigration aborted.', err.message);
  try { await pool.end(); } catch { /* ignore */ }
  process.exit(1);
});