import {
    IAppAccessors,
    ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IAppInstallationContext } from '@rocket.chat/apps-engine/definition/accessors';
import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IConfigurationExtend } from '@rocket.chat/apps-engine/definition/accessors';
import { IEnvironmentRead } from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import {IPostMessageSentToBot} from '@rocket.chat/apps-engine/definition/messages/IPostMessageSentToBot';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import {UIKitViewSubmitInteractionContext} from '@rocket.chat/apps-engine/definition/uikit';
import {IPostUserCreated} from '@rocket.chat/apps-engine/definition/users';
import {IUserContext} from '@rocket.chat/apps-engine/definition/users';
import { Settings } from './config/settings';
import {IAdminConfig} from './definitions/IAdminConfig';
import {ServerGuideCommand} from './src/commands/ServerGuideCommand';
import {AdminPersistence} from './src/persistence/AdminPersistence';
import { sendDirectMessageOnInstall } from './utils/message';
import {getDirectRoom, sendMessage} from './utils/message';
import { processAdminMessage } from './utils/processMessage';

export class AiServerGuideAgentApp extends App implements IPostMessageSentToBot, IPostUserCreated {

   constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }
    public async onInstall(
        context: IAppInstallationContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify,
    ): Promise<void> {
        const { user } = context;
        await sendDirectMessageOnInstall(read, modify, user, persistence);
        return;
    }
    public async extendConfiguration(
        configuration: IConfigurationExtend,
        environmentRead: IEnvironmentRead,
    ): Promise<void> {
        await Promise.all([
            Settings.map((setting) =>
                configuration.settings.provideSetting(setting),
            ),
            configuration.slashCommands.provideSlashCommand(
                new ServerGuideCommand(this),
            ),
            ],
        );
    }

    public async executePostMessageSentToBot(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify,
    ): Promise<void> {
        try {
            if (!message.text) {
                return;
            }
            let responseText;
            if (message.sender.roles.includes('admin')) {
                responseText = await processAdminMessage(
                    message,
                    read,
                    http,
                    modify,
                    persistence,
                );
            }
            const msgBuilder = modify.getCreator().startMessage();
            msgBuilder.setText(responseText);
            msgBuilder.setRoom(message.room);
            await modify.getCreator().finish(msgBuilder);
        } catch (error) {
            console.log(`Error processing DM: ${error}`);
        }
    }

    public async executePostUserCreated(
        context: IUserContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify,
    ): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const createdUser = await read.getUserReader().getById(context.user.id);

        if (!createdUser || !createdUser.username) {
            return;
        }

        const appUser = await read.getUserReader().getAppUser();
        if (!appUser || createdUser.roles.includes('admin')) {
            return;
        }

        const adminStorage = new AdminPersistence(
            persistence,
            read.getPersistenceReader(),
        );
        const adminConfig = await adminStorage.getAdminConfig();
        if (!adminConfig) {
            return;
        }
        const dmRoom = await getDirectRoom(
            read,
            modify,
            createdUser,
            appUser.username,
        );
        if (!dmRoom) {
            return;
        }
        if (adminConfig.welcomeMessage) {
            await sendMessage(modify, dmRoom, appUser, adminConfig.welcomeMessage);
        }
        if (adminConfig.newComerChannel) {
            for (const channel of adminConfig.newComerChannel) {
                const channelName = channel.startsWith('#') ? channel.slice(1) : channel;
                const room = await read.getRoomReader().getByName(channelName);
                if (!room) {
                    console.log(`Room not found: ${channelName}`);
                    continue;
                }
                const roomUpdater = await modify.getUpdater().room(room.id, createdUser);

                roomUpdater.addMemberToBeAddedByUsername(createdUser.username);

                await modify.getUpdater().finish(roomUpdater);
            }
        }
        if (adminConfig.serverRules) {
           await sendMessage(modify, dmRoom, appUser, adminConfig.serverRules);
        }
    }
    public async executeViewSubmitHandler(
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
    ): Promise<void> {
        const { view } = context.getInteractionData();

        const viewState = view.state as {
            welcomeMessage: { welcome_message_config: string };
            serverRules: { server_rules_config: string };
            recommendedChannels: { channel_recommendation_config: string };
            newComerChannel: { new_user_channel_config: string };
        };

        const welcomeMessageText = viewState.welcomeMessage?.welcome_message_config ?? '';
        const serverRulesText = viewState.serverRules?.server_rules_config ?? '';
        const recommendedChannelsText = viewState.recommendedChannels?.channel_recommendation_config ?? '';
        const newComerChannelText = viewState.newComerChannel?.new_user_channel_config ?? '';

        const newComerChannelList: Array<string> = newComerChannelText
            .split(',')
            .map((channel) => channel.trim())
            .filter((channel) => channel !== '');

        const adminStorage = new AdminPersistence(
            persistence,
            read.getPersistenceReader(),
        );
        const currentConfig = await adminStorage.getAdminConfig();

        const updatedConfig: IAdminConfig = {
            ...currentConfig,
            welcomeMessage: welcomeMessageText,
            serverRules: serverRulesText,
            recommendedChannels: recommendedChannelsText,
            newComerChannel: newComerChannelList,
            channelReport: currentConfig?.channelReport ?? '',
        };

        await adminStorage.storeAdminConfig(updatedConfig);
    }

}
