import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import {IRoom} from '@rocket.chat/apps-engine/definition/rooms';
import { MessageEnum } from '../enums/messageEnum';
import { PromptEnum } from '../enums/promptEnum';
import { PromptProvider } from '../src/constants/PromptProvider';
import { getModel } from '../src/handlers/ai-handler/AIModelHandler';
import { handleOnboardingMessage } from '../src/handlers/message-handler/admin/onboardingMessageHandler';
import { AdminPersistence } from '../src/persistence/AdminPersistence';
import { ConversationHistoryPersistence } from '../src/persistence/ConversationPersistence';
import {sendIntermediate} from './message';

export async function processAdminMessage(
    message: IMessage,
    read: IRead,
    http: IHttp,
    modify: IModify,
    persistence: IPersistence,
): Promise<string> {
    const input = message.text?.trim();
    if (!input) {
        return MessageEnum.MESSAGE_PROCESSING_ERROR;
    }

    const model = await getModel(read);
    const isSafe = await checkPromptSafety(input, model, http, read);
    if (!isSafe) {
        return MessageEnum.MESSAGE_PROCESSING_ERROR;
    }

    const context = await getContextText(read, message.room.id);

    const prompt = PromptProvider.getAdminPrompt(PromptEnum.ADMIN_WORKFLOW_DETECTION_PROMPT, {
        adminMessage: input,
        history: context,
    });

    const rawResponse = await model.generateResponse(prompt, http, read);
    if (rawResponse === MessageEnum.API_KEY_MISSING_TEXT) {
        return rawResponse;
    }

    let workflowData: any;
    try {
        workflowData = JSON.parse(rawResponse);
    } catch {
        return MessageEnum.MESSAGE_PROCESSING_ERROR;
    }

    const {
        workflow,
        message: intermediateMessage = 'Processing your request...',
        channels,
        users,
        messageToSend,
    } = workflowData;

    if (workflow !== 'unknown') {
        await sendIntermediate(modify, message.room, intermediateMessage);
    }

    const userId = message.sender.id;
    const adminStore = new AdminPersistence(persistence, read.getPersistenceReader());
    const historyStore = new ConversationHistoryPersistence(persistence, read.getPersistenceReader());

    switch (workflow) {
        case 'onboarding_message':
            return handleOnboardingMessage(input, adminStore, historyStore, model, http, read, userId);
        default:
            return MessageEnum.INSTRUCTION_TEXT.toString();
    }
}

async function checkPromptSafety(
    input: string,
    model: any,
    http: IHttp,
    read: IRead,
): Promise<boolean> {
    const prompt = PromptProvider.getPromptInjectionSafetyPrompt(input);
    const output = await model.generateResponse(prompt, http, read);
    try {
        const { issafe } = JSON.parse(output);
        return !!issafe;
    } catch {
        return false;
    }
}

async function getContextText(read: IRead, roomId: string): Promise<string> {
    const messages = await read.getRoomReader().getMessages(roomId, {
        limit: 20,
        sort: { createdAt: 'asc' },
    });
    return messages.map((msg) => `${msg.sender.username}: ${msg.text || ''}`).join('\n');
}
