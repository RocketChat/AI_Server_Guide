import { IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';

export interface IAIModel {
    generateResponse(message: string, http: IHttp, read: IRead): Promise<string>;
    processResponse(response: string): string;
}
