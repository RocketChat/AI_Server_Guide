import { IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { getDefaultAdminConfig } from '../../../../definitions/IAdminConfig';
import { IAIModel } from '../../../../definitions/IAIModel';
import { PromptEnum } from '../../../../enums/promptEnum';
import { WorkflowEnum } from '../../../../enums/workflowEnum';
import { PromptProvider } from '../../../constants/PromptProvider';
import { AdminPersistence } from '../../../persistence/AdminPersistence';
import { ConversationHistoryPersistence } from '../../../persistence/ConversationPersistence';

export async function handleUserChannelRecommendation(
    userMessage: string,
    adminStorage: AdminPersistence,
    historyStorage: ConversationHistoryPersistence,
    aiModel: IAIModel,
    http: IHttp,
    read: IRead,
    userId: string,
): Promise<string> {
    try {
        const rawHistory = await historyStorage.getHistory(WorkflowEnum.USER_CHANNEL_RECOMMENDATION, userId);
        const historyContext = Array.isArray(rawHistory) ? rawHistory.join('\n') : '';
        const adminConfig = (await adminStorage.getAdminConfig()) ?? getDefaultAdminConfig();

        const prompt = PromptProvider.getUserPrompt(PromptEnum.USER_CHANNEL_RECOMMENDATIONS_PROMPT, {
            userMessage,
            history: historyContext,
            adminConfig,
        });

        const aiRawResponse = await aiModel.generateResponse(prompt, http, read);
        const parsedResponse = JSON.parse(aiRawResponse || '{}');

        const {
            aiMessage = '',
            followup = '',
        } = parsedResponse;

        return aiMessage + "\n" + followup;
    } catch (error) {
        console.error('Error in handling channel recommendation:', error);
        return '⚠️ Failed to process the channel recommendation request.';
    }
}
