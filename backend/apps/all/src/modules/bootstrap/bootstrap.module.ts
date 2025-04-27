import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { BootstrapGateway } from './bootstrap.gateway';
import { ManagementModule } from '../management/management.module';

const hosts = [
  // {
  //   name: 'First',
  //   ip: '192.168.194.192',
  // },
  {
    name: 'Two',
    ip: 'localhost',
  },
];

@Module({
  imports: [ManagementModule],
  providers: [BootstrapGateway],
  exports: [BootstrapGateway],
})
export class BootstrapModule implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
    await this.sendHosts();
    setInterval(this.sendHosts, 5000);
  }

  async sendHosts() {
    for await (const host of hosts) {
      try {
        await fetch(`http://${host.ip}:3001/api/metric/set-hosts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(hosts),
        });
      } catch (e) {
        console.log(e);
      }
    }
  }
}
