import { forwardRef, Module } from '@nestjs/common';
import { BootstrapModule } from '../bootstrap/bootstrap.module';
import { LoopController } from './controllers/loop.controller';

@Module({
  imports: [forwardRef(() => BootstrapModule)],
  controllers: [LoopController],
})
export class ManagementModule {}
