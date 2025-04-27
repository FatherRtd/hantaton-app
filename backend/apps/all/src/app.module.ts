import { Module } from '@nestjs/common';
import { BootstrapModule } from './modules/bootstrap/bootstrap.module';
import { ManagementModule } from './modules/management/management.module';

@Module({
  imports: [BootstrapModule, ManagementModule],
})
export class AppModule {}
