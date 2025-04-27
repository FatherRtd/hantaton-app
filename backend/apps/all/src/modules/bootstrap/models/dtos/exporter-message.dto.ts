import { ExporterMessageTypeEnum } from "../enums/exporter-message-type.enum";

export class ExporterMessageDto {
    private constructor(type: ExporterMessageTypeEnum, containerId?: string) {
        this.type = type;
        this.containerId = containerId;
    }

    timestamp: string = new Date().toISOString();
    type: ExporterMessageTypeEnum;
    containerId?: string;

    public static metric() {
        return new ExporterMessageDto(ExporterMessageTypeEnum.Metrics);
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