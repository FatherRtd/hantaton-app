import { Module } from '@nestjs/common';
import { BootstrapModule } from './modules/bootstrap/bootstrap.module';

@Module({
  imports: [BootstrapModule],
})
export class AppModule {}
