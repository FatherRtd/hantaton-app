import { Controller, Get, Param } from '@nestjs/common';
import { BootstrapGateway } from '../../bootstrap/bootstrap.gateway';

@Controller('/management/container')
export class LoopController {
  constructor(private bootstrapGateway: BootstrapGateway) {}

  @Get('/loop/:time')
  async loop(@Param('time') time: number) {
    await this.bootstrapGateway.updateInterval(time);
    return 'ОК';
  }
}
