import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSpotsWaitlistSettings1787825640226 implements MigrationInterface {
    name = 'AddSpotsWaitlistSettings1787825640226'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "room_spots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "room_id" uuid NOT NULL, "label" text NOT NULL, "position_group" text, "sort_order" integer NOT NULL DEFAULT '0', "bookable" boolean NOT NULL DEFAULT true, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_room_spot_label" UNIQUE ("room_id", "label"), CONSTRAINT "PK_0c8dbf4012ee168f5d86315e0ff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_room_spot_room" ON "room_spots" ("room_id") `);
        await queryRunner.query(`ALTER TABLE "studio_settings" ADD "waitlist_auto_promote_cutoff_hours" integer NOT NULL DEFAULT '2'`);
        await queryRunner.query(`ALTER TABLE "studio_settings" ADD "waitlist_offer_ttl_minutes" integer NOT NULL DEFAULT '30'`);
        await queryRunner.query(`ALTER TABLE "studio_settings" ADD "max_seats_per_booking" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "rooms" ADD "has_assigned_spots" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "room_spots" ADD CONSTRAINT "FK_59f7c1edf30cf37835534021af4" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "room_spots" DROP CONSTRAINT "FK_59f7c1edf30cf37835534021af4"`);
        await queryRunner.query(`ALTER TABLE "rooms" DROP COLUMN "has_assigned_spots"`);
        await queryRunner.query(`ALTER TABLE "studio_settings" DROP COLUMN "max_seats_per_booking"`);
        await queryRunner.query(`ALTER TABLE "studio_settings" DROP COLUMN "waitlist_offer_ttl_minutes"`);
        await queryRunner.query(`ALTER TABLE "studio_settings" DROP COLUMN "waitlist_auto_promote_cutoff_hours"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_room_spot_room"`);
        await queryRunner.query(`DROP TABLE "room_spots"`);
    }

}
