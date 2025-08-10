import {
    ISetting,
    SettingType,
} from '@rocket.chat/apps-engine/definition/settings';

export enum SettingEnum {
    AI_PROVIDER_OPTION_ID = 'ai-provider-option-id',
    AI_API_KEY_ID = 'ai-api-key-id',
    CUSTOM_MODEL_URL = 'custom-model-url',
    GEMINI = 'gemini',
    CUSTOM = 'custom',
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
            {
                key: SettingEnum.CUSTOM,
                i18nLabel: 'custom AI Provider',
            }
        ],
    },
    {
        id: SettingEnum.AI_API_KEY_ID,
        type: SettingType.PASSWORD,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: 'AI API Key',
        i18nPlaceholder: 'AI API Key',
    },
    {
        id: SettingEnum.CUSTOM_MODEL_URL,
        type: SettingType.STRING,
        packageValue: '',
        required: false,
        public: false,
        i18nLabel: 'Custom AI Model URL',
        i18nPlaceholder: 'Custom AI Model URL',
    }
];
