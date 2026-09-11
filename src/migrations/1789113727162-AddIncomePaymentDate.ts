import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIncomePaymentDate1789113727162 implements MigrationInterface {
  name = 'AddIncomePaymentDate1789113727162';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "incomes" ADD "payment_date" date`);
    await queryRunner.query(
      `CREATE INDEX "idx_incomes_payment_date" ON "incomes" ("payment_date") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_incomes_payment_date"`);
    await queryRunner.query(`ALTER TABLE "incomes" DROP COLUMN "payment_date"`);
  }
}
