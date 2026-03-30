import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1743292800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
        "external_id" VARCHAR NOT NULL,
        "provider"    VARCHAR NOT NULL,
        "tokens"      INTEGER NOT NULL DEFAULT 5,
        "user_name"   VARCHAR,
        "email"       VARCHAR,
        "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_external_provider" UNIQUE ("external_id", "provider")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "event_history" (
        "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
        "user_id"      UUID NOT NULL,
        "date"         TIMESTAMP NOT NULL DEFAULT now(),
        "service_name" VARCHAR NOT NULL,
        "token_amount" INTEGER NOT NULL DEFAULT 1,
        "status"       VARCHAR NOT NULL,
        CONSTRAINT "PK_event_history" PRIMARY KEY ("id"),
        CONSTRAINT "FK_event_history_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_event_history_user_id" ON "event_history" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_event_history_user_id"`);
    await queryRunner.query(`DROP TABLE "event_history"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
