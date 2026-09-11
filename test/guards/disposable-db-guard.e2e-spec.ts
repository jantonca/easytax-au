// Guard tests manipulate process.env directly and never touch a database.
// Globals (describe/it/expect/afterEach) are ambient via @types/jest, matching
// the project's other specs.
import { assertDisposableDatabaseTarget } from './disposable-db-guard';

describe('disposable-db-guard (S03)', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env.NODE_ENV = original.NODE_ENV;
    process.env.DB_NAME = original.DB_NAME;
    process.env.DB_PORT = original.DB_PORT;
    process.env.DB_HOST = original.DB_HOST;
    process.env.DB_USERNAME = original.DB_USERNAME;
  });

  const setValid = (): void => {
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME = 'easytax_it_au_disposable_test';
    process.env.DB_PORT = '5433';
    process.env.DB_HOST = 'localhost';
    process.env.DB_USERNAME = 'postgres';
  };

  it('accepts a complete, explicitly disposable target', () => {
    setValid();
    expect(() => assertDisposableDatabaseTarget()).not.toThrow();
  });

  it('rejects accidental substrings such as "contest" (S03)', () => {
    setValid();
    process.env.DB_NAME = 'contest';
    expect(() => assertDisposableDatabaseTarget()).toThrow(/does not look disposable/);
  });

  it('rejects names without a separated test/audit token', () => {
    setValid();
    process.env.DB_NAME = 'easytax-au';
    expect(() => assertDisposableDatabaseTarget()).toThrow(/does not look disposable/);
  });

  it('requires an explicit DB_PORT (S03)', () => {
    setValid();
    delete process.env.DB_PORT;
    expect(() => assertDisposableDatabaseTarget()).toThrow(/DB_PORT/);
  });

  it('rejects a non-numeric DB_PORT', () => {
    setValid();
    process.env.DB_PORT = 'not-a-port';
    expect(() => assertDisposableDatabaseTarget()).toThrow(/valid TCP port/);
  });

  it('rejects a non-test NODE_ENV', () => {
    setValid();
    process.env.NODE_ENV = 'development';
    expect(() => assertDisposableDatabaseTarget()).toThrow(/NODE_ENV must be "test"/);
  });

  it('requires DB_HOST and DB_USERNAME explicitly', () => {
    setValid();
    delete process.env.DB_HOST;
    expect(() => assertDisposableDatabaseTarget()).toThrow(/DB_HOST/);

    setValid();
    delete process.env.DB_USERNAME;
    expect(() => assertDisposableDatabaseTarget()).toThrow(/DB_USERNAME/);
  });
});
