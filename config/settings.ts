import {
    ISetting,
    SettingType,
} from '@rocket.chat/apps-engine/definition/settings';

export enum SettingEnum {
    AI_PROVIDER_OPTION_ID = 'ai-provider-option-id',
    GEMINI_AI_API_KEY_ID = 'gemini-ai-api-key-id',
    GEMINI = 'gemini',
}

export const Settings: Array<ISetting> = [
    {
        id: SettingEnum.AI_PROVIDER_OPTION_ID,
        type: SettingType.SELECT,
        packageValue: SettingEnum.GEMINI,
        required: true,
        public: false,
        i18nLabel: 'Choose AI Provider',
        i18nPlaceholder: 'Choose AI Provider Placeholder',
        values: [
            {
                key: SettingEnum.GEMINI,
                i18nLabel: 'Gemini AI',
            },
        ],
    },
    {
        id: SettingEnum.GEMINI_AI_API_KEY_ID,
        type: SettingType.PASSWORD,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: 'Gemini API Key',
        i18nPlaceholder: 'Gemini API Key',
    }
];
