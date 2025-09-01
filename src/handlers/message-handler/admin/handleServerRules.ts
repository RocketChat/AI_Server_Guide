import { IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { getDefaultAdminConfig } from '../../../../definitions/IAdminConfig';
import { IAIModel } from '../../../../definitions/IAIModel';
import { PromptEnum } from '../../../../enums/promptEnum';
import { PromptProvider } from '../../../constants/PromptProvider';
import { AdminPersistence } from '../../../persistence/AdminPersistence';
import { ConversationHistoryPersistence } from '../../../persistence/ConversationPersistence';
import { WorkflowEnum } from '../../../../enums/workflowEnum';

export async function handleServerRules(
    adminMessage: string,
    adminStorage: AdminPersistence,
    historyStorage: ConversationHistoryPersistence,
    aiModel: IAIModel,
    http: IHttp,
    read: IRead,
    userId: string,
): Promise<string> {
    const history = (await historyStorage.getHistory(WorkflowEnum.ADMIN_SERVER_RULES, userId)).join('\n');
    const adminConfig = (await adminStorage.getAdminConfig()) ?? getDefaultAdminConfig();
    const serverRulesPrompt = PromptProvider.getAdminPrompt(
        PromptEnum.ADMIN_SERVER_RULES_PROMPT,
        { adminMessage, history, adminConfig },
    );
    const serverRulesResponse = await aiModel.generateResponse(
        serverRulesPrompt,
        http,
        read,
    );

    try {
        const { aihelp, message, aiMessage, followup } = JSON.parse(serverRulesResponse);

        await historyStorage.updateHistory(WorkflowEnum.ADMIN_SERVER_RULES, userId, 'user: ' + adminMessage);

        if (aihelp) {
            await historyStorage.updateHistory(WorkflowEnum.ADMIN_SERVER_RULES, userId, 'bot: ' + aiMessage);
            return aiMessage;
        }

        await historyStorage.updateHistory(WorkflowEnum.ADMIN_SERVER_RULES, userId, 'bot: '
            + 'Server Rules setup Successfully ! \n Your current server rules:'
            + '\n' + message + '\n' + followup);
        adminConfig.serverRules = message;
        await adminStorage.storeAdminConfig(adminConfig);
        return 'Server Rules setup Successfully ! \n Your current server rules:' + '\n' + message + '\n' + followup;
    } catch (error) {
        console.error('Error parsing AI response for server rules:', error);
        return 'Failed to process the server rules request.';
    }
}
