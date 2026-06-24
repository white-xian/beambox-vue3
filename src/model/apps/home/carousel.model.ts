import { BasicPageParams, BasicFetchResult, BaseEntity } from '@/model'

/** 轮播图信息模型 */
export interface CarouselIM extends BaseEntity {
  /** 轮播图ID */
  carouselId?: string
  /** 轮播图标题 */
  title: string
  /** 图片url */
  imageUrl: string
  /** 跳转链接 */
  linkUrl: string
  /** 是否跳转 0 不跳转，1 app内跳，2 跳到外部浏览器 */
  isRedirect: number
  /** 排序顺序 */
  sortOrder: number
  /** 状态 1：启用 0：禁用 */
  status: number
}

/** 轮播图查询参数 */
export interface CarouselPM {
  /** 轮播图标题 */
  title?: string
  /** 状态 */
  status?: string
}

/** 轮播图分页查询参数 */
export type CarouselPPM = BasicPageParams & CarouselPM

/** 轮播图列表结果模型 */
export type CarouselLRM = BasicFetchResult<CarouselIM>
