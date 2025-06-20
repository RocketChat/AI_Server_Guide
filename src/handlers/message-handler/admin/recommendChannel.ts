import { IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { getDefaultAdminConfig, IAdminConfig } from '../../../../definitions/IAdminConfig';
import { IAIModel } from '../../../../definitions/IAIModel';
import { PromptEnum } from '../../../../enums/promptEnum';
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
    const rawHistory = await historyStorage.getHistory('channel_recommendation', userId);
    const historyContext = Array.isArray(rawHistory) ? rawHistory.join('\n') : '';

    const adminConfig: IAdminConfig = (await adminStorage.getAdminConfig()) ?? getDefaultAdminConfig();
    const channelPrompt = PromptProvider.getAdminPrompt(PromptEnum.ADMIN_CHANNEL_RECOMMENDATIONS, {
        adminMessage,
        history: historyContext,
        adminConfig,
    });

    const channelResponse = await aiModel.generateResponse(channelPrompt, http, read);

    try {
        const parsed = JSON.parse(channelResponse || '{}');
        const aihelp = parsed.aihelp ?? false;
        const aiMessage = parsed.aiMessage ?? '';
        const channelRecommendations: string = parsed.channelRecommendations ?? '';
        const newComerChannelRaw = parsed.new_comer_channel;

        const newComerChannel: Array<string> = Array.isArray(newComerChannelRaw)
            ? newComerChannelRaw.map((ch: string) => ch.trim()).filter(Boolean)
            : typeof newComerChannelRaw === 'string'
                ? [newComerChannelRaw.trim()]
                : [];

        const followup: string = parsed.followup ?? '';

        await historyStorage.updateHistory(
            'channel_recommendation',
            userId,
            `user: ${adminMessage}`,
        );

        if (aihelp) {
            await historyStorage.updateHistory(
                'channel_recommendation',
                userId,
                `bot: ${aiMessage}`,
            );
            return aiMessage;
        }

        adminConfig.recommendedChannels = channelRecommendations;
        adminConfig.newComerChannel = newComerChannel;
        await adminStorage.storeAdminConfig(adminConfig);

        const successMessage =
            `I've saved the channel recommendation successfully.\n` +
            `These are the current settings:\n\n` +
            `${channelRecommendations}\n\n` +
            `For new users:\n${newComerChannel.join(', ')}\n\n` +
            followup;

        await historyStorage.updateHistory(
            'channel_recommendation',
            userId,
            `bot: ${successMessage}`,
        );

        return successMessage;
    } catch (error) {
        console.log('Error parsing AI response for channel recommendation:', error);
        return 'Failed to process the channel recommendation request.';
    }
}
