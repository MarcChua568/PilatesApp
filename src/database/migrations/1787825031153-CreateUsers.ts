import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsers1787825031153 implements MigrationInterface {
    name = 'CreateUsers1787825031153'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Required by later columns: citext for case-insensitive email uniqueness,
        // uuid-ossp for uuid_generate_v4() primary key defaults.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('member', 'staff', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" citext NOT NULL, "password_hash" character varying NOT NULL, "full_name" character varying NOT NULL, "phone" text, "role" "public"."users_role_enum" NOT NULL DEFAULT 'member', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
