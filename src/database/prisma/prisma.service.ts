import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { blue } from 'colorette';
import { logger } from '@n-utils';
import { PrismaClientExtended } from './prisma.extended';

@Injectable()
export class PrismaService
  extends PrismaClientExtended
  implements OnModuleInit, OnModuleDestroy {
  private readonly loggerTerminal = new Logger(PrismaService.name);

  private readonly logger = logger({
    infoFile: 'prisma-info.log',
    errorFile: 'prisma-error.log',
  });

  constructor() {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    throw new Error('Method not implemented.');
  }

  async onModuleInit() {
    await this.$connect();
    this.$use(this.findMiddleware);
    this.$use(this.softDeleteMiddleware);

    this.$on('error', ({ message }) => {
      this.loggerTerminal.error(message);
      this.logger.error(message);
    });
    this.$on('warn', ({ message }) => {
      this.loggerTerminal.warn(message);
    });
    this.$on('info', ({ message }) => {
      this.loggerTerminal.debug(message);
      this.logger.info(message);
    });
    this.$on('query', ({ query, params }) => {
      const transformedQuery = this.simplifyQuery(query, params);
      this.loggerTerminal.log(blue(transformedQuery));
      this.logger.info({
        timestamp: new Date().toISOString(),
        query: transformedQuery,
        params: JSON.parse(params)
      });
    });
  }

  private simplifyQuery(inputQuery: string, params: string): string {
    try {
      const paramsObject = JSON.parse(params);

      // const tableNameMatch = inputQuery.match(/"public"\."\w+"/);

      // if (!tableNameMatch) {
      //   throw new Error('Table name not found in the query.');
      // }
      // const tableName = tableNameMatch[0].split('"').join('').split('.')[1];

      let simplifiedQuery = inputQuery;

      paramsObject.forEach((param, index) => {
        simplifiedQuery = simplifiedQuery.replace(
          `$${index + 1}`,
          `'${param}'`,
        );
      });

      return simplifiedQuery;
    } catch (error) {
      return inputQuery;
    }
  }


  softDeleteMiddleware: Prisma.Middleware = async (params, next) => {
    if (params.action === 'delete') {
      return next({
        ...params,
        action: 'update',
        args: {
          ...params.args,
          data: {
            deletedAt: new Date(),
          },
        },
      });
    }

    if (params.action === 'deleteMany') {
      return next({
        ...params,
        action: 'updateMany',
        args: {
          ...params.args,
          data: {
            deletedAt: new Date(),
          },
        },
      });
    }

    return next(params);
  };

  findMiddleware: Prisma.Middleware = async (params, next) => {
    if (['findUnique', 'findFirst', 'findMany', 'count'].includes(params.action)) {
      const hasDeleted = params.args?.where && this.hasDeletedCondition(params.args.where);
      if (!hasDeleted) {
        params = {
          ...params,
          args: {
            ...params.args,
            where: {
              ...params.args?.where,
              deletedAt: null,
            },
          },
        };
      }

      // Handle include filtering
      if (params.args?.include) {
        params.args.include = this.applyDeletedFilterToInclude(params.args.include);
      }

      if (params.action === 'findUnique' || params.action === 'findFirst') {
        params.action = 'findFirst';
      }
    }

    return next(params);
  };

  private applyDeletedFilterToInclude(include: any): any {
    const newInclude = { ...include };
    for (const key in newInclude) {
      if (typeof newInclude[key] === 'object') {
        newInclude[key] = {
          ...newInclude[key],
          where: {
            ...newInclude[key]?.where,
            deletedAt: null,
          },
        };
        if (newInclude[key].include) {
          // newInclude[key].include = this.applyDeletedFilterToInclude(newInclude[key].include);
        }
      }
    }
    return newInclude;
  }

  private hasDeletedCondition(where) {
    if (where.deletedAt !== undefined) {
      return true;
    }

    return ['AND', 'OR', 'NOT'].some((condition) => {
      if (where[condition]) {
        const conditions = Array.isArray(where[condition]) ? where[condition] : [where[condition]];
        return conditions.some((subWhere: any) => this.hasDeletedCondition(subWhere));
      }
      return false;
    });
  }
}


