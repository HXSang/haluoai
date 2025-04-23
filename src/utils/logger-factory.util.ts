import { createLogger, format, transports } from 'winston';
import path from 'path';

interface LoggerConfig {
  infoFile: string;
  errorFile: string;
  apiFile?: string;
}

export const logger = ({ infoFile, errorFile, apiFile }: LoggerConfig) => {
  const loggerTransports = [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({
      filename: path.join(__dirname, `../../logs/${errorFile}`),
      level: 'error',
    }),
    new transports.File({
      filename: path.join(__dirname, `../../logs/${infoFile}`),
    }),
  ];

  if (apiFile) {
    loggerTransports.push(
      new transports.File({
        filename: path.join(__dirname, `../../logs/${apiFile}`),
      })
    );
  }

  return createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      format.errors({ stack: true }),
      format.splat(),
      format.json(),
    ),
    defaultMeta: {},
    transports: loggerTransports,
  });
};
