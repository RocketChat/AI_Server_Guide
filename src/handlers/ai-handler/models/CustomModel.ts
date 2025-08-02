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

        const payload = {
            model: 'llama3',
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 2000,
        };

        const request = {
            headers: {
                'Content-Type': 'application/json',
            },
            data: payload,
        };
        try {
            const response = await http.post(url, request);
            this.app.getLogger().info('CustomModel response:', response);
            return this.processResponse(response);
        }
        catch (error) {
            console.error('Error in CustomModel.generateResponse:', error);
            return JSON.stringify({ message: 'Sorry! I was unable to process your request. Please try again.' });
        }
    }

    public async generateToolResponse(commandsList: any, input: string, http: IHttp, read: IRead, user: IUser): Promise<string> {
        //TODO
        return 'Tools are not supported by Custom AI Provider now.';
    }

    public processResponse(response: any): string {
        try {
            const content = response.content || response.data;
            return content ? content : JSON.stringify({ message: 'Sorry! I was unable to process your request. Please try again.' + content });
        } catch {
            return JSON.stringify({ message: 'Sorry! I was unable to process your request. Please try again.' });
        }
    }
}
