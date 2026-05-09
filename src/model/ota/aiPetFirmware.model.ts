import { BaseEntity, BasicPageParams } from '@/model';

/** AI 宠物固件 OTA 状态枚举 */
export enum AiPetFirmwareStatusEnum {
  /** 草稿，未正式发布 */
  DRAFT = 0,
  /** 已发布，可供设备侧获取 */
  RELEASED = 1,
  /** 已下架，曾经发布过但现在不可用 */
  OFFLINE = 2,
}

/** AI 宠物固件附属包模型 */
export interface AiPetFirmwarePackageIM extends BaseEntity {
  /** 附属包 ID */
  id?: string;
  /** 所属 OTA 主版本 ID */
  versionId?: string;
  /** 模块编码，例如 MAIN/MCU/UI/RESOURCE */
  moduleCode: string;
  /** 模块名称 */
  moduleName: string;
  /** 固件文件名称 */
  fileName: string;
  /** 固件文件下载地址 */
  fileUrl: string;
  /** 固件文件大小，单位由后端返回值决定 */
  fileSize: string;
}

/** AI 宠物固件 OTA 主版本模型 */
export interface AiPetFirmwareIM extends BaseEntity {
  /** 主版本 ID */
  id?: string;
  /** 主版本号，用于版本比较 */
  versionCode: number;
  /** 主版本名称，例如 v1.0.0 */
  versionName: string;
  /** 升级说明 */
  description: string;
  /** 发布状态：0 草稿，1 已发布 */
  status?: AiPetFirmwareStatusEnum;
  /** 当前主版本下的附属包列表 */
  packages: AiPetFirmwarePackageIM[];
}

/** AI 宠物固件 OTA 查询参数 */
export interface AiPetFirmwarePM {
  /** 主版本 ID */
  id?: string;
  /** 主版本号 */
  versionCode?: number;
  /** 主版本名称 */
  versionName?: string;
  /** 发布状态 */
  status?: AiPetFirmwareStatusEnum;
}

/** AI 宠物固件 OTA 分页查询参数 */
export type AiPetFirmwarePPM = BasicPageParams & AiPetFirmwarePM;

/** AI 宠物固件 OTA 列表模型 */
export type AiPetFirmwareLM = AiPetFirmwareIM[];

/** 新增附属包时必须提交的字段 */
export type AiPetFirmwarePackageAddPM = Required<
  Pick<
    AiPetFirmwarePackageIM,
    'versionId' | 'moduleCode' | 'moduleName' | 'fileName' | 'fileUrl' | 'fileSize'
  >
>;

/** 批量新增附属包参数 */
export type AiPetFirmwarePackageAddListPM = AiPetFirmwarePackageAddPM[];
