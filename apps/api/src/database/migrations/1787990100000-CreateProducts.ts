import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProducts1787990100000 implements MigrationInterface {
  name = 'CreateProducts1787990100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."products_category_enum" AS ENUM('apparel', 'grip-socks', 'wellness', 'merch', 'other')`,
    );
    await queryRunner.query(`CREATE TABLE "products" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "name" character varying NOT NULL,
      "slug" character varying NOT NULL,
      "category" "public"."products_category_enum" NOT NULL DEFAULT 'other',
      "description" text NOT NULL DEFAULT '',
      "price_php" integer,
      "image_url" character varying,
      "video_url" character varying,
      "external_url" character varying,
      "featured" boolean NOT NULL DEFAULT false,
      "sort_order" integer NOT NULL DEFAULT '0',
      "active" boolean NOT NULL DEFAULT true,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "UQ_products_slug" UNIQUE ("slug"),
      CONSTRAINT "PK_products" PRIMARY KEY ("id")
    )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TYPE "public"."products_category_enum"`);
  }
}
