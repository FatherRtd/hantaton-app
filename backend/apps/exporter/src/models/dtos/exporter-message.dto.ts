import { ExporterMessageTypeEnum } from '../enums/exporter-message-type.enum';

export class ExporterMessageDto {
    private constructor(
        type: ExporterMessageTypeEnum,
        containerId?: string,
        hosts?: any,
    ) {
        this.type = type;
        this.containerId = containerId;
        this.hosts = hosts;
    }

    timestamp: string = new Date().toISOString();
    type: ExporterMessageTypeEnum;
    containerId?: string;
    hosts?: { name: string; ip: string; }[];
}
