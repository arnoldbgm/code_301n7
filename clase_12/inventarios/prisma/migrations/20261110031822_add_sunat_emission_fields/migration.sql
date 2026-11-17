-- AlterTable
ALTER TABLE "vouchers" ADD COLUMN     "annulled_at" TIMESTAMP(3),
ADD COLUMN     "codigo_hash" VARCHAR(250),
ADD COLUMN     "enlace_cdr" VARCHAR(500),
ADD COLUMN     "enlace_pdf" VARCHAR(500),
ADD COLUMN     "enlace_xml" VARCHAR(500),
ADD COLUMN     "sunat_accepted" BOOLEAN,
ADD COLUMN     "sunat_description" VARCHAR(500);
