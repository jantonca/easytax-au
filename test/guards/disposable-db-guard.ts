/**
 * Disposable-database guard for the jest integration suites.
 *
 * These suites import AppModule (which connects and runs migrations) and
 * delete all application data between tests. They must therefore only ever
 * run against an explicitly marked disposable database. Call
 * {@link assertDisposableDatabaseTarget} at the top of a suite, before
 * anything reads application configuration.
 *
 * Enforced conditions:
 * - NODE_ENV is exactly "test";
 * - DB_NAME contains "test" or "audit" as a separator-bounded token
 *   (e.g. easytax_it_au_disposable_test, easytax_audit) — accidental
 *   substrings like "contest" are rejected;
 * - DB_PORT is set and numeric (the executor must point at the intended
 *   disposable instance — an unset port would silently default to 5432);
 * - DB_HOST and DB_USERNAME are set explicitly.
 *
 * This is a configuration check, not proof of infrastructure isolation; the
 * operator is still responsible for pointing DB_* at a disposable instance
 * (see docs/audits/MAINTENANCE-REMEDIATION-2026-09.md section 9).
 */
const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[disposable-db-guard] ${name} must be set explicitly. ` +
        'These suites refuse to run with ambient application configuration. ' +
        'See docs/audits/MAINTENANCE-REMEDIATION-2026-09.md section 9.',
    );
  }
  return value;
};

export function assertDisposableDatabaseTarget(): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      `[disposable-db-guard] NODE_ENV must be "test" (got "${process.env.NODE_ENV ?? 'unset'}").`,
    );
  }

  const dbName = requiredEnv('DB_NAME');
  if (!/(?:^|[-_])(?:test|audit)(?:$|[-_])/i.test(dbName)) {
    throw new Error(
      `[disposable-db-guard] DB_NAME "${dbName}" does not look disposable ` +
        '(must contain "test" or "audit" as a separated token). These suites ' +
        'delete all application data and must never run against an ' +
        'application or production database.',
    );
  }

  const dbPort = requiredEnv('DB_PORT');
  const port = Number(dbPort);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`[disposable-db-guard] DB_PORT "${dbPort}" is not a valid TCP port.`);
  }

  requiredEnv('DB_HOST');
  requiredEnv('DB_USERNAME');
}
