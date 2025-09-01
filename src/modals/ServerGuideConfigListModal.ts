import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { UIKitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { Modals, BlockIds, ActionIds, ModalText } from '../../enums/modalEnum';
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
            text: ModalText.Labels.ServerUrl,
            type: TextObjectType.MARKDOWN,
        },
        element: blocks.newPlainTextInputElement({
            actionId: ActionIds.ServerUrl,
            placeholder: {
                text: ModalText.Placeholders.ServerUrl,
                type: TextObjectType.PLAINTEXT,
            },
            initialValue: apiConfig?.serverUrl ?? '',
        }),
        blockId: BlockIds.ServerUrl,
    });

    blocks.addInputBlock({
        label: {
            text: ModalText.Labels.XAuthToken,
            type: TextObjectType.MARKDOWN,
        },
        element: blocks.newPlainTextInputElement({
            actionId: ActionIds.XAuthToken,
            placeholder: {
                text: ModalText.Placeholders.XAuthToken,
                type: TextObjectType.PLAINTEXT,
            },
            initialValue: apiConfig?.xAuthToken ?? '',
        }),
        blockId: BlockIds.XAuthToken,
    });

    blocks.addInputBlock({
        label: {
            text: ModalText.Labels.XUserId,
            type: TextObjectType.MARKDOWN,
        },
        element: blocks.newPlainTextInputElement({
            actionId: ActionIds.XUserId,
            placeholder: {
                text: ModalText.Placeholders.XUserId,
                type: TextObjectType.PLAINTEXT,
            },
            initialValue: apiConfig?.xUserId ?? '',
        }),
        blockId: BlockIds.XUserId,
    });

    if (user.roles.includes('admin')) {
        blocks.addInputBlock({
            label: {
                text: ModalText.Labels.WelcomeMessage,
                type: TextObjectType.MARKDOWN,
            },
            element: blocks.newPlainTextInputElement({
                actionId: ActionIds.WelcomeMessage,
                multiline: true,
                placeholder: {
                    text: ModalText.Placeholders.WelcomeMessage,
                    type: TextObjectType.PLAINTEXT,
                },
                initialValue: adminConfig?.welcomeMessage ?? undefined,
            }),
            blockId: BlockIds.WelcomeMessage,
        });

        blocks.addInputBlock({
            label: {
                text: ModalText.Labels.ServerRules,
                type: TextObjectType.MARKDOWN,
            },
            element: blocks.newPlainTextInputElement({
                actionId: ActionIds.ServerRules,
                multiline: true,
                placeholder: {
                    text: ModalText.Placeholders.ServerRules,
                    type: TextObjectType.PLAINTEXT,
                },
                initialValue: adminConfig?.serverRules ?? undefined,
            }),
            blockId: BlockIds.ServerRules,
        });

        blocks.addInputBlock({
            label: {
                text: ModalText.Labels.ChannelRecommendation,
                type: TextObjectType.MARKDOWN,
            },
            element: blocks.newPlainTextInputElement({
                actionId: ActionIds.ChannelRecommendation,
                multiline: true,
                placeholder: {
                    text: ModalText.Placeholders.ChannelRecommendation,
                    type: TextObjectType.PLAINTEXT,
                },
                initialValue: adminConfig?.recommendedChannels ?? undefined,
            }),
            blockId: BlockIds.RecommendedChannels,
        });

        blocks.addInputBlock({
            label: {
                text: ModalText.Labels.NewUserChannels,
                type: TextObjectType.MARKDOWN,
            },
            element: blocks.newPlainTextInputElement({
                actionId: ActionIds.NewUserChannels,
                placeholder: {
                    text: ModalText.Placeholders.NewUserChannels,
                    type: TextObjectType.PLAINTEXT,
                },
                initialValue: adminConfig?.newComerChannel?.join(', ') ?? undefined,
            }),
            blockId: BlockIds.NewComerChannel,
        });
    }

    return {
        id: Modals.AdminConfigModal,
        title: blocks.newPlainTextObject(ModalText.Title),
        submit: blocks.newButtonElement({
            text: blocks.newPlainTextObject(ModalText.SaveButton),
        }),
        blocks: blocks.getBlocks(),
    };
}
