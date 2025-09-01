import { RocketChatApiService } from "../../../../utils/api";
import { IRead, IHttp } from '@rocket.chat/apps-engine/definition/accessors';
import { ConversationHistoryPersistence } from "../../../persistence/ConversationPersistence";
import { PromptProvider } from "../../../constants/PromptProvider";
import { PromptEnum } from "../../../../enums/promptEnum";
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IPersistence } from "@rocket.chat/apps-engine/definition/accessors";
import { ApiConfigPersistence } from "../../../persistence/ApiConfigPersistence";
import { getDefaultApiConfig } from "../../../../definitions/IApiConfig";
import { getModel } from "../../ai-handler/AIModelHandler";

export async function handleToolExecute(
    userMessage: string,
    read: IRead,
    http: IHttp,
    historyStore: ConversationHistoryPersistence,
    user: IUser,
    persistence: IPersistence,
): Promise<string> {
    const apiConfigStore = new ApiConfigPersistence(persistence, read.getPersistenceReader());
    const apiConfig = await apiConfigStore.getApiConfig(user.id);

    const apiService = new RocketChatApiService(apiConfig ?? getDefaultApiConfig());
    const model = await getModel(read, apiService);
    const commandsList = await apiService.fetchCommandsList(http, read);
    if (!commandsList || !commandsList.commands || commandsList.commands.length === 0) {
        return 'No commands available to execute.';
    }
    const history = (await historyStore.getHistory('tool_execute', user.id)).join('\n');

    const input = PromptProvider.getUserPrompt(
        PromptEnum.USER_COMMAND_EXECUTE_PROMPT,
        {
            userMessage,
            history,
        }
    )
    const response = await model.generateToolResponse(commandsList, input, http, read, user);
    try {
        await historyStore.updateHistory('tool_execute', user.id, 'user: ' + userMessage);
        await historyStore.updateHistory('tool_execute', user.id, 'bot: ' + response);
    }
    catch (error) {
        console.error('Error updating history:', error);
    }
    return response;
}