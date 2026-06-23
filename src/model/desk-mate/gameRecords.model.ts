import { BaseEntity, BasicPageParams } from '@/model';

/** 游戏记录模型 */
export interface GameRecordsIM extends BaseEntity {
  /** ID 编号 */
  id?: string;
  /** 桌搭子角色ID */
  tablesideId: string;
  /** 游戏名称 */
  gameName: string;
  /** 游戏图标URL */
  gameIconUrl: string;
  /** 游戏简略 */
  gameSummary: string;
  /** 游戏详情 */
  gameContent: string;
  /** 解锁等级 */
  unlockLevel: string;
  /** 徽章缩略图URL */
  badgeThumbnailUrl?: string;
  /** 未解锁徽章缩略图URL */
  lockBadgeThumbnailUrl?: string;
  /** 徽章设计图URL */
  badgeDesignUrl?: string;
  /** 游戏唤醒词 */
  gameWakeWord?: string;
}

/** 游戏记录列表项模型（含关联角色信息） */
export interface GameRecordsLM extends GameRecordsIM {
  /** 桌搭子名称 */
  name: string;
  /** 桌搭子图片 */
  avatarUrl: string;
}

/** 游戏记录查询参数 */
export interface GameRecordsPM {
  /** 桌搭子角色ID */
  tablesideId?: string;
  /** 游戏名称 */
  gameName?: string;
}

/** 游戏记录分页查询参数 */
export type GameRecordsPPM = BasicPageParams & GameRecordsPM;
