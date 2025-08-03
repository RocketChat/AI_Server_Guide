import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IModify, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IPersistence } from "@rocket.chat/apps-engine/definition/accessors";
import { AdminPersistence } from "../../../persistence/AdminPersistence";
import { getModel } from "../../ai-handler/AIModelHandler";
import { PromptProvider } from "../../../constants/PromptProvider";
import { PromptEnum } from "../../../../enums/promptEnum";
export async function handleModeration(
    botUser: IUser,
    modify: IModify,
    message: IMessage,
    read: IRead,
    persistence: IPersistence,
    http: IHttp,
): Promise<string | null> {
    const adminStore = new AdminPersistence(persistence, read.getPersistenceReader());
    const adminConfig = await adminStore.getAdminConfig();

    if (!adminConfig?.serverRules) {
        return null;
    }

    const messages = await read.getRoomReader().getMessages(message.room.id, {
        limit: 10,
    });

    const messageHistory = messages
        .map((msg) => `sender : "${msg.sender.username}" , message: "${msg.text}"`)
        .join('\n');

    const details = {
        roomName: message.room.displayName,
        userName: message.sender.username,
        serverRules: adminConfig?.serverRules ?? '',
        messageHistory: messageHistory || 'No previous messages available',
    }
    const model = await getModel(read);
    const moderationPrompt = PromptProvider.getUserPrompt(
        PromptEnum.USER_MODERATION_PROMPT,
        { userMessage: message.text ?? '', customInfo: details });
    try {

        const response = await model.generateResponse(moderationPrompt, http, read);
        const { violates, reply, deleteMessage, replyNeeded } = JSON.parse(response);
        if (violates) {
            if (deleteMessage) {
                await modify.getDeleter().deleteMessage(message, botUser);
            }
            if (replyNeeded)
                return reply;
        }
    } catch (error) {
        console.error('Error generating moderation response:', error);
    }
    return null;
}