import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { MessageEnum } from '../enums/messageEnum';
import { PromptEnum } from '../enums/promptEnum';
import { WorkflowEnum } from '../enums/workflowEnum';
import { PromptProvider } from '../src/constants/PromptProvider';
import { getModel } from '../src/handlers/ai-handler/AIModelHandler';
import { handleChannelRecommendation, handleMessageSend, handleOnboardingMessage, handleServerRules } from '../src/handlers/message-handler/admin/adminMessageHandler';
import { AdminPersistence } from '../src/persistence/AdminPersistence';
import { ConversationHistoryPersistence } from '../src/persistence/ConversationPersistence';
import { sendIntermediate } from './message';
import { handleToolExecute, handleUserChannelRecommendation } from '../src/handlers/message-handler/users/userMessageHandler';


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
        sort: { createdAt: 'desc' },
    });
    return messages.map((msg) => `${msg.sender.username}: ${msg.text || ''}`).join('\n');
}


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
    } = workflowData;

    if (workflow !== WorkflowEnum.UNKNOWN) {
        await sendIntermediate(modify, message.room, intermediateMessage);
    }

    const userId = message.sender.id;
    const adminStore = new AdminPersistence(persistence, read.getPersistenceReader());
    const historyStore = new ConversationHistoryPersistence(persistence, read.getPersistenceReader());

    switch (workflow) {
        case WorkflowEnum.ADMIN_WELCOME_MESSAGE:
            return handleOnboardingMessage(input, adminStore, historyStore, model, http, read, userId);
        case WorkflowEnum.ADMIN_CHANNEL_RECOMMENDATION:
            return handleChannelRecommendation(input, adminStore, historyStore, model, http, read, userId);
        case WorkflowEnum.ADMIN_SERVER_RULES:
            return handleServerRules(input, adminStore, historyStore, model, http, read, userId);
        case WorkflowEnum.ADMIN_MESSAGE_SEND:
            return handleMessageSend(input, historyStore, model, http, read, userId, modify);
        case WorkflowEnum.ADMIN_TOOL_EXECUTE:
            return handleToolExecute(input, read, http, historyStore, message.sender, persistence);
        default:
            return MessageEnum.INSTRUCTION_TEXT.toString();
    }
}


export async function processUserMessage(
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

    const prompt = PromptProvider.getUserPrompt(PromptEnum.USER_WORKFLOW_DETECTION_PROMPT, {
        userMessage: input,
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
    } = workflowData;

    if (workflow !== WorkflowEnum.UNKNOWN) {
        await sendIntermediate(modify, message.room, intermediateMessage);
    }

    const user = message.sender;
    const adminStore = new AdminPersistence(persistence, read.getPersistenceReader());
    const historyStore = new ConversationHistoryPersistence(persistence, read.getPersistenceReader());

    workflow.trim();
    switch (workflow) {
        case WorkflowEnum.USER_TOOL_EXECUTE:
            return handleToolExecute(input, read, http, historyStore, user, persistence);
        case WorkflowEnum.USER_CHANNEL_RECOMMENDATION:
            return handleUserChannelRecommendation(input, adminStore, historyStore, model, http, read, user.id);
        case WorkflowEnum.UNKNOWN:
        default:
            return MessageEnum.INSTRUCTION_TEXT.toString();
    }
}
