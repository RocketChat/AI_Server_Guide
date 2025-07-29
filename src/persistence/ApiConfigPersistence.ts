import {
    IPersistence,
    IPersistenceRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import { IApiConfig } from '../../definitions/IApiConfig';

export class ApiConfigPersistence {
    private readonly apiConfigKey = 'server-guide-ai-agent-api-config';

    constructor(
        private readonly persistence: IPersistence,
        private readonly persistenceRead: IPersistenceRead,
    ) { }

    public async getApiConfig(userId: string): Promise<IApiConfig | null> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            this.apiConfigKey + `-${userId}`,
        );
        const result = (await this.persistenceRead.readByAssociation(
            association,
        )) as Array<IApiConfig>;
        return result.length ? result[0] : null;
    }

    public async storeApiConfig(config: IApiConfig, userId: string): Promise<void> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            this.apiConfigKey + `-${userId}`,
        );
        await this.persistence.updateByAssociation(association, config, true);
    }
}
