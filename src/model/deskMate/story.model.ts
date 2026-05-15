import { BaseEntity, BasicPageParams } from '@/model';

/** 角色故事模型 */
export interface StoryIM extends BaseEntity {
  /** ID 编号 */
  id?: string;
  /** 角色ID */
  tablesideId: string;
  /** 故事标题 */
  storyTitle: string;
  /** 故事内容 */
  storyContent: string;
  /** 解锁等级 */
  unlockLevel: string;
  /** 故事缩略图 */
  storyThumbnailUrl: string;
  /** 故事图 */
  storyIllustrationUrl: string;
  /**未解锁故事图 */
  loclStoryThumbnailUrl?: string;
}

/** 角色故事查询参数 */
export interface StoryPM {
  /** 角色ID */
  tablesideId?: string;
  /** 故事标题 */
  storyTitle?: string;
}

/** 角色故事分页查询参数 */
export type StoryPPM = BasicPageParams & StoryPM;

/** 角色故事列表模型 */
export type StoryLM = StoryIM[];
