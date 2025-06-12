import {IHttp, IRead} from '@rocket.chat/apps-engine/definition/accessors';
import {IAIModel} from '../../../../definitions/IAIModel';
import {PromptEnum} from '../../../../enums/promptEnum';
import {PromptProvider} from '../../../constants/PromptProvider';
import {AdminPersistence} from '../../../persistence/AdminPersistence';
import {ConversationHistoryPersistence} from '../../../persistence/ConversationPersistence';

export async function handleOnboardingMessage(
    adminMessage: string,
    adminStorage: AdminPersistence,
    historyStorage: ConversationHistoryPersistence,
    aiModel: IAIModel,
    http: IHttp,
    read: IRead,
    userId: string,
): Promise<string> {
    const history = await historyStorage.getHistory('onboarding', userId);
    const historyContext = history.join('\n');

    const welcomeMessagePrompt = PromptProvider.getAdminPrompt(
        PromptEnum.ADMIN_WELCOME_MESSAGE_SETUP_PROMPT,
        { adminMessage, history: historyContext },
    );

    const welcomeMessageResponse = await aiModel.generateResponse(
        welcomeMessagePrompt,
        http,
        read,
    );

    try {
        const { aihelp, aiMessage, message, followup } = JSON.parse(welcomeMessageResponse);

        await historyStorage.updateHistory('onboarding', userId, adminMessage);

        if (aihelp) {
            await historyStorage.updateHistory('onboarding', userId, 'bot: ' + aiMessage);
            return aiMessage + '\n' + followup;
        }
        await historyStorage.updateHistory('onboarding', userId, 'bot: ' + message);
        const adminConfig = (await adminStorage.getAdminConfig()) || {};
        adminConfig.welcomeMessage = message;
        await adminStorage.storeAdminConfig(adminConfig);

        return 'Welcome message set successfully.' + '\n' + followup;
    } catch (error) {
        console.error('Error parsing AI response for onboarding:', error);
        return 'Failed to process the onboarding request.';
    }
}
