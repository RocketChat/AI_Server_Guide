
import { IRead, IHttp } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IApiConfig } from '../definitions/IApiConfig';

export class RocketChatApiService {
    private readonly serverUrl: string;
    private readonly xAuthToken: string;
    private readonly xUserId: string;

    constructor(apiConfig: IApiConfig) {
        this.serverUrl = apiConfig?.serverUrl || '';
        this.xAuthToken = apiConfig?.xAuthToken || '';
        this.xUserId = apiConfig?.xUserId || '';
    }

    public async executeCommand(http: IHttp, command: string, params: string | Record<string, any>, read: IRead, channel: "string", defaultRoom: IRoom): Promise<any> {


        const room = await read.getRoomReader().getByName(channel.startsWith('#') ? channel.slice(1) : channel);

        const roomId = room ? room.id : undefined;
        const defaultRoomId = defaultRoom ? defaultRoom.id : undefined;
        if (!this.xAuthToken || !this.xUserId) {
            throw new Error('Missing x-auth-token or x-user-id in app settings.');
        }

        const headers = {
            'X-Auth-Token': this.xAuthToken,
            'X-User-Id': this.xUserId,
        };

        const flatParams = typeof params === 'string'
            ? params
            : Object.values(params).join(' ');

        const url = `${this.serverUrl}/api/v1/commands.run`;
        const response = await http.post(url, {
            headers,
            data: {
                command,
                params: flatParams,
                roomId: roomId || defaultRoomId,
            },
        });
        if (response.statusCode !== 200 || !response.content) {
            throw new Error(`commands.run failed: ${response.statusCode} - ${response.content}`);
        }
        return JSON.parse(response.content);
    }

    public async fetchCommandsList(http: IHttp, read: IRead): Promise<any> {

        const serverUrl = await read
            .getEnvironmentReader()
            .getServerSettings()
            .getValueById('Site_Url');


        if (!this.xAuthToken || !this.xUserId) {
            throw new Error('Missing x-auth-token or x-user-id in app settings.');
        }

        const headers = {
            'X-Auth-Token': this.xAuthToken,
            'X-User-Id': this.xUserId,
        };

        const url = `${serverUrl}/api/v1/commands.list`;
        const response = await http.get(url, { headers });

        if (response.statusCode !== 200 || !response.content) {
            throw new Error(
                `commands.list failed: ${response.statusCode} - ${response.content}`
            );
        }
        return JSON.parse(response.content);
    }
}
