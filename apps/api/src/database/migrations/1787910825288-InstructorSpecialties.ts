import { MigrationInterface, QueryRunner } from "typeorm";

export class InstructorSpecialties1787910825288 implements MigrationInterface {
    name = 'InstructorSpecialties1787910825288'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "instructors" ADD "specialties" jsonb NOT NULL DEFAULT '[]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "instructors" DROP COLUMN "specialties"`);
    }

}
