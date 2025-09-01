import { IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { SettingEnum } from '../../../../config/settings';
import { RocketChatApiService } from '../../../../utils/api';
import { IAIModel } from '../../../../definitions/IAIModel';
import { AiServerGuideAgentApp } from '../../../../AiServerGuideAgentApp';

export class CustomModel implements IAIModel {
    private readonly apiService: RocketChatApiService;
    private readonly app: AiServerGuideAgentApp;
    constructor(apiService?: RocketChatApiService) {
        if (apiService)
            this.apiService = apiService;
    }
    public async generateResponse(prompt: string, http: IHttp, read: IRead): Promise<string> {
        const url = await read.getEnvironmentReader().getSettings().getValueById(SettingEnum.CUSTOM_MODEL_URL);
        if (!url) {
            return "Custom model URL is not configured.";
        }
        url.trim();

        const body = {
            model: 'llama3-8b',
            messages: [
                {
                    role: 'system',
                    content: prompt,
                },
            ],
            temperature: 0.7,
        };

        const request = {
            headers: {
                'Content-Type': 'application/json',
            },
            content: JSON.stringify(body),
        };
        try {
            const response = await http.post(url, request);
            return this.processResponse(response);
        }
        catch (error) {
            console.error('Error in CustomModel.generateResponse:', error);
            return JSON.stringify({ message: 'Sorry! I was unable to process your request. Please try again.' });
        }
    }

    public async generateToolResponse(commandsList: any, input: string, http: IHttp, read: IRead, user: IUser): Promise<string> {
        const url = await read.getEnvironmentReader().getSettings().getValueById(SettingEnum.CUSTOM_MODEL_URL);
        if (!url) {
            return "Custom model URL is not configured.";
        }
        if (!commandsList) {
            return "No commands available to process.";
        }
        url.trim();
        const commandList = (commandsList.commands || []).map((cmd: any) => ({
            name: cmd.command,
            description: cmd.description || 'No description provided.',
            parameters: {
                type: 'object',
                properties: {
                    ...(cmd.params && typeof cmd.params === 'string'
                        ? { [cmd.params]: { type: 'string' } }
                        : {}),
                    roomToExecute: {
                        type: 'string',
                        description: 'Name of the room where the command should be executed',
                    },
                },
                required: [
                    ...(cmd.params ? [cmd.params] : []),
                    'roomToExecute',
                ],
            },
        }));
        const body = {
            model: 'llama3-8b',
            messages: [
                {
                    role: 'system',
                    content: `Identify the command from the input and provide a response based on the available commands. 
                              User query: ${input} .
                              From the available commands: 
                                ${commandsList.commands}
                              `,
                },
            ],
            temperature: 0.7
        };
        const request = {
            headers: {
                'Content-Type': 'application/json',
            },
            content: JSON.stringify(body),
        };

        try {
            const response = await http.post(url, request);
            const json = await JSON.stringify(response.content);
            return JSON.stringify(commandList[0]);
        }
        catch (error) {
            return JSON.stringify({ message: 'Sorry! I was unable to process your request. Please try again.' });
        }
        return JSON.stringify({ message: 'Sorry! I was unable to process your request. Please try again.' });
    }

    public processResponse(response: any): string {
        try {

            const { choices } = response.data;
            const content = choices[0].message.content;
            return content ? content : JSON.stringify({ message: 'Sorry! I was unable to process your request. Please try again.' + response.statusCode });
        } catch (error) {
            return JSON.stringify({ message: 'Sorry! I was unable to process your request. Please try again.' + (response || '') });
        }
    }
}
