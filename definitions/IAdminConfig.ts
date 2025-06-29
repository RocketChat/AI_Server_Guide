export interface IAdminConfig {
    welcomeMessage: string;
    recommendedChannels: string;
    newComerChannel: Array<string>;
    serverRules: string;
    channelReport?: string;
}

export function getDefaultAdminConfig(): IAdminConfig {
    return {
        welcomeMessage: '',
        recommendedChannels: '',
        newComerChannel: [],
        serverRules: '',
        channelReport: '',
    };
}
