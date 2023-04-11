/*
  Warnings:

  - The values [anonymous] on the enum `role_key` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "role_key_new" AS ENUM ('user', 'admin', 'assistant');
ALTER TABLE "role" ALTER COLUMN "key" TYPE "role_key_new" USING ("key"::text::"role_key_new");
ALTER TYPE "role_key" RENAME TO "role_key_old";
ALTER TYPE "role_key_new" RENAME TO "role_key";
DROP TYPE "role_key_old";
COMMIT;
