import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClassInstances1787825937446 implements MigrationInterface {
    name = 'CreateClassInstances1787825937446'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."class_instances_class_type_enum" AS ENUM('reformer', 'mat', 'barre', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."class_instances_intensity_level_enum" AS ENUM('beginner', 'intermediate', 'advanced')`);
        await queryRunner.query(`CREATE TYPE "public"."class_instances_status_enum" AS ENUM('scheduled', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "class_instances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "template_id" uuid, "instructor_id" uuid NOT NULL, "room_id" uuid NOT NULL, "class_type" "public"."class_instances_class_type_enum" NOT NULL, "name" character varying NOT NULL, "description" text, "duration_minutes" integer NOT NULL, "intensity_level" "public"."class_instances_intensity_level_enum" NOT NULL, "start_time" TIMESTAMP WITH TIME ZONE NOT NULL, "bookable_from" TIMESTAMP WITH TIME ZONE, "capacity" integer NOT NULL, "booked_count" integer NOT NULL DEFAULT '0', "substitute" boolean NOT NULL DEFAULT false, "status" "public"."class_instances_status_enum" NOT NULL DEFAULT 'scheduled', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_430697037839b5079606f2a5094" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_00d0d7855ee2c1e0aa26805e7e" ON "class_instances" ("instructor_id", "start_time") `);
        await queryRunner.query(`CREATE INDEX "IDX_4c3da337e69425fd2818db36ee" ON "class_instances" ("start_time") `);
        await queryRunner.query(`ALTER TABLE "class_instances" ADD CONSTRAINT "FK_12cb113706c95c6038e32f91c4b" FOREIGN KEY ("template_id") REFERENCES "class_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_instances" ADD CONSTRAINT "FK_ba7185296188adbfd6bceda458c" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_instances" ADD CONSTRAINT "FK_229914b6313706c747e05de7b5d" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_instances" DROP CONSTRAINT "FK_229914b6313706c747e05de7b5d"`);
        await queryRunner.query(`ALTER TABLE "class_instances" DROP CONSTRAINT "FK_ba7185296188adbfd6bceda458c"`);
        await queryRunner.query(`ALTER TABLE "class_instances" DROP CONSTRAINT "FK_12cb113706c95c6038e32f91c4b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4c3da337e69425fd2818db36ee"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_00d0d7855ee2c1e0aa26805e7e"`);
        await queryRunner.query(`DROP TABLE "class_instances"`);
        await queryRunner.query(`DROP TYPE "public"."class_instances_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."class_instances_intensity_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."class_instances_class_type_enum"`);
    }

}
