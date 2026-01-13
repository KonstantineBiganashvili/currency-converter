import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

export const winstonConfig: winston.LoggerOptions = {
  level: isProduction ? 'info' : 'debug',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        isProduction
          ? winston.format.combine(winston.format.timestamp(), winston.format.json())
          : nestWinstonModuleUtilities.format.nestLike('CurrencyConverter', {
              colors: true,
              prettyPrint: true,
            }),
      ),
    }),
  ],
};
