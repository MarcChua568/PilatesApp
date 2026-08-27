import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAnnouncements1787826643735 implements MigrationInterface {
    name = 'CreateAnnouncements1787826643735'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_booking_active_member_class"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_booking_booked_spot"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "CHK_booking_member_xor_guest"`);
        await queryRunner.query(`CREATE TABLE "announcements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "body" text NOT NULL, "created_by" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b3ad760876ff2e19d58e05dc8b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "announcements" ADD CONSTRAINT "FK_40bd4946a00669c5fb7e6d972f0" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "announcements" DROP CONSTRAINT "FK_40bd4946a00669c5fb7e6d972f0"`);
        await queryRunner.query(`DROP TABLE "announcements"`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "CHK_booking_member_xor_guest" CHECK (((member_id IS NOT NULL) <> (guest_name IS NOT NULL)))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_booking_booked_spot" ON "bookings" ("class_instance_id", "spot_id") WHERE ((status = 'booked'::bookings_status_enum) AND (spot_id IS NOT NULL))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_booking_active_member_class" ON "bookings" ("member_id", "class_instance_id") WHERE ((status = ANY (ARRAY['booked'::bookings_status_enum, 'waitlisted'::bookings_status_enum])) AND (member_id IS NOT NULL))`);
    }

}
