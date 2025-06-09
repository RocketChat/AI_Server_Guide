import {IAdminConfig} from '../../definitions/IAdminConfig';
import { PromptEnum } from '../../enums/promptEnum';
import { AdminPrompt } from './AdminPrompt';
import {promptInjectionSafety} from './PromptInjectionSafety';
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
            case PromptEnum.ADMIN_WELCOME_MESSAGE_SETUP_PROMPT:
                return AdminPrompt.getWelcomeMessageSetupPrompt(adminMessage, history, adminConfig);
            case PromptEnum.ADMIN_WORKFLOW_DETECTION_PROMPT:
                return AdminPrompt.getWorkflowDetectionPrompt(adminMessage, history);
            default:
                throw new Error('Invalid prompt type');
        }
    }
}
