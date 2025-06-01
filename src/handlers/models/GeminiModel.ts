import { IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { SettingEnum } from '../../../config/settings';
import { IAIModel } from '../../../definitions/IAIModel';

export class GeminiModel implements IAIModel {
    public async generateResponse(prompt: string, http: IHttp, read: IRead): Promise<string> {
        const geminiApiKey = await read.getEnvironmentReader().getSettings().getValueById(SettingEnum.GEMINI_AI_API_KEY_ID);

        if (!geminiApiKey) {
            return JSON.stringify({ message: 'Gemini API key is missing. Please configure it in settings.' });
        }

        const body = {
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
        };

        const response = await http.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
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
