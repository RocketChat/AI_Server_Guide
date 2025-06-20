import { IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { getDefaultAdminConfig } from '../../../../definitions/IAdminConfig';
import { IAIModel } from '../../../../definitions/IAIModel';
import { PromptEnum } from '../../../../enums/promptEnum';
import { PromptProvider } from '../../../constants/PromptProvider';
import { AdminPersistence } from '../../../persistence/AdminPersistence';
import { ConversationHistoryPersistence } from '../../../persistence/ConversationPersistence';

export async function handleOnboardingMessage(
    adminMessage: string,
    adminStorage: AdminPersistence,
    historyStorage: ConversationHistoryPersistence,
    aiModel: IAIModel,
    http: IHttp,
    read: IRead,
    userId: string,
): Promise<string> {
    try {
        const rawHistory = await historyStorage.getHistory('onboarding', userId);
        const historyContext = Array.isArray(rawHistory) ? rawHistory.join('\n') : '';

        const prompt = PromptProvider.getAdminPrompt(
            PromptEnum.ADMIN_WELCOME_MESSAGE_SETUP_PROMPT,
            { adminMessage, history: historyContext },
        );

        const aiResponse = await aiModel.generateResponse(prompt, http, read);
        const {
            aihelp = false,
            aiMessage = '',
            message = '',
            followup = '',
        } = JSON.parse(aiResponse || '{}');

        await historyStorage.updateHistory('onboarding', userId, `user: ${adminMessage}`);

        if (aihelp) {
            await historyStorage.updateHistory('onboarding', userId, `bot: ${aiMessage}`);
            return `${aiMessage}\n${followup}`;
        }

        const adminConfig = (await adminStorage.getAdminConfig()) ?? getDefaultAdminConfig();
        adminConfig.welcomeMessage = message;

        await adminStorage.storeAdminConfig(adminConfig);
        await historyStorage.updateHistory('onboarding', userId, `bot: ${message}`);

        return `Welcome message set successfully.\n${message}\n${followup}`;
    } catch (error) {
        console.log('Error in handleOnboardingMessage:', error);
        return 'Failed to process the onboarding request.';
    }
}
