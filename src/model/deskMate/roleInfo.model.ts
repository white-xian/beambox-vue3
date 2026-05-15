import { BaseEntity, BasicPageParams } from '@/model';

/** 桌搭子角色基础信息模型 */
export interface RoleInfoIM extends BaseEntity {
  /** ID 编号 */
  id?: string;
  /** 职业 */
  profession: string;
  /** 设备识别码 */
  matchRole: string;
  /** 名称 */
  name: string;
  /** 特点，用、分割 */
  features: string;
  /** 头像Url */
  roleCardAvatarUrl: string;
  /** 背景Url */
  roleCardBackgroundUrl: string;
  /** 是否隐藏款：1 是；0 否 */
  isHidden: number;
  /** 隐藏款头像URL */
  hiddenUrl?: string;
  /** 角色背景（富文本） */
  characterBackground: string;
  /** 交互协议 */
  interactionProtocol: string;
  /** 交互协议简略描述 */
  interactionProtocolBrief?: string;
  /** 角色关系图URL */
  roleRelationshipUrl?: string;
  /** 设备在线角色URL */
  onlineModelUrl?: string;
  /** 设备离线角色URL */
  offlineModelUrl?: string;
  /** 设备在线背景URL */
  onlineBackgroundUrl?: string;
  /** 设备离线背景URL */
  offlineBackgroundUrl?: string;
}

/** 桌搭子角色基础信息查询参数 */
export interface RoleInfoPM {
  /** ID 编号 */
  id?: string;
  /** 名称 */
  name?: string;
}

/** 桌搭子角色基础信息分页查询参数 */
export type RoleInfoPPM = BasicPageParams & RoleInfoPM;

/** 桌搭子角色基础信息列表模型 */
export type RoleInfoLM = RoleInfoIM[];

/** 角色下拉选项 */
export interface RoleInfoOptionIM {
  /** ID 编号 */
  id: string;
  /** 名称 */
  name: string;
}
