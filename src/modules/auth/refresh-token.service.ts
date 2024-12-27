import { PrismaService } from '@n-database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: { userId: number; value: string }) {
    const res = this.prisma.refreshToken.create({ data });
    return res;
  }

  async findByValue(refreshTokenValue: string) {
    return this.prisma.refreshToken.findFirst({
      where: { value: refreshTokenValue },
    });
  }

  async deleteById(id: number) {
    return this.prisma.refreshToken.delete({
      where: { id },
    });
  }
}
