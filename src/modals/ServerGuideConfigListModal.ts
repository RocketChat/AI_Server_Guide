import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { UIKitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { Modals } from '../../enums/modalEnum';
import { AdminPersistence } from '../persistence/AdminPersistence';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { ApiConfigPersistence } from '../persistence/ApiConfigPersistence';
export async function ServerGuideConfigListModal({
    user,
    modify,
    read,
    persistence,
    slashCommandContext,
    uiKitContext,
}: {
    user: IUser;
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashCommandContext?: SlashCommandContext;
    uiKitContext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
    const adminStore = new AdminPersistence(persistence, read.getPersistenceReader());
    const apiConfigStore = new ApiConfigPersistence(persistence, read.getPersistenceReader());
    const apiConfig = await apiConfigStore.getApiConfig(user.id);
    const adminConfig = await adminStore.getAdminConfig();
    const blocks = modify.getCreator().getBlockBuilder();
    blocks.addInputBlock({
        label: {
            text: '### Enter Server URL',
            type: TextObjectType.MARKDOWN,
        },
        element: blocks.newPlainTextInputElement({
            actionId: 'server_url_config',
            placeholder: {
                text: 'Server URL is not set yet',
                type: TextObjectType.PLAINTEXT,
            },
            initialValue: apiConfig?.serverUrl ?? '',
        }),
        blockId: 'serverUrl',
    });

    blocks.addInputBlock({
        label: {
            text: '### Enter X-Auth Token',
            type: TextObjectType.MARKDOWN,
        },
        element: blocks.newPlainTextInputElement({
            actionId: 'x_auth_token_config',
            placeholder: {
                text: 'X-Auth Token is not set yet',
                type: TextObjectType.PLAINTEXT,
            },
            initialValue: apiConfig?.xAuthToken ?? '',
        }),
        blockId: 'xAuthToken',
    });

    blocks.addInputBlock({
        label: {
            text: '### Enter X-User ID',
            type: TextObjectType.MARKDOWN,
        },
        element: blocks.newPlainTextInputElement({
            actionId: 'x_user_id_config',
            placeholder: {
                text: 'X-User ID is not set yet',
                type: TextObjectType.PLAINTEXT,
            },
            initialValue: apiConfig?.xUserId ?? '',
        }),
        blockId: 'xUserId',
    });
    if (user.roles.includes('admin')) {
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
    }
    return {
        id: Modals.AdminConfigModal,
        title: blocks.newPlainTextObject('Configurations'),
        submit: blocks.newButtonElement({
            text: blocks.newPlainTextObject('Save Changes'),
        }),
        blocks: blocks.getBlocks(),
    };
}
