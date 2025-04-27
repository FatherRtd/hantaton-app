import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { setInterval, clearInterval } from 'timers';
import { Agent } from 'https';

@WebSocketGateway({
  cors: {
    origin: '*', // Разрешаем подключение с любого источника (для тестирования)
  },
})
export class BootstrapGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnApplicationBootstrap
{
  @WebSocketServer()
  server: Server;

  private hosts = [
    // {
    //   name: 'First',
    //   ip: '192.168.194.192',
    // },
    {
      name: 'Two',
      ip: 'localhost',
    },
  ];

  private interval: number = 20000;

  private logger: Logger = new Logger('BootstrapGateway');
  private intervalId: NodeJS.Timeout | undefined;

  constructor() {}

  async onApplicationBootstrap() {
    await this.setupMetricLoop();
  }

  async updateInterval(value: number) {
    this.interval = value;
    await this.setupMetricLoop();
  }

  async setupMetricLoop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(async () => {
      console.log('Интервалим ' + this.interval);

      const exporterResponse = [];

      for (const host of this.hosts) {
        try {
          const result = await fetch(`http://${host.ip}:3001/api/metric`);

          const data = await result.json();
          exporterResponse.push(data);
        } catch (e) {
          console.log(e);
        }
      }

      if (!exporterResponse) {
        return;
      }

      this.server.emit('message', {
        id: Date.now(),
        text: JSON.stringify(exporterResponse),
      });
      this.logger.log('Отправлено сообщение всем клиентам');
    }, this.interval);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Клиент подключился: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Клиент отключился: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string): void {
    this.logger.log(`Получено сообщение от клиента: ${data}`);
    // Можно отправить ответ клиенту
    this.server.emit('message', {
      id: Date.now(),
      text: `Сервер получил: ${data}`,
    });
  }
}
