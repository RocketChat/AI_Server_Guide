export enum Modals {
    AdminConfigModal = 'server-guide-create-modal',
}

export enum BlockIds {
    ServerUrl = 'serverUrl',
    XAuthToken = 'xAuthToken',
    XUserId = 'xUserId',
    WelcomeMessage = 'welcomeMessage',
    ServerRules = 'serverRules',
    RecommendedChannels = 'recommendedChannels',
    NewComerChannel = 'newComerChannel',
}

export enum ActionIds {
    ServerUrl = 'server_url_config',
    XAuthToken = 'x_auth_token_config',
    XUserId = 'x_user_id_config',
    WelcomeMessage = 'welcome_message_config',
    ServerRules = 'server_rules_config',
    ChannelRecommendation = 'channel_recommendation_config',
    NewUserChannels = 'new_user_channel_config',
}

export const ModalText = {
    Title: 'Configurations',
    SaveButton: 'Save Changes',
    Labels: {
        ServerUrl: '### Enter Server URL',
        XAuthToken: '### Enter X-Auth Token',
        XUserId: '### Enter X-User ID',
        WelcomeMessage: '### Current Welcome Message',
        ServerRules: '### Current Server Rules ',
        ChannelRecommendation: '### Current Channel Recommendation ',
        NewUserChannels: '### Default Channels for new users ',
    },
    Placeholders: {
        ServerUrl: 'Server URL is not set yet',
        XAuthToken: 'X-Auth Token is not set yet',
        XUserId: 'X-User ID is not set yet',
        WelcomeMessage: 'No welcome message set yet',
        ServerRules: 'Server Rules is not set yet',
        ChannelRecommendation: 'channel recommendations are not set yet',
        NewUserChannels: 'new user channels are not set yet',
    },
};
