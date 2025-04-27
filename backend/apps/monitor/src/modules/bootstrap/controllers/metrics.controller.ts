import { Body, Controller, Get, Post } from '@nestjs/common';
import { MetricResponse } from '../models/types/metric-response.types';
import { ZeromqService } from '../services/zeromq.service';

@Controller('/metric')
export class MetricsController {
  constructor(private zeromqService: ZeromqService) {}

  private hosts: { ip: string; name: string }[];

  @Post('/set-hosts')
  async setHosts(@Body() hosts: { ip: string; name: string }[]) {
    this.hosts = hosts;
    console.log('Пришли хосты', hosts);
  }

  @Get()
  async get(): Promise<MetricResponse> {
    if (this.hosts) {
      const metric = await this.zeromqService.getMetric(this.hosts);
      console.log('Попросили метрику', metric)
      return metric;
    }

    console.log('Нет хостов')
    return null;
  }
}
