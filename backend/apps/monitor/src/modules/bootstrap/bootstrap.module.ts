import { Module } from '@nestjs/common';
import { ZeromqService } from './services/zeromq.service';
import { MetricsController } from './controllers/metrics.controller';

@Module({
  controllers: [MetricsController],
  providers: [ZeromqService],
  exports: [ZeromqService],
})
export class BootstrapModule {}
