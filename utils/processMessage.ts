import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoomRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { MessageEnum } from '../enums/messageEnum';
import { PromptEnum } from '../enums/promptEnum';
import { PromptProvider } from '../src/constants/PromptProvider';
import { getModel } from '../src/handlers/ai-handler/AIModelHandler';
import { handleOnboardingMessage } from '../src/handlers/message-handler/admin/onboardingMessageHandler';
import { AdminPersistence } from '../src/persistence/AdminPersistence';
import { ConversationHistoryPersistence } from '../src/persistence/ConversationPersistence';

export async function processAdminMessage(
    message: IMessage,
    read: IRead,
    http: IHttp,
    modify: IModify,
    persistence: IPersistence,
): Promise<string> {

    if (!message.text?.trim()) {
        return 'Hi there! Could you let me know what you\'d like help with?';
    }

    const adminMessage = message.text.trim();
    const aiModel = await getModel(read);

    const injectionCheckPrompt = PromptProvider.getPromptInjectionSafetyPrompt(adminMessage);
    const isSafeResponse = await aiModel.generateResponse(injectionCheckPrompt, http, read);
    const {issafe} = JSON.parse(isSafeResponse);
    if (!issafe) {
        return 'Sorry, I can\'t process that request.';
    }

    const roomMessageReader: IRoomRead = read.getRoomReader();
    const messageHistory = await roomMessageReader.getMessages(message.room.id, {
        limit: 20,
        sort: { createdAt: 'asc' },
    });

    const historyText = messageHistory
        .map((msg) => `${msg.sender.username}: ${msg.text}`)
        .join('\n');

    const adminStorage = new AdminPersistence(persistence, read.getPersistenceReader());
    const historyStorage = new ConversationHistoryPersistence(persistence, read.getPersistenceReader());
    const userId = message.sender.id;

    const workflowPrompt = PromptProvider.getAdminPrompt(PromptEnum.ADMIN_WORKFLOW_DETECTION_PROMPT, {
        adminMessage,
        history: historyText,
    });

    const workflowResponse = await aiModel.generateResponse(workflowPrompt, http, read);

    if (workflowResponse === MessageEnum.API_KEY_MISSING_TEXT) {
        return workflowResponse;
    }

    try {
        const {
            workflow,
            message: intermediateMessage = 'Processing your request...',
            channels,
            users,
            messageToSend,
        } = JSON.parse(workflowResponse);

        await modify
            .getCreator()
            .finish(
                modify
                    .getCreator()
                    .startMessage()
                    .setText(intermediateMessage)
                    .setRoom(message.room),
            );

        switch (workflow) {
            case 'onboarding_message':
                return handleOnboardingMessage(adminMessage, adminStorage, historyStorage, aiModel, http, read, userId);

            default:
                return MessageEnum.INSTRUCTION_TEXT.toString();
        }
    } catch (error) {
        console.error('Error processing admin request:', error);
        return 'Error processing the request. Please try again.';
    }
}
