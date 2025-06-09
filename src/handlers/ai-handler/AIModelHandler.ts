import { IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { SettingEnum } from '../../../config/settings';
import { IAIModel } from '../../../definitions/IAIModel';
import { GeminiModel } from './models/GeminiModel';

export async function  getModel(read: IRead): Promise<IAIModel> {
     const aiProvider = await read
            .getEnvironmentReader()
            .getSettings()
            .getValueById(SettingEnum.AI_PROVIDER_OPTION_ID);

     switch (aiProvider) {
       case SettingEnum.GEMINI:
          return new GeminiModel();
       default:
          throw new Error(`Unsupported AI provider: ${aiProvider}`);
     }
}

