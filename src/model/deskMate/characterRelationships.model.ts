import { BaseEntity, BasicPageParams } from '@/model';

/** 人物关系模型 */
export interface CharacterRelationshipsIM extends BaseEntity {
  /** ID 编号 */
  id?: string;
  /** 桌搭子ID */
  tablesideId: string;
  /** 关联桌搭子ID */
  relatedId: string;
  /** 说明 */
  illustrate: string;
}

/** 人物关系列表项模型（含关联角色信息） */
export interface CharacterRelationshipsLM extends CharacterRelationshipsIM {
  /** 本身的角色名称 */
  name: string;
  /** 本身的角色图片 */
  avatarUrl: string;
  /** 关联角色的名称 */
  relatedName: string;
  /** 关联角色的图片 */
  relatedAvatarUrl: string;
}

/** 人物关系查询参数 */
export interface CharacterRelationshipsPM {
  /** 桌搭子ID */
  tablesideId?: string;
}

/** 人物关系分页查询参数 */
export type CharacterRelationshipsPPM = BasicPageParams & CharacterRelationshipsPM;
