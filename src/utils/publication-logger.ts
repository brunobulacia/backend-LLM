import * as fs from 'fs';
import * as path from 'path';

export class PublicationLogger {
  private static logFilePath = path.join(
    process.cwd(),
    'logs',
    'publications.log',
  );

  private static ensureLogDirectory() {
    try {
      const logDir = path.dirname(this.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
        console.log(`Directorio de logs creado: ${logDir}`);
      }
    } catch (error) {
      console.error(' Error creando directorio de logs:', error);
    }
  }

  private static formatMessage(
    level: string,
    mensajeId: string,
    plataforma: string,
    message: string,
    data?: any,
  ): string {
    const timestamp = new Date().toISOString();
    let dataStr = '';

    if (data) {
      try {
        dataStr = ` | Data: ${JSON.stringify(data, null, 0)}`;
      } catch (error) {
        dataStr = ` | Data: [Error serializing data: ${error.message}]`;
      }
    }

    return `[${timestamp}] [${level}] [${mensajeId}] [${plataforma.toUpperCase()}] ${message}${dataStr}\n`;
  }

  static logInfo(
    mensajeId: string,
    plataforma: string,
    message: string,
    data?: any,
  ) {
    try {
      this.ensureLogDirectory();
      const logMessage = this.formatMessage(
        'INFO',
        mensajeId,
        plataforma,
        message,
        data,
      );
      fs.appendFileSync(this.logFilePath, logMessage);
      console.log(`${logMessage.trim()}`);
    } catch (error) {
      console.error('Error escribiendo log INFO:', error);
    }
  }

  static logSuccess(
    mensajeId: string,
    plataforma: string,
    message: string,
    data?: any,
  ) {
    try {
      this.ensureLogDirectory();
      const logMessage = this.formatMessage(
        'SUCCESS',
        mensajeId,
        plataforma,
        message,
        data,
      );
      fs.appendFileSync(this.logFilePath, logMessage);
      console.log(` ${logMessage.trim()}`);
    } catch (error) {
      console.error('Error escribiendo log SUCCESS:', error);
    }
  }

  static logError(
    mensajeId: string,
    plataforma: string,
    message: string,
    error?: any,
  ) {
    try {
      this.ensureLogDirectory();
      const errorData =
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error;
      const logMessage = this.formatMessage(
        'ERROR',
        mensajeId,
        plataforma,
        message,
        errorData,
      );
      fs.appendFileSync(this.logFilePath, logMessage);
      console.error(` ${logMessage.trim()}`);
    } catch (logError) {
      console.error(' Error escribiendo log ERROR:', logError);
    }
  }

  static logWarning(
    mensajeId: string,
    plataforma: string,
    message: string,
    data?: any,
  ) {
    try {
      this.ensureLogDirectory();
      const logMessage = this.formatMessage(
        'WARNING',
        mensajeId,
        plataforma,
        message,
        data,
      );
      fs.appendFileSync(this.logFilePath, logMessage);
      console.warn(` ${logMessage.trim()}`);
    } catch (error) {
      console.error(' Error escribiendo log WARNING:', error);
    }
  }

  static logStart(mensajeId: string, contenido: any, rutaImagen?: string) {
    try {
      this.ensureLogDirectory();
      const logMessage = this.formatMessage(
        'START',
        mensajeId,
        'GENERAL',
        'Iniciando proceso de publicación',
        {
          contenido,
          rutaImagen,
          timestamp: new Date().toISOString(),
        },
      );
      fs.appendFileSync(this.logFilePath, logMessage);
      console.log(` ${logMessage.trim()}`);
    } catch (error) {
      console.error(' Error escribiendo log START:', error);
    }
  }

  static logEnd(mensajeId: string, resultados: any[]) {
    try {
      this.ensureLogDirectory();
      const summary = {
        total: resultados.length,
        exitosos: resultados.filter((r) => r.exito).length,
        fallidos: resultados.filter((r) => !r.exito).length,
        resultados: resultados.map((r) => ({
          plataforma: r.plataforma,
          exito: r.exito,
          postId: r.postId,
          error: r.error,
        })),
      };
      const logMessage = this.formatMessage(
        'END',
        mensajeId,
        'GENERAL',
        'Proceso de publicación completado',
        summary,
      );
      fs.appendFileSync(this.logFilePath, logMessage);
      console.log(` ${logMessage.trim()}`);
    } catch (error) {
      console.error(' Error escribiendo log END:', error);
    }
  }

  // Método para testear el logger
  static test() {
    try {
      console.log(' Iniciando test del PublicationLogger...');
      this.logInfo('TEST-123', 'SYSTEM', 'Test del sistema de logging', {
        test: true,
      });
      console.log(' Test completado. Revisar archivo:', this.logFilePath);
    } catch (error) {
      console.error(' Error en test del logger:', error);
    }
  }
}
