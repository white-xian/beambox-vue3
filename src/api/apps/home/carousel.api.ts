import type { CarouselIM, CarouselLRM, CarouselPPM } from '@/model/apps/home'
import { defHttp } from '@/utils/http/axios'

/** APP轮播接口基础路径 */
const basicApi = '/api/v1/system/homepage/carousel'

/** APP轮播后端接口地址 */
enum Api {
  /** 查询APP轮播列表 */
  LIST = basicApi,
  /** 新增APP轮播 */
  ADD = basicApi + '/add',
  /** 修改APP轮播 */
  EDIT = basicApi,
  /** 删除APP轮播 */
  DEL = basicApi + '/',
}

/** 查询轮播图分页列表 */
export const listCarouselApi = (params?: CarouselPPM) =>
  defHttp.get<CarouselLRM>({ url: Api.LIST, params })

/** 新增轮播图 */
export const addCarouselApi = (params: CarouselIM) =>
  defHttp.post({ url: Api.ADD, params })

/** 修改轮播图 */
export const editCarouselApi = (params: CarouselIM) =>
  defHttp.post({ url: Api.EDIT, params })

/** 删除轮播图 */
export const delCarouselApi = (carouselId: string) =>
  defHttp.delete({ url: Api.DEL + carouselId })
