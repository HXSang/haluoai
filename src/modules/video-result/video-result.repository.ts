import { PrismaRepository } from '@n-database/prisma/prisma.repository';
import { PrismaService } from '@n-database/prisma/prisma.service';
import { Injectable } from "@nestjs/common";
import { VideoResult } from "@prisma/client";

@Injectable()
export class VideoResultRepository extends PrismaRepository<VideoResult> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, 'VideoResult');
  }
}
