import { ExporterMessageTypeEnum } from '../enums/exporter-message-type.enum';

export class ExporterMessageDto {
  private constructor(
    type: ExporterMessageTypeEnum,
    containerId?: string,
    hosts?: { ip: string; name: string }[],
  ) {
    this.type = type;
    this.containerId = containerId;
    this.hosts = hosts;
  }

  timestamp: string = new Date().toISOString();
  type: ExporterMessageTypeEnum;
  containerId?: string;
  hosts?: any;

  public static metric(hosts: { ip: string; name: string }[]) {
    return new ExporterMessageDto(
      ExporterMessageTypeEnum.Metrics,
      undefined,
      hosts,
    );
  }

  public static containerStart(containerId: string) {
    return new ExporterMessageDto(ExporterMessageTypeEnum.Start, containerId);
  }

  public static containerStop(containerId: string) {
    return new ExporterMessageDto(ExporterMessageTypeEnum.Stop, containerId);
  }

  public static containerRemove(containerId: string) {
    return new ExporterMessageDto(ExporterMessageTypeEnum.Remove, containerId);
  }
}
