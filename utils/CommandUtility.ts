import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { UIKitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AiServerGuideAgentApp } from '../AiServerGuideAgentApp';
import { IExecutorProps } from '../definitions/IExecutorProps';
import { ServerGuideConfigListModal } from '../src/modals/ServerGuideConfigListModal';

export class CommandUtility {
    public sender: IUser;
    public room: IRoom;
    public command: Array<string>;
    public context: SlashCommandContext;
    public read: IRead;
    public modify: IModify;
    public http: IHttp;
    public persistence: IPersistence;
    public app: AiServerGuideAgentApp;

    constructor(props: IExecutorProps) {
        this.sender = props.sender;
        this.room = props.room;
        this.command = props.command;
        this.context = props.context;
        this.read = props.read;
        this.modify = props.modify;
        this.http = props.http;
        this.persistence = props.persistence;
        this.app = props.app;
    }

    public async openAdminConfigModal(): Promise<void> {
        await this.openModal(ServerGuideConfigListModal);
    }

    private async openModal(
        modalCreator: Function,
        uiKitContext?: UIKitInteractionContext,
    ): Promise<void> {
        const triggerId = this.context.getTriggerId();
        if (!triggerId) {
            throw new Error('No triggerId available for modal opening');
        }

        const modal = await modalCreator({
            modify: this.modify,
            read: this.read,
            persistence: this.persistence,
            http: this.http,
            slashCommandContext: this.context,
            uiKitContext,
        });

        await this.modify
            .getUiController()
            .openModalView(modal, { triggerId }, this.sender);
    }
}
