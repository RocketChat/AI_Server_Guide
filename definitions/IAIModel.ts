import { IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users/IUser';

export interface IAIModel {
    generateResponse(message: string, http: IHttp, read: IRead): Promise<string>;
    generateToolResponse(
        commandsList: any,
        input: string,
        http: IHttp,
        read: IRead,
        user: IUser
    ): Promise<string>;
    processResponse(response: string): string;
}
