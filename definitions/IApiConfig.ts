
export interface IApiConfig {
    serverUrl: string;
    xAuthToken: string;
    xUserId: string;
}

export function getDefaultApiConfig(): IApiConfig {
    return {
        serverUrl: '',
        xAuthToken: '',
        xUserId: '',
    };
}
