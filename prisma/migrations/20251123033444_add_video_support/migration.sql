-- CreateEnum
CREATE TYPE "EstadoVideo" AS ENUM ('GENERANDO', 'COMPLETADO', 'ERROR');

-- AlterEnum
ALTER TYPE "TipoContenido" ADD VALUE 'VIDEO';

-- AlterTable
ALTER TABLE "Mensaje" ADD COLUMN     "estadoVideo" "EstadoVideo",
ADD COLUMN     "soraVideoId" TEXT,
ADD COLUMN     "videoGenerado" TEXT;

-- AlterTable
ALTER TABLE "Publicacion" ADD COLUMN     "videoUrl" TEXT;
