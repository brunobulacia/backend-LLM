-- CreateEnum
CREATE TYPE "TipoContenido" AS ENUM ('TEXTO', 'IMAGEN');

-- AlterTable
ALTER TABLE "Mensaje" ADD COLUMN     "rutaImagen" TEXT,
ADD COLUMN     "tipo" "TipoContenido" NOT NULL DEFAULT 'TEXTO';
