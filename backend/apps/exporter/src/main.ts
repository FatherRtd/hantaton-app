import * as zmq from 'zeromq';
import * as fs from 'fs';
import {monitorTraffic, setup, stopContainer, startContainer, clearStatistic, removeContainer} from "./exporter";
import {ExporterMessageDto} from "./models/dtos/exporter-message.dto";
import {ExporterMessageTypeEnum} from "./models/enums/exporter-message-type.enum";

// Бутстрап метрик
(async () => {
    await clearStatistic();
    await setup();
})()

// Путь к сокету
const socketPathMetric = '/tmp/appMetric.sock';
const socketPathManagement = '/tmp/appManagement.sock'

// Очистка старого сокета, если он существует
if (fs.existsSync(socketPathMetric)) {
    fs.unlinkSync(socketPathMetric);
}
if (fs.existsSync(socketPathManagement)) {
    fs.unlinkSync(socketPathManagement);
}

async function runMetricServer(): Promise<void> {
    const sock = new zmq.Reply();

    try {
        await sock.bind(`ipc://${socketPathMetric}`);
        console.log(`Сервер привязан к ${socketPathMetric}`);

        for await (const [msg] of sock) {
            const received = msg.toString();
            console.log('Получено:', received);

            await sock.send(await allHandle(received));
        }
    } catch (error) {
        console.error('Ошибка сервера:', error);
    }
}

async function runManagementServer(): Promise<void> {
    const router = new zmq.Router();

    try {
        await router.bind(`ipc://${socketPathManagement}`);

        const messageQueue: { identity: Buffer; message: string }[] = [];
        let isProcessing = false;

        async function processQueue() {
            if (isProcessing || messageQueue.length === 0) return;

            isProcessing = true;
            const { identity, message } = messageQueue.shift()!;

            // Имитация обработки сообщения
            const response = await allHandle(message);
            await router.send([identity, response]);
            console.log("Ответ отправлен:", response);

            isProcessing = false;
            processQueue(); // Обрабатываем следующий элемент
        }

        for await (const [identity, message] of router) {
            console.log("Получено сообщение:", message.toString());
            messageQueue.push({ identity, message: message.toString() });
            processQueue();
        }

        // for await (const [msg] of router) {
        //     const received = msg.toString();
        //     console.log('Получено:', received);
        //
        //     await router.send(await allHandle(received));
        // }
    } catch (error) {
        console.error('Ошибка сервера:', error);
    }
}

async function allHandle(received: string) {
    const parsedMessage = JSON.parse(received) as ExporterMessageDto;
    console.log(parsedMessage)

    let response = "";
    switch (parsedMessage.type) {
        case (ExporterMessageTypeEnum.Metrics):
            response = await handleMetrics(parsedMessage.hosts!);
            break;
        case ExporterMessageTypeEnum.Start:
            response = await handleStart(parsedMessage.containerId!);
            break;
        case ExporterMessageTypeEnum.Stop:
            response = await handleStop(parsedMessage.containerId!);
            break;
        case ExporterMessageTypeEnum.Remove:
            response = await handleRemove(parsedMessage.containerId!);
            break;
    }

    return response;
}

async function handleMetrics(hosts: { name: string; ip: string }[]) {
    const monitorResult = await monitorTraffic(hosts);
    return JSON.stringify(monitorResult, null, 2);
}

async function handleStart(containerId: string) {
    await startContainer(containerId);
    return "ОК";
}

async function handleStop(containerId: string) {
    await stopContainer(containerId);
    return "ОК";
}

async function handleRemove(containerId: string) {
    await removeContainer(containerId);
    return "ОК";
}

runMetricServer().catch(err => console.error('Ошибка запуска:', err));
runManagementServer().catch(err => console.error('Ошибка запуска:', err));