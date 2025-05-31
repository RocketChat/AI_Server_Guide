import {
    IAppAccessors,
    ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { IAppInstallationContext } from '@rocket.chat/apps-engine/definition/accessors';
import { IRead, IHttp, IPersistence, IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { sendDirectMessageOnInstall } from './utils/message';
import { IConfigurationExtend } from '@rocket.chat/apps-engine/definition/accessors';
import { IEnvironmentRead } from '@rocket.chat/apps-engine/definition/accessors';
import { Settings } from './config/settings';
export class AiServerGuideAgentApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }
    public async onInstall(
        context: IAppInstallationContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
        const { user } = context;
        await sendDirectMessageOnInstall(read, modify, user, persistence);
        return;
    }
    public async extendConfiguration(
        configuration: IConfigurationExtend,
        environmentRead: IEnvironmentRead
    ): Promise<void> {
        await Promise.all(
            Settings.map((setting) =>
                configuration.settings.provideSetting(setting)
            )
        );
    }
}
