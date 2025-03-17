import { PrismaService } from '@n-database/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client/extension';

export type findFirstQuery = Prisma.UserFindFirstArgs;
export type findUniqueQuery = Prisma.UserFindUniqueArgs;
export type countQuery = Prisma.UserCountArgs;
export type findManyQuery = Prisma.UserFindManyArgs | Prisma.JobQueueFindManyArgs | Prisma.VideoResultFindManyArgs;
export type updateQuery = Prisma.UserUpdateArgs | Prisma.JobQueueUpdateArgs | Prisma.VideoResultUpdateArgs;
export type deleteQuery = Prisma.UserDeleteArgs | Prisma.JobQueueDeleteArgs | Prisma.VideoResultDeleteArgs;
export type groupByQuery = Prisma.UserGroupByArgs | Prisma.JobQueueGroupByArgs | Prisma.VideoResultGroupByArgs;
export type paginateQuery = { page: number, limit: number, [key: string]: any } & findManyQuery;
export type createQuery = Prisma.UserCreateArgs;
export type createManyQuery = Prisma.UserCreateManyArgs;

export type Pagination<T> = {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export class PrismaRepository<T> extends PrismaService {
  constructor(
    protected readonly prismaService: PrismaService,
    private model: Prisma.ModelName,
  ) {
    super();
  }

  async findManyRandom(limit: number, query: findManyQuery): Promise<T[]> {
    const count = await this.prismaService[this.model as keyof PrismaClient].count({
      where: query.where,
    });
    const items = await Promise.all(Array.from({ length: limit }, async () => {
      const skip = Math.floor(Math.random() * count);
      return this.prismaService[this.model as keyof PrismaClient].findFirst({
        take: 1,
        skip,
        ...query,
        orderBy: {
          id: 'desc',
        },
      });
    }));
    return items.flat();
  }

  async paginate(query: paginateQuery, isRandom?: boolean): Promise<Pagination<T>> {
    const { page, limit, ...rest } = query;
    const skip = (page - 1) * limit;
    const take = Number(limit);

    if (isRandom) {
      return {
        items: await this.findManyRandom(take, rest),
        meta: {
          total: 0,
          totalPages: 0,
          page: 0,
          limit: 0,
        },
      }
    }

    const [total, data] = await Promise.all([
      this.prismaService[this.model as keyof PrismaClient].count({
        where: rest.where,
      }),
      this.prismaService[this.model as keyof PrismaClient].findMany({
        skip,
        take,
        ...rest,
      }),
    ]);

    return {
      items: data,
      meta: {
        total,
        totalPages: Math.ceil(total / limit),
        page: Number(page),
        limit: Number(limit),
      },
    };
  }

  async create(data: PrismaClient): Promise<T> {
    return this.prismaService[this.model as keyof PrismaClient].create({
      data,
    });
  }

  async createMany(data: T[]): Promise<T[]> {
    return this.prismaService[this.model as keyof PrismaClient].createMany({
      data,
    });
  }

  async findAll(): Promise<T[]> {
    return this.prismaService[this.model as keyof PrismaClient].findMany();
  }

  async findById(id: number, query?: findManyQuery): Promise<PrismaClient> {
    return this.prismaService[this.model as keyof PrismaClient].findUnique({
      ...query,
      where: {
        id: Number(id),
        ...(query?.where ? { ...query.where } : {})
      },
    });
  }

  async findMany(query?: findManyQuery): Promise<PrismaClient[]> {
    return this.prismaService[this.model as keyof PrismaClient].findMany(query);
  }

  async update(id: number, data: PrismaClient): Promise<T> {
    return this.prismaService[this.model as keyof PrismaClient].update({
      where: { id: Number(id) },
      data,
    });
  }

  async delete(id: number): Promise<T> {
    return this.prismaService[this.model as keyof PrismaClient].delete({
      where: { id },
    });
  }

  async restore(id: number): Promise<T> {
    return this.prismaService[this.model as keyof PrismaClient].update({
      where: { id },
    });
  }

  async findFirst(query: T | findFirstQuery): Promise<PrismaClient | null> {
    return this.prismaService[this.model as keyof PrismaClient].findFirst(query);
  }

  async findUnique(query: findUniqueQuery): Promise<T> {
    return this.prismaService[this.model as keyof PrismaClient].findUnique(query);
  }

  async count(query: countQuery): Promise<number> {
    return this.prismaService[this.model as keyof PrismaClient].count(query);
  }

  async groupBy(query: groupByQuery): Promise<T[]> {
    return this.prismaService[this.model as keyof PrismaClient].groupBy(query);
  }

  async updateOrCreate(compareData: PrismaClient, data: PrismaClient): Promise<T> {
    const existing = await this.prismaService[this.model as keyof PrismaClient].findFirst({
      where: compareData,
    });
    if (existing) {
      return this.prismaService[this.model as keyof PrismaClient].update({
        where: {
          id: existing.id,
        },
        data,
      });
    }
    return this.create(data);
  }


  async groupByPagination<T extends Record<string, any>>(
    query: groupByQuery & { page: number; limit: number }
  ): Promise<Pagination<T>> {
    const { page, limit, ...rest } = query;
    const skip = (page - 1) * limit;
    const take = Number(limit);

    // Get total count of unique groups
    const totalGroups = await this.prismaService[this.model as keyof PrismaClient].groupBy({
      ...rest,
      _count: true,
    });

    // Get paginated groups
    const groups = await this.prismaService[this.model as keyof PrismaClient].groupBy({
      ...rest,
      skip,
      take,
    });

    return {
      items: groups as T[],
      meta: {
        total: totalGroups.length,
        totalPages: Math.ceil(totalGroups.length / limit),
        page: Number(page),
        limit: Number(limit),
      },
    };
  }
}
