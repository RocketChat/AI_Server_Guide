import {
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom, RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { Block, LayoutBlock } from '@rocket.chat/ui-kit';
import { MessageEnum } from '../enums/messageEnum';

export async function getDirectRoom(
    read: IRead,
    modify: IModify,
    appUser: IUser,
    username: string,
): Promise<IRoom | undefined> {
    const usernames = [appUser.username, username];
    let room: IRoom;
    try {
        room = await read.getRoomReader().getDirectByUsernames(usernames);
    } catch (err) {
        console.error(err);
        return;
    }

    if (room) {
        return room;
    } else {
        let roomId: string;
        const newRoom = modify
            .getCreator()
            .startRoom()
            .setType(RoomType.DIRECT_MESSAGE)
            .setCreator(appUser)
            .setMembersToBeAddedByUsernames(usernames);
        roomId = await modify.getCreator().finish(newRoom);

        return await read.getRoomReader().getById(roomId);
    }
}

export async function sendMessage(
    modify: IModify,
    room: IRoom,
    sender: IUser,
    message: string,
    blocks?: Array<LayoutBlock>,
): Promise<string> {
    const msg = modify
        .getCreator()
        .startMessage()
        .setSender(sender)
        .setRoom(room)
        .setParseUrls(true)
        .setText(message);

    if (blocks !== undefined) {
        msg.setBlocks(blocks);
    }

    return await modify.getCreator().finish(msg);
}

export async function sendDirectMessageOnInstall(
    read: IRead,
    modify: IModify,
    user: IUser,
    persistence: IPersistence,
    blocks?: Array<Block>,
): Promise<string> {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;

    const directRoom = (await getDirectRoom(
        read,
        modify,
        appUser,
        user.username,
    )) as IRoom;

    const text = `${MessageEnum.APP_INSTALLED_TEXT}\n
        Hey **${user.username}** ! ${MessageEnum.INSTRUCTION_TEXT.toString()} ${MessageEnum.WELCOMING_MESSAGE.toString()}
    `;

    return await sendMessage(modify, directRoom, appUser, text);
}

export async function sendIntermediate(modify: IModify, room: IRoom, text: string): Promise<string> {
    const msg = modify.getCreator().startMessage().setRoom(room).setText(text);
    return await modify.getCreator().finish(msg);
}

export async function sendBulkMessage(aihelp: boolean,
    channels: Array<string>,
    users: Array<string>,
    messageToSend: string,
    read: IRead,
    modify: IModify,
): Promise<void> {
    if (aihelp) {
        return;
    }
    const botUser = await read.getUserReader().getAppUser();
    if (!botUser) {
        return;
    }
    if (channels !== undefined) {
        for (const channel of channels) {
            const room = await read.getRoomReader().getByName(channel.startsWith('#') ? channel.slice(1) : channel);
            if (!room) {
                continue;
            }
            await sendMessage(modify, room, botUser, messageToSend);
        }
    }
    if (users !== undefined) {
        for (let user of users) {
            user = user.startsWith('@') ? user.slice(1) : user;
            const room = await getDirectRoom(read, modify, botUser, user);
            if (!room) {
                continue;
            }
            await sendMessage(modify, room, botUser, messageToSend);
        }
    }
}
