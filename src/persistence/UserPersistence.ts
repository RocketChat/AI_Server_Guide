import {
    IPersistence,
    IPersistenceRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import { IUserConfig } from '../../definitions/IUserConfig';

export class UserPersistence {
    private readonly userConfigKey = 'server-guide-ai-agent-user-config';

    constructor(
        private readonly persistence: IPersistence,
        private readonly persistenceRead: IPersistenceRead,
    ) { }

    public async getUserConfig(): Promise<IUserConfig | null> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            this.userConfigKey,
        );
        const result = (await this.persistenceRead.readByAssociation(
            association,
        )) as Array<IUserConfig>;
        return result.length ? result[0] : null;
    }

    public async storeUserConfig(config: IUserConfig): Promise<void> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            this.userConfigKey,
        );
        await this.persistence.updateByAssociation(association, config, true);
    }
}
