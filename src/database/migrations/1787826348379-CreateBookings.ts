import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBookings1787826348379 implements MigrationInterface {
    name = 'CreateBookings1787826348379'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."bookings_status_enum" AS ENUM('booked', 'cancelled', 'waitlisted', 'attended', 'no_show')`);
        await queryRunner.query(`CREATE TABLE "bookings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "member_id" uuid, "booked_by_id" uuid NOT NULL, "guest_name" text, "guest_email" text, "class_instance_id" uuid NOT NULL, "spot_id" uuid, "status" "public"."bookings_status_enum" NOT NULL, "waitlist_position" integer, "promotion_offered_at" TIMESTAMP WITH TIME ZONE, "promotion_offer_expires_at" TIMESTAMP WITH TIME ZONE, "booked_at" TIMESTAMP WITH TIME ZONE NOT NULL, "cancelled_at" TIMESTAMP WITH TIME ZONE, "checked_in_at" TIMESTAMP WITH TIME ZONE, "checked_in_by" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_booking_member" ON "bookings" ("member_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_booking_class_instance" ON "bookings" ("class_instance_id") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "health_waiver_signed_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_1dc7e0f9ea4c487f6c4095bc153" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_6f2b6c1ed65bb2e68d48a0dd631" FOREIGN KEY ("booked_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_686f2e8bf401ac4147941ef71d2" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_82864b1cbcc2e3652c5a21c9468" FOREIGN KEY ("spot_id") REFERENCES "room_spots"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_d8438267356056afa59f5c2dfd9" FOREIGN KEY ("checked_in_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Exactly one of (member attendee, guest attendee).
        await queryRunner.query(`
          ALTER TABLE "bookings" ADD CONSTRAINT "CHK_booking_member_xor_guest"
          CHECK (("member_id" IS NOT NULL) <> ("guest_name" IS NOT NULL))
        `);
        // One active (booked/waitlisted) relationship per member per class.
        await queryRunner.query(`
          CREATE UNIQUE INDEX "UQ_booking_active_member_class"
          ON "bookings" ("member_id", "class_instance_id")
          WHERE "status" IN ('booked', 'waitlisted') AND "member_id" IS NOT NULL
        `);
        // No two booked attendees on the same spot for one class instance.
        await queryRunner.query(`
          CREATE UNIQUE INDEX "UQ_booking_booked_spot"
          ON "bookings" ("class_instance_id", "spot_id")
          WHERE "status" = 'booked' AND "spot_id" IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_booking_booked_spot"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_booking_active_member_class"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "CHK_booking_member_xor_guest"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_d8438267356056afa59f5c2dfd9"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_82864b1cbcc2e3652c5a21c9468"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_686f2e8bf401ac4147941ef71d2"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_6f2b6c1ed65bb2e68d48a0dd631"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_1dc7e0f9ea4c487f6c4095bc153"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "health_waiver_signed_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_booking_class_instance"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_booking_member"`);
        await queryRunner.query(`DROP TABLE "bookings"`);
        await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
    }

}
