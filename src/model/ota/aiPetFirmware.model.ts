import { BaseEntity, BasicPageParams } from '@/model';

export enum AiPetFirmwareStatusEnum {
  DRAFT = 0,
  RELEASED = 1,
}

/** AI pet firmware package model */
export interface AiPetFirmwarePackageIM extends BaseEntity {
  /** Package id */
  id?: string;
  /** OTA version id */
  versionId?: string;
  /** Module code, for example MAIN/MCU/UI/RESOURCE */
  moduleCode: string;
  /** Module name */
  moduleName: string;
  /** File name */
  fileName: string;
  /** File download url */
  fileUrl: string;
  /** File size in bytes */
  fileSize: string;
}

/** AI pet firmware version model */
export interface AiPetFirmwareIM extends BaseEntity {
  /** Version id */
  id?: string;
  /** Main version code, used for compare */
  versionCode: number;
  /** Main version name, for example v1.0.0 */
  versionName: string;
  /** Upgrade description */
  description: string;
  /** 0 draft, 1 released */
  status?: AiPetFirmwareStatusEnum;
  /** Attached packages */
  packages: AiPetFirmwarePackageIM[];
}

/** AI pet firmware query params */
export interface AiPetFirmwarePM {
  id?: string;
  versionCode?: number;
  versionName?: string;
  status?: AiPetFirmwareStatusEnum;
}

export type AiPetFirmwarePPM = BasicPageParams & AiPetFirmwarePM;

export type AiPetFirmwareLM = AiPetFirmwareIM[];

export type AiPetFirmwarePackageAddPM = Required<
  Pick<
    AiPetFirmwarePackageIM,
    'versionId' | 'moduleCode' | 'moduleName' | 'fileName' | 'fileUrl' | 'fileSize'
  >
>;

export type AiPetFirmwarePackageAddListPM = AiPetFirmwarePackageAddPM[];
