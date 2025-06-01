import {
    IPersistence,
    IPersistenceRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import { IAdminConfig } from '../../definitions/IAdminConfig';

export class AdminPersistence {
    private readonly adminConfigKey = 'server-guide-ai-agent-admin-config';

    constructor(
        private readonly persistence: IPersistence,
        private readonly persistenceRead: IPersistenceRead,
    ) { }

    public async getAdminConfig(): Promise<IAdminConfig | null> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            this.adminConfigKey,
        );
        const result = (await this.persistenceRead.readByAssociation(
            association,
        )) as Array<IAdminConfig>;
        return result.length ? result[0] : null;
    }

    public async storeAdminConfig(config: IAdminConfig): Promise<void> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            this.adminConfigKey,
        );
        await this.persistence.updateByAssociation(association, config, true);
    }
}
