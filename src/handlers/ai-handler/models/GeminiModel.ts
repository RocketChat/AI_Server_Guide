import { IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { SettingEnum } from '../../../../config/settings';
import { RocketChatApiService } from '../../../../utils/api';
import { PromptProvider } from '../../../constants/PromptProvider';
import { PromptEnum } from '../../../../enums/promptEnum';
import { MessageEnum } from '../../../../enums/messageEnum';
import { IAIModel } from '../../../../definitions/IAIModel';

export class GeminiModel implements IAIModel {
    private readonly apiService: RocketChatApiService;

    constructor(apiService?: RocketChatApiService) {
        if (apiService)
            this.apiService = apiService;
    }
    public async generateResponse(prompt: string, http: IHttp, read: IRead): Promise<string> {
        const geminiApiKey = await read.getEnvironmentReader().getSettings().getValueById(SettingEnum.GEMINI_AI_API_KEY_ID);
        if (!geminiApiKey) {
            return MessageEnum.API_KEY_MISSING_TEXT;
        }

        const body = {
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
        };

        const response = await http.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
            {
                headers: { 'Content-Type': 'application/json' },
                content: JSON.stringify(body),
            },
        );

        if (response.statusCode !== 200 || !response.content) {
            return JSON.stringify({ message: 'Sorry! I was unable to process your request. Please try again.' });
        }

        return this.processResponse(response.content);
    }

    public async generateToolResponse(commandsList: any, input: string, http: IHttp, read: IRead, user: IUser): Promise<string> {
        const apiKey = await read.getEnvironmentReader().getSettings().getValueById(SettingEnum.GEMINI_AI_API_KEY_ID);
        if (!apiKey) {
            return ' Gemini API key is missing. Please configure it in settings.';
        }

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

        const systemPrompt = PromptProvider.getUserPrompt(PromptEnum.USER_COMMAND_SYSTEM_PROMPT, {
            userMessage: input,
        });

        const requestBody = {
            contents: [{ role: 'user', parts: [{ text: input }] }],
            systemInstruction: {
                role: 'system',
                parts: [{ text: systemPrompt }],
            },
            tools: [{ functionDeclarations: commandList }],
        };

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await http.post(url, {
            headers: { 'Content-Type': 'application/json' },
            content: JSON.stringify(requestBody),
        });

        if (response.statusCode !== 200 || !response.content) {
            return ` Gemini Error: ${response.statusCode}`;
        }

        const json = JSON.parse(response.content);
        const candidate = json?.candidates?.[0];
        const content = candidate?.content;
        const parts = content?.parts || [];
        const messageText = parts.map((p: any) => p.text).filter(Boolean).join(' ').trim();

        for (const part of parts) {
            if (part.functionCall?.name) {
                const command = part.functionCall.name;
                const args = part.functionCall.args || {};

                const room = args.roomToExecute;
                const commandArgs = { ...args };
                delete commandArgs.roomToExecute;

                if (!room) {
                    return ` You didn't specify the room where I should run /${command}. Please mention it explicitly.`;
                }

                const matchedTool = (commandsList.commands || []).find((cmd: any) => cmd.command === command);
                if (matchedTool) {
                    try {
                        const flatParams = Object.values(commandArgs).join(' ');
                        const bot = await read.getUserReader().getAppUser();
                        const defaultRoom = await read.getRoomReader().getDirectByUsernames([bot?.username || 'aiserverguideagent.bot', user.username]);
                        await this.apiService.executeCommand(http, command, flatParams, read, room, defaultRoom);
                        return messageText || ` Command /${command} executed.`;
                    } catch (error: any) {
                        console.log(`Error executing command /${command}:`, error);
                        return ` Failed to execute /${command}`;
                    }
                } else {
                    return messageText || ` Command /${command} not found.`;
                }
            }
        }

        return messageText || ' I could not understand the request.';
    }

    public processResponse(responseContent: string): string {
        try {
            const text = JSON.parse(responseContent)?.candidates?.[0]?.content?.parts?.[0]?.text;
            const match = text?.match(/\{[\s\S]*\}/);
            return match ? match[0] : JSON.stringify({ message: 'Sorry! I was unable to process your request. Please try again.' });
        } catch {
            return JSON.stringify({ message: 'Sorry! I was unable to process your request. Please try again.' });
        }
    }
}
