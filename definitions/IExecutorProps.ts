import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AiServerGuideAgentApp} from '../AiServerGuideAgentApp';

export interface IExecutorProps {
    sender: IUser;
    room: IRoom;
    command: Array<string>;
    context: SlashCommandContext;
    read: IRead;
    modify: IModify;
    http: IHttp;
    persistence: IPersistence;
    app: AiServerGuideAgentApp;
}
