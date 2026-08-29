import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCredits1787990200000 implements MigrationInterface {
  name = 'CreateCredits1787990200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "credit_balance" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(`CREATE TABLE "credit_transactions" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "user_id" uuid NOT NULL,
      "type" character varying NOT NULL,
      "amount" integer NOT NULL,
      "counterparty_user_id" uuid,
      "note" text,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_credit_transactions" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_credit_transactions_user" ON "credit_transactions" ("user_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "credit_transactions"
        ADD CONSTRAINT "FK_credit_transactions_user"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`CREATE TABLE "pending_gifts" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "token" character varying NOT NULL,
      "sender_id" uuid NOT NULL,
      "recipient_email" citext NOT NULL,
      "amount" integer NOT NULL,
      "message" text,
      "status" character varying NOT NULL DEFAULT 'pending',
      "claimed_by_user_id" uuid,
      "claimed_at" TIMESTAMP WITH TIME ZONE,
      "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "UQ_pending_gifts_token" UNIQUE ("token"),
      CONSTRAINT "PK_pending_gifts" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_pending_gifts_email" ON "pending_gifts" ("recipient_email")`,
    );
    await queryRunner.query(`
      ALTER TABLE "pending_gifts"
        ADD CONSTRAINT "FK_pending_gifts_sender"
        FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "pending_gifts"`);
    await queryRunner.query(`DROP TABLE "credit_transactions"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "credit_balance"`);
  }
}
