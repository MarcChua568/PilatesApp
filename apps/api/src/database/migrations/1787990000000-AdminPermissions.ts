import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminPermissions1787990000000 implements MigrationInterface {
  name = 'AdminPermissions1787990000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE 'superadmin'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "permissions" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "permissions"`);
    // Postgres can't drop an enum value; leaving 'superadmin' defined is
    // harmless if this migration is ever reverted.
  }
}
