import {
  AiPetFirmwareIM,
  AiPetFirmwareLM,
  AiPetFirmwarePackageAddListPM,
  AiPetFirmwarePPM,
} from '@/model/ota';
import { defHttp } from '@/utils/http/axios';

/** AI 宠物固件 OTA 接口基础路径 */
const basicApi = '/ota/ai-pet';

/** AI 宠物固件 OTA 后端接口地址 */
enum Api {
  /** 查询主版本列表 */
  LIST = basicApi + '/query',
  /** 新增主版本 */
  ADD = basicApi + '/add',
  /** 更新主版本 */
  UPDATE = basicApi + '/update',
  /** 发布主版本 */
  RELEASE = basicApi + '/release/',
  /** 删除主版本 */
  DELETE = basicApi + '/delete/',
  /** 批量新增附属包 */
  PACKAGES_ADD = basicApi + '/packages/add',
  /** 删除附属包 */
  PACKAGES_DELETE = basicApi + '/packages/delete/',
  /** 查询主版本附属包详情 */
  PACKAGES_DETAILS = basicApi + '/packages/',
  /** 发布版本是否推送 */
  RELEASE_PUSH = basicApi + '/forceUpgrade',
}

/** 查询 AI 宠物固件 OTA 列表 */
export const listAiPetFirmwareApi = (params?: AiPetFirmwarePPM) =>
  defHttp.get<AiPetFirmwareLM>({ url: Api.LIST, params });

/** 新增 AI 宠物固件 OTA 主版本 */
export const addAiPetFirmwareApi = (params: AiPetFirmwareIM) =>
  defHttp.post({ url: Api.ADD, params });

/** 更新 AI 宠物固件 OTA 主版本 */
export const updateAiPetFirmwareApi = (params: AiPetFirmwareIM) =>
  defHttp.post({ url: Api.UPDATE, params });

/** 发布 AI 宠物固件 OTA 主版本 */
export const releaseAiPetFirmwareApi = (id: string) =>
  defHttp.post({ url: Api.RELEASE, params: id });

/** 删除草稿状态的 AI 宠物固件 OTA 主版本 */
export const deleteAiPetFirmwareApi = (id: string) =>
  defHttp.post({ url: Api.DELETE, params: id });

/** 批量为 AI 宠物固件 OTA 主版本添加附属包 */
export const addAiPetFirmwarePackagesApi = (params: AiPetFirmwarePackageAddListPM) =>
  defHttp.post({ url: Api.PACKAGES_ADD, params });

/** 删除指定附属包 */
export const deleteAiPetFirmwarePackageApi = (id: string) =>
  defHttp.post({ url: Api.PACKAGES_DELETE, params: id });

/** 根据主版本 ID 查询固件详情及附属包列表 */
export const getAiPetFirmwareDetailApi = (versionId: string) =>
  defHttp.get<AiPetFirmwareIM>({ url: Api.PACKAGES_DETAILS + versionId });

/** 发布版本是否推送 */
export const setAiPetFirmwareReleasePushApi = (versionId: string, forceUpgrade: boolean) =>
  defHttp.post({ url: Api.RELEASE_PUSH, params: { versionId, forceUpgrade } });
