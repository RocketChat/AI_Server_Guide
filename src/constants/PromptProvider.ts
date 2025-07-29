import { IAdminConfig } from '../../definitions/IAdminConfig';
import { PromptEnum } from '../../enums/promptEnum';
import { AdminPrompt } from './AdminPrompt';
import { promptInjectionSafety } from './PromptInjectionSafety';
import { UserPrompt } from './UserPrompt';
export class PromptProvider {
    public static getPromptInjectionSafetyPrompt(adminMessage: string): string {
        return promptInjectionSafety(adminMessage);
    }
    public static getAdminPrompt(
        type: PromptEnum,
        details: { adminMessage: string, history?: string, adminConfig?: IAdminConfig },
    ): string {
        const { adminMessage, history, adminConfig } = details;
        switch (type) {
            case PromptEnum.ADMIN_WORKFLOW_DETECTION_PROMPT:
                return AdminPrompt.getWorkflowDetectionPrompt(adminMessage, history);
            case PromptEnum.ADMIN_WELCOME_MESSAGE_SETUP_PROMPT:
                return AdminPrompt.getWelcomeMessageSetupPrompt(adminMessage, history, adminConfig);
            case PromptEnum.ADMIN_CHANNEL_RECOMMENDATIONS_PROMPT:
                return AdminPrompt.getChannelRecommendationPrompt(adminMessage, history, adminConfig);
            case PromptEnum.ADMIN_SERVER_RULES_PROMPT:
                return AdminPrompt.getServerRulesPrompt(adminMessage, history, adminConfig);
            case PromptEnum.ADMIN_SEND_MESSAGE:
                return AdminPrompt.getSendMessagePrompt(adminMessage, history);
            default:
                throw new Error('Invalid prompt type');
        }
    }
    public static getUserPrompt(
        type: PromptEnum,
        details: { userMessage: string, history?: string, toolDescription?: string },
    ): string {
        const { userMessage, history, toolDescription } = details;
        switch (type) {
            case PromptEnum.USER_WORKFLOW_DETECTION_PROMPT:
                return UserPrompt.getWorkflowDetectionPrompt(userMessage, history);
            case PromptEnum.USER_COMMAND_EXECUTE_PROMPT:
                return UserPrompt.getToolExecuteUserPrompt(userMessage, history);
            case PromptEnum.USER_COMMAND_SYSTEM_PROMPT:
                return UserPrompt.getToolExecuteSystemPrompt(toolDescription);
            default:
                throw new Error('Invalid prompt type');
        }
    }
}
