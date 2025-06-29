import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { AiServerGuideAgentApp } from '../../AiServerGuideAgentApp';
import { CommandUtility } from '../../utils/CommandUtility';

export class  ServerGuideCommand implements ISlashCommand {

    public command = 'server-guide-config';
    public i18nDescription = 'Edit/Create admin config through a modal';
    public providesPreview = false;
    public i18nParamsExample = '';
    public constructor(private readonly app: AiServerGuideAgentApp) {}

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persistence: IPersistence,
    ): Promise<void> {
        const sender = context.getSender();
        const room = context.getRoom();
        if (!sender.roles.includes('admin')) {
            return ;
        }
        const commandUtility = new CommandUtility({
            sender,
            room,
            command: context.getArguments(),
            context,
            read,
            modify,
            http,
            persistence,
            app: this.app,
        });

        await commandUtility.openAdminConfigModal();
    }
}
