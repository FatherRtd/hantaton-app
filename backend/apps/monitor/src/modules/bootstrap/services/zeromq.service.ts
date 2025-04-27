import { Injectable, OnModuleInit } from '@nestjs/common';
import * as zmq from 'zeromq';
import { ExporterMessageDto } from '../models/dtos/exporter-message.dto';
import { MetricResponse } from '../models/types/metric-response.types';

@Injectable()
export class ZeromqService implements OnModuleInit {
  private sockMetric = new zmq.Request();
  private socketPathMetric = '/tmp/appMetric.sock';

  private sockManagement = new zmq.Dealer();
  private socketPathManagement = '/tmp/appManagement.sock';

  onModuleInit(): any {
    try {
      this.sockMetric.connect(`ipc://${this.socketPathMetric}`);
      this.sockManagement.connect(`ipc://${this.socketPathManagement}`);
    } catch (error) {
      console.error('Ошибка запуска:', error);
    }
  }

  async getMetric(
    hosts: { ip: string; name: string }[],
  ): Promise<MetricResponse | undefined> {
    try {
      await this.sockMetric.send(
        JSON.stringify(ExporterMessageDto.metric(hosts)),
      );
      const [response] = await this.sockMetric.receive();
      return JSON.parse(response.toString());
    } catch (e) {
      console.error('Ошибка при попытке получить метрики');
    }
  }

  async sendStart(containerId: string) {
    await this.sockManagement.send(
      JSON.stringify(ExporterMessageDto.containerStart(containerId)),
    );
  }

  async sendStop(containerId: string) {
    await this.sockManagement.send(
      JSON.stringify(ExporterMessageDto.containerStop(containerId)),
    );
  }

  async sendRemove(containerId: string) {
    await this.sockManagement.send(
      JSON.stringify(ExporterMessageDto.containerRemove(containerId)),
    );
  }
}
