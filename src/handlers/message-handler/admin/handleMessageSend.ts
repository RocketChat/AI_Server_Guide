import { IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { IAIModel } from '../../../../definitions/IAIModel';
import { PromptEnum } from '../../../../enums/promptEnum';
import { WorkflowEnum } from '../../../../enums/workflowEnum';
import { sendBulkMessage } from '../../../../utils/message';
import { PromptProvider } from '../../../constants/PromptProvider';
import { ConversationHistoryPersistence } from '../../../persistence/ConversationPersistence';

export async function handleMessageSend(
    adminMessage: string,
    historyStorage: ConversationHistoryPersistence,
    aiModel: IAIModel,
    http: IHttp,
    read: IRead,
    userId: string,
    modify: IModify,
): Promise<string> {
    const history = (await historyStorage.getHistory(WorkflowEnum.ADMIN_MESSAGE_SEND, userId)).join('\n');
    const sendMessagePrompt = PromptProvider.getAdminPrompt(
        PromptEnum.ADMIN_SEND_MESSAGE,
        { adminMessage, history },
    );
    const sendMessageResponse = await aiModel.generateResponse(
        sendMessagePrompt,
        http,
        read,
    );

    try {
        const { aihelp, message, aiMessage, channels, users, followup } = JSON.parse(sendMessageResponse);
        await sendBulkMessage(aihelp, channels, users, message, read, modify);
        await historyStorage.updateHistory(WorkflowEnum.ADMIN_MESSAGE_SEND, userId, 'user: ' + adminMessage);
        if (aihelp) {
            await historyStorage.updateHistory(WorkflowEnum.ADMIN_MESSAGE_SEND, userId, 'bot: ' + aiMessage);
            return aiMessage;
        }
        const finalMessage = 'Message Sent Successfully ! \n This is the message which is sent:'
            + '\n' + message + '\n' + followup;
        await historyStorage.updateHistory(WorkflowEnum.ADMIN_MESSAGE_SEND, userId, 'bot: ' + finalMessage);
        return finalMessage;
    } catch (error) {
        console.error('Error parsing AI response for server rules:', error);
        return 'Failed to process the server rules request.';
    }
}
