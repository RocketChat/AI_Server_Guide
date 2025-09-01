import { IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { getDefaultAdminConfig, IAdminConfig } from '../../../../definitions/IAdminConfig';
import { IAIModel } from '../../../../definitions/IAIModel';
import { PromptEnum } from '../../../../enums/promptEnum';
import { WorkflowEnum } from '../../../../enums/workflowEnum';
import { PromptProvider } from '../../../constants/PromptProvider';
import { AdminPersistence } from '../../../persistence/AdminPersistence';
import { ConversationHistoryPersistence } from '../../../persistence/ConversationPersistence';

export async function handleChannelRecommendation(
    adminMessage: string,
    adminStorage: AdminPersistence,
    historyStorage: ConversationHistoryPersistence,
    aiModel: IAIModel,
    http: IHttp,
    read: IRead,
    userId: string,
): Promise<string> {
    try {
        const rawHistory = await historyStorage.getHistory(WorkflowEnum.ADMIN_CHANNEL_RECOMMENDATION, userId);
        const historyContext = Array.isArray(rawHistory) ? rawHistory.join('\n') : '';
        const adminConfig = (await adminStorage.getAdminConfig()) ?? getDefaultAdminConfig();

        const prompt = PromptProvider.getAdminPrompt(PromptEnum.ADMIN_CHANNEL_RECOMMENDATIONS_PROMPT, {
            adminMessage,
            history: historyContext,
            adminConfig,
        });

        const aiRawResponse = await aiModel.generateResponse(prompt, http, read);
        const parsedResponse = JSON.parse(aiRawResponse || '{}');

        const {
            aihelp = false,
            aiMessage = '',
            channelRecommendations = '',
            followup = '',
            new_comer_channel,
        } = parsedResponse;
        const raw = new_comer_channel as unknown;

        const newComerChannel: Array<string> = Array.isArray(raw)
            ? raw.map((ch) => String(ch).trim()).filter(Boolean)
            : typeof raw === 'string'
                ? [raw.trim()]
                : [];

        await historyStorage.updateHistory(WorkflowEnum.ADMIN_CHANNEL_RECOMMENDATION, userId, `user: ${adminMessage}`);

        if (aihelp) {
            await historyStorage.updateHistory(WorkflowEnum.ADMIN_CHANNEL_RECOMMENDATION, userId, `bot: ${aiMessage}`);
            return aiMessage + followup;
        }

        adminConfig.recommendedChannels = channelRecommendations;
        adminConfig.newComerChannel = newComerChannel;
        await adminStorage.storeAdminConfig(adminConfig);

        const successMessage =
            `🎉 Channel recommendations saved successfully.\n\n` +
            `Recommended Channels:\n${channelRecommendations || 'None'}\n\n` +
            `New User Channels:\n${newComerChannel.join(', ') || 'None'}\n\n` +
            `${followup}`;

        await historyStorage.updateHistory('channel_recommendation', userId, `bot: ${successMessage}`);
        return successMessage;
    } catch (error) {
        console.error('Error in handleChannelRecommendation:', error);
        return '⚠️ Failed to process the channel recommendation request.';
    }
}
