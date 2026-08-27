import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClassTemplates1787825757600 implements MigrationInterface {
    name = 'CreateClassTemplates1787825757600'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."class_templates_class_type_enum" AS ENUM('reformer', 'mat', 'barre', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."class_templates_intensity_level_enum" AS ENUM('beginner', 'intermediate', 'advanced')`);
        await queryRunner.query(`CREATE TABLE "class_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "class_type" "public"."class_templates_class_type_enum" NOT NULL, "description" text, "instructor_id" uuid NOT NULL, "room_id" uuid NOT NULL, "duration_minutes" integer NOT NULL, "intensity_level" "public"."class_templates_intensity_level_enum" NOT NULL, "capacity" integer NOT NULL, "recurrence_rule" text NOT NULL, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_153d3c1ea9fc80154a25b43892e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "class_templates" ADD CONSTRAINT "FK_a69313d6125f1ef3692000b7b07" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_templates" ADD CONSTRAINT "FK_754dadcde07a9e51027275874aa" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_templates" DROP CONSTRAINT "FK_754dadcde07a9e51027275874aa"`);
        await queryRunner.query(`ALTER TABLE "class_templates" DROP CONSTRAINT "FK_a69313d6125f1ef3692000b7b07"`);
        await queryRunner.query(`DROP TABLE "class_templates"`);
        await queryRunner.query(`DROP TYPE "public"."class_templates_intensity_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."class_templates_class_type_enum"`);
    }

}
