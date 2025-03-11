import { Module } from '@nestjs/common';
import { VideoResultService } from './video-result.service';
import { VideoResultController } from './video-result.controller';
import { PrismaModule } from '@n-database/prisma/prisma.module';
import { VideoResultRepository } from './video-result.repository';
@Module({
    imports: [PrismaModule],
    controllers: [VideoResultController],
    providers: [VideoResultService, VideoResultRepository],
    exports: [VideoResultService, VideoResultRepository],  
})
export class VideoResultModule {}
