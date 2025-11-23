/*
  Warnings:

  - Added the required column `caption` to the `Publicacion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoPublicacion" AS ENUM ('PENDIENTE_CONFIRMACION', 'CONFIRMADO', 'PUBLICANDO', 'PUBLICADO', 'ERROR');

-- AlterEnum
ALTER TYPE "TipoContenido" ADD VALUE 'CONTENIDO_REDES_SOCIALES';

-- AlterTable
ALTER TABLE "Mensaje" ADD COLUMN     "contenidoRedesSociales" JSONB,
ADD COLUMN     "estadoPublicacion" "EstadoPublicacion",
ADD COLUMN     "imagenGenerada" TEXT;

-- AlterTable
ALTER TABLE "Publicacion" ADD COLUMN     "caption" TEXT NOT NULL,
ADD COLUMN     "estado" "EstadoPublicacion" NOT NULL DEFAULT 'PENDIENTE_CONFIRMACION',
ADD COLUMN     "imagenUrl" TEXT,
ADD COLUMN     "mensajeId" TEXT,
ADD COLUMN     "postId" TEXT,
ALTER COLUMN "link" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Publicacion" ADD CONSTRAINT "Publicacion_mensajeId_fkey" FOREIGN KEY ("mensajeId") REFERENCES "Mensaje"("id") ON DELETE SET NULL ON UPDATE CASCADE;
