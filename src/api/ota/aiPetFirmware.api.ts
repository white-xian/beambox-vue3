import {
  AiPetFirmwareIM,
  AiPetFirmwareLM,
  AiPetFirmwarePackageAddListPM,
  AiPetFirmwarePPM,
} from '@/model/ota';
import { defHttp } from '@/utils/http/axios';

const basicApi = '/ota/ai-pet';

enum Api {
  LIST = basicApi + '/query',
  ADD = basicApi + '/add',
  UPDATE = basicApi + '/update',
  RELEASE = basicApi + '/release/',
  DELETE = basicApi + '/delete/',
  PACKAGES_ADD = basicApi + '/packages/add',
  PACKAGES_DELETE = basicApi + '/packages/delete/',
  PACKAGES_DETAILS = basicApi + '/packages/',
}

/** Query AI pet OTA firmware list */
export const listAiPetFirmwareApi = (params?: AiPetFirmwarePPM) =>
  defHttp.get<AiPetFirmwareLM>({ url: Api.LIST, params });

/** Add AI pet OTA firmware */
export const addAiPetFirmwareApi = (params: AiPetFirmwareIM) =>
  defHttp.post({ url: Api.ADD, params });

/** Update AI pet OTA firmware */
export const updateAiPetFirmwareApi = (params: AiPetFirmwareIM) =>
  defHttp.post({ url: Api.UPDATE, params });

/** Release AI pet OTA firmware */
export const releaseAiPetFirmwareApi = (id: string) =>
  defHttp.post({ url: Api.RELEASE, params: id });

/** Delete draft AI pet OTA firmware */
export const deleteAiPetFirmwareApi = (id: string) =>
  defHttp.post({ url: Api.DELETE, params: id });

/** Batch add attached packages to AI pet OTA firmware */
export const addAiPetFirmwarePackagesApi = (params: AiPetFirmwarePackageAddListPM) =>
  defHttp.post({ url: Api.PACKAGES_ADD, params });

/** Delete attached package */
export const deleteAiPetFirmwarePackageApi = (id: string) =>
  defHttp.post({ url: Api.PACKAGES_DELETE, params: id });

/** Get firmware detail with packages by version ID */
export const getAiPetFirmwareDetailApi = (versionId: string) =>
  defHttp.get<AiPetFirmwareIM>({ url: Api.PACKAGES_DETAILS + versionId });
