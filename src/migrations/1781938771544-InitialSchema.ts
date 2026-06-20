import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1781938771544 implements MigrationInterface {
  name = 'InitialSchema1781938771544';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "bas_label" character varying(10) NOT NULL, "is_deductible" boolean NOT NULL DEFAULT true, "description" text, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "providers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "is_international" boolean NOT NULL DEFAULT false, "default_category_id" uuid, "abn_arn" character varying(20), CONSTRAINT "PK_af13fc2ebf382fe0dad2e4793aa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_providers_international" ON "providers" ("is_international") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recurring_expenses_schedule_enum" AS ENUM('monthly', 'quarterly', 'yearly')`,
    );
    await queryRunner.query(
      `CREATE TABLE "recurring_expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "description" text, "amount_cents" integer NOT NULL, "gst_cents" integer NOT NULL, "biz_percent" integer NOT NULL DEFAULT '100', "currency" character varying(3) NOT NULL DEFAULT 'AUD', "schedule" "public"."recurring_expenses_schedule_enum" NOT NULL DEFAULT 'monthly', "day_of_month" integer NOT NULL DEFAULT '1', "start_date" date NOT NULL, "end_date" date, "is_active" boolean NOT NULL DEFAULT true, "last_generated_date" date, "next_due_date" date NOT NULL, "provider_id" uuid NOT NULL, "category_id" uuid NOT NULL, CONSTRAINT "PK_592b47923f3bdb6035439182e66" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_recurring_expenses_next_due" ON "recurring_expenses" ("next_due_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_recurring_expenses_active" ON "recurring_expenses" ("is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_recurring_expenses_category" ON "recurring_expenses" ("category_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_recurring_expenses_provider" ON "recurring_expenses" ("provider_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" text NOT NULL, "abn" text, "is_psi_eligible" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "incomes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date" date NOT NULL, "invoice_num" character varying(50), "description" text, "subtotal_cents" integer NOT NULL, "gst_cents" integer NOT NULL, "total_cents" integer NOT NULL, "is_paid" boolean NOT NULL DEFAULT false, "client_id" uuid NOT NULL, CONSTRAINT "PK_d737b3d0314c1f0da5461a55e5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_incomes_is_paid" ON "incomes" ("is_paid") `);
    await queryRunner.query(`CREATE INDEX "idx_incomes_client" ON "incomes" ("client_id") `);
    await queryRunner.query(`CREATE INDEX "idx_incomes_date" ON "incomes" ("date") `);
    await queryRunner.query(
      `CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date" date NOT NULL, "description" text, "amount_cents" integer NOT NULL, "gst_cents" integer NOT NULL, "biz_percent" integer NOT NULL DEFAULT '100', "currency" character varying(3) NOT NULL DEFAULT 'AUD', "file_ref" character varying(255), "provider_id" uuid NOT NULL, "category_id" uuid NOT NULL, "import_job_id" uuid, CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_expenses_import_job" ON "expenses" ("import_job_id") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_expenses_provider" ON "expenses" ("provider_id") `);
    await queryRunner.query(`CREATE INDEX "idx_expenses_category" ON "expenses" ("category_id") `);
    await queryRunner.query(`CREATE INDEX "idx_expenses_date" ON "expenses" ("date") `);
    await queryRunner.query(
      `CREATE TYPE "public"."import_jobs_source_enum" AS ENUM('commbank', 'nab', 'westpac', 'anz', 'manual', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."import_jobs_status_enum" AS ENUM('pending', 'completed', 'rolled_back', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "import_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "filename" character varying(255) NOT NULL, "source" "public"."import_jobs_source_enum" NOT NULL DEFAULT 'manual', "status" "public"."import_jobs_status_enum" NOT NULL DEFAULT 'pending', "total_rows" integer NOT NULL DEFAULT '0', "imported_count" integer NOT NULL DEFAULT '0', "skipped_count" integer NOT NULL DEFAULT '0', "error_count" integer NOT NULL DEFAULT '0', "completed_at" TIMESTAMP WITH TIME ZONE, "error_message" text, CONSTRAINT "PK_4d206c602f173f98e4bb85819a3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_import_jobs_created" ON "import_jobs" ("created_at") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_import_jobs_status" ON "import_jobs" ("status") `);
    await queryRunner.query(
      `ALTER TABLE "providers" ADD CONSTRAINT "FK_85ecb7305072bc6fa53352c4a6e" FOREIGN KEY ("default_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_expenses" ADD CONSTRAINT "FK_0c316e9293dd1eac2c0143021eb" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_expenses" ADD CONSTRAINT "FK_6c283ae62cbde91625a20e9ccbd" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incomes" ADD CONSTRAINT "FK_0437aec5dbbd607f9babb72d5b1" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_d83d39f063e42fcb0512e3a99d6" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_5d1f4be708e0dfe2afa1a3c376c" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_f53f316f8b404e0389ddb5bdee6" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_f53f316f8b404e0389ddb5bdee6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_5d1f4be708e0dfe2afa1a3c376c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_d83d39f063e42fcb0512e3a99d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incomes" DROP CONSTRAINT "FK_0437aec5dbbd607f9babb72d5b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_expenses" DROP CONSTRAINT "FK_6c283ae62cbde91625a20e9ccbd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_expenses" DROP CONSTRAINT "FK_0c316e9293dd1eac2c0143021eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "providers" DROP CONSTRAINT "FK_85ecb7305072bc6fa53352c4a6e"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_import_jobs_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_import_jobs_created"`);
    await queryRunner.query(`DROP TABLE "import_jobs"`);
    await queryRunner.query(`DROP TYPE "public"."import_jobs_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."import_jobs_source_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_expenses_date"`);
    await queryRunner.query(`DROP INDEX "public"."idx_expenses_category"`);
    await queryRunner.query(`DROP INDEX "public"."idx_expenses_provider"`);
    await queryRunner.query(`DROP INDEX "public"."idx_expenses_import_job"`);
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(`DROP INDEX "public"."idx_incomes_date"`);
    await queryRunner.query(`DROP INDEX "public"."idx_incomes_client"`);
    await queryRunner.query(`DROP INDEX "public"."idx_incomes_is_paid"`);
    await queryRunner.query(`DROP TABLE "incomes"`);
    await queryRunner.query(`DROP TABLE "clients"`);
    await queryRunner.query(`DROP INDEX "public"."idx_recurring_expenses_provider"`);
    await queryRunner.query(`DROP INDEX "public"."idx_recurring_expenses_category"`);
    await queryRunner.query(`DROP INDEX "public"."idx_recurring_expenses_active"`);
    await queryRunner.query(`DROP INDEX "public"."idx_recurring_expenses_next_due"`);
    await queryRunner.query(`DROP TABLE "recurring_expenses"`);
    await queryRunner.query(`DROP TYPE "public"."recurring_expenses_schedule_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_providers_international"`);
    await queryRunner.query(`DROP TABLE "providers"`);
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
