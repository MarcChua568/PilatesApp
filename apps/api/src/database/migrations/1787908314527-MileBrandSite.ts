import { MigrationInterface, QueryRunner } from "typeorm";

export class MileBrandSite1787908314527 implements MigrationInterface {
    name = 'MileBrandSite1787908314527'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "waiver_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "full_name" character varying NOT NULL, "date_of_birth" date NOT NULL, "emergency_contact_name" character varying NOT NULL, "emergency_contact_phone" character varying NOT NULL, "medical_notes" text, "accepted_terms" boolean NOT NULL DEFAULT false, "signature" character varying NOT NULL, "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_62d68e621ef4e2f995f1aa4546c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "site_content_blocks" ("key" character varying NOT NULL, "data" jsonb NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_300ce92b64dc35b0700e10ae541" PRIMARY KEY ("key"))`);
        await queryRunner.query(`CREATE TABLE "promotions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "headline" character varying NOT NULL, "body" text NOT NULL, "image_url" character varying, "cta_label" character varying NOT NULL DEFAULT 'Learn more', "cta_href" character varying NOT NULL DEFAULT '/pricing', "landing_slug" character varying, "show_in_top_bar" boolean NOT NULL DEFAULT false, "starts_at" TIMESTAMP WITH TIME ZONE, "ends_at" TIMESTAMP WITH TIME ZONE, "sort_order" integer NOT NULL DEFAULT '0', "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_4db56bcb12c40340b72f783ef43" UNIQUE ("landing_slug"), CONSTRAINT "PK_380cecbbe3ac11f0e5a7c452c34" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "packages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "kind" character varying NOT NULL, "price_php" integer NOT NULL, "credits" integer, "validity_days" integer, "blurb" text NOT NULL DEFAULT '', "perks" jsonb NOT NULL DEFAULT '[]', "featured" boolean NOT NULL DEFAULT false, "sort_order" integer NOT NULL DEFAULT '0', "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_4fa4c83eda7c58fa0861721db18" UNIQUE ("slug"), CONSTRAINT "PK_020801f620e21f943ead9311c98" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" character varying NOT NULL, "title" character varying NOT NULL, "body" text NOT NULL, "read_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "slug" character varying NOT NULL, "summary" text NOT NULL, "body" text NOT NULL, "cover_image_url" character varying, "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ends_at" TIMESTAMP WITH TIME ZONE, "host_instructor_id" uuid, "price_php" integer NOT NULL DEFAULT '0', "capacity" integer, "rsvp_count" integer NOT NULL DEFAULT '0', "published_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_05bd884c03d3f424e2204bd14cd" UNIQUE ("slug"), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "event_rsvps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "user_id" uuid NOT NULL, "guests" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_event_rsvp_event_user" UNIQUE ("event_id", "user_id"), CONSTRAINT "PK_9b36694202531f62919c0bf5b35" PRIMARY KEY ("id"))`);
        // Add slug nullable, backfill from the name for any existing rows, then
        // enforce NOT NULL — so this runs cleanly on a populated database.
        await queryRunner.query(`ALTER TABLE "class_templates" ADD "slug" character varying`);
        await queryRunner.query(`UPDATE "class_templates" SET "slug" = regexp_replace(lower(trim("name")), '[^a-z0-9]+', '-', 'g') || '-' || substr("id"::text, 1, 8) WHERE "slug" IS NULL`);
        await queryRunner.query(`ALTER TABLE "class_templates" ALTER COLUMN "slug" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "class_templates" ADD CONSTRAINT "UQ_ba91d7e5809c49985f01711241e" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "class_templates" ADD "type_label" character varying`);
        await queryRunner.query(`ALTER TABLE "class_templates" ADD "hero_image_url" character varying`);
        await queryRunner.query(`ALTER TABLE "class_templates" ADD "long_description" text`);
        await queryRunner.query(`ALTER TABLE "class_templates" ADD "what_to_bring" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "class_templates" ADD "who_its_for" text`);
        await queryRunner.query(`ALTER TABLE "waiver_submissions" ADD CONSTRAINT "FK_d317d501c7ffacd37aefc090275" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_2bc85a71b82d9dec3cad6553064" FOREIGN KEY ("host_instructor_id") REFERENCES "instructors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_rsvps" ADD CONSTRAINT "FK_db0b9c02cf734572db6a58b7fd2" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_rsvps" ADD CONSTRAINT "FK_0b4fae38ac7839d3749067206df" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_rsvps" DROP CONSTRAINT "FK_0b4fae38ac7839d3749067206df"`);
        await queryRunner.query(`ALTER TABLE "event_rsvps" DROP CONSTRAINT "FK_db0b9c02cf734572db6a58b7fd2"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_2bc85a71b82d9dec3cad6553064"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "waiver_submissions" DROP CONSTRAINT "FK_d317d501c7ffacd37aefc090275"`);
        await queryRunner.query(`ALTER TABLE "class_templates" DROP COLUMN "who_its_for"`);
        await queryRunner.query(`ALTER TABLE "class_templates" DROP COLUMN "what_to_bring"`);
        await queryRunner.query(`ALTER TABLE "class_templates" DROP COLUMN "long_description"`);
        await queryRunner.query(`ALTER TABLE "class_templates" DROP COLUMN "hero_image_url"`);
        await queryRunner.query(`ALTER TABLE "class_templates" DROP COLUMN "type_label"`);
        await queryRunner.query(`ALTER TABLE "class_templates" DROP CONSTRAINT "UQ_ba91d7e5809c49985f01711241e"`);
        await queryRunner.query(`ALTER TABLE "class_templates" DROP COLUMN "slug"`);
        await queryRunner.query(`DROP TABLE "event_rsvps"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "packages"`);
        await queryRunner.query(`DROP TABLE "promotions"`);
        await queryRunner.query(`DROP TABLE "site_content_blocks"`);
        await queryRunner.query(`DROP TABLE "waiver_submissions"`);
    }

}
