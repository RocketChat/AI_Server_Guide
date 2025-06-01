import {
    IPersistence,
    IPersistenceRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import {IConversationHistory} from '../../definitions/IConversationHistory';

export class ConversationHistoryPersistence {
    private readonly historyPrefix = 'server-guide-ai-agent-history';

    constructor(
        private readonly persistence: IPersistence,
        private readonly persistenceRead: IPersistenceRead,
    ) { }

    public async getHistory(category: string, userId: string): Promise<Array<string>> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            this.getStorageKey(category, userId),
        );
        const result = (await this.persistenceRead.readByAssociation(association)) as Array<IConversationHistory>;

        return result.length ? result[0].messages : [];
    }

    public async updateHistory(category: string, userId: string, newMessage: string): Promise<void> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            this.getStorageKey(category, userId),
        );

        const history = await this.getHistory(category, userId);
        history.push(newMessage);

        if (history.length > 20) {
            history.shift();
        }

        await this.persistence.updateByAssociation(association, { messages: history }, true);
    }

    private getStorageKey(category: string, userId: string): string {
        return `${this.historyPrefix}-${category}-${userId}`;
    }
}
