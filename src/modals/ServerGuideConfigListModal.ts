import {IHttp, IModify, IPersistence, IRead} from '@rocket.chat/apps-engine/definition/accessors';
import {SlashCommandContext} from '@rocket.chat/apps-engine/definition/slashcommands';
import {UIKitInteractionContext} from '@rocket.chat/apps-engine/definition/uikit';
import {TextObjectType} from '@rocket.chat/apps-engine/definition/uikit/blocks';
import {IUIKitModalViewParam} from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import {Modals} from '../../enums/modalEnum';
import {AdminPersistence} from '../persistence/AdminPersistence';

export async function ServerGuideConfigListModal({
                                                modify,
                                                read,
                                                persistence,
                                                slashCommandContext,
                                                uiKitContext,
                                            }: {
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashCommandContext?: SlashCommandContext;
    uiKitContext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
    const adminStore = new AdminPersistence(persistence, read.getPersistenceReader());
    const adminConfig = await adminStore.getAdminConfig();
    const blocks = modify.getCreator().getBlockBuilder();

    blocks.addInputBlock({
        label: {
            text: '### Current Welcome Message',
            type: TextObjectType.MARKDOWN,
        },
        element: blocks.newPlainTextInputElement({
            actionId: 'welcome_message_config',
            multiline: true,
            placeholder: {
                text: 'No welcome message set yet',
                type: TextObjectType.PLAINTEXT,
            },
            initialValue: adminConfig?.welcomeMessage ?? undefined,
        }),
        blockId: 'welcomeMessage',
    });

    blocks.addInputBlock({
        label: {
            text: '### Current Server Rules ',
            type: TextObjectType.MARKDOWN,
        },
        element: blocks.newPlainTextInputElement({
            actionId: 'server_rules_config',
            multiline: true,
            placeholder: {
                text: 'Server Rules is not set yet',
                type: TextObjectType.PLAINTEXT,
            },
            initialValue: adminConfig?.serverRules ?? undefined,
        }),
        blockId: 'serverRules',
    });

    blocks.addInputBlock({
        label: {
            text: '### Current Channel Recommendation ',
            type: TextObjectType.MARKDOWN,
        },
        element: blocks.newPlainTextInputElement({
            actionId: 'channel_recommendation_config',
            multiline: true,
            placeholder: {
                text: 'channel recommendations are not set yet',
                type: TextObjectType.PLAINTEXT,
            },
            initialValue: adminConfig?.recommendedChannels ?? undefined,
        }),
        blockId: 'recommendedChannels',
    });

    blocks.addInputBlock({
        label: {
            text: '### Default Channels for new users ',
            type: TextObjectType.MARKDOWN,
        },
        element: blocks.newPlainTextInputElement({
            actionId: 'new_user_channel_config',
            placeholder: {
                text: 'new user channels are not set yet',
                type: TextObjectType.PLAINTEXT,
            },
            initialValue: adminConfig?.newComerChannel?.join(', ') ?? undefined,
        }),
        blockId: 'newComerChannel',
    });

    return {
        id: Modals.AdminConfigModal,
        title: blocks.newPlainTextObject('Admin Configurations'),
        submit: blocks.newButtonElement({
            text: blocks.newPlainTextObject('Save Changes'),
        }),
        blocks: blocks.getBlocks(),
    };
}
