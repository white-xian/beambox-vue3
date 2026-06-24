import { StoryIM, StoryLM, StoryPPM } from '@/model/desk-mate';
import { defHttp } from '@/utils/http/axios';

/** 角色故事接口基础路径 */
const basicApi = '/tableside/story';

/** 角色故事后端接口地址 */
enum Api {
  /** 查询角色故事列表 */
  LIST = basicApi + '/query',
  /** 新增角色故事 */
  ADD = basicApi,
  /** 修改角色故事 */
  UPDATE = basicApi,
  /** 删除角色故事 */
  DELETE = basicApi + '/',
}

/** 查询角色故事列表 */
export const listStoryApi = (params?: StoryPPM) =>
  defHttp.post<StoryLM>({ url: Api.LIST, params });

/** 新增角色故事 */
export const addStoryApi = (params: StoryIM) =>
  defHttp.post({ url: Api.ADD, params });

/** 修改角色故事 */
export const updateStoryApi = (params: StoryIM) =>
  defHttp.put({ url: Api.UPDATE, params });

/** 删除角色故事 */
export const deleteStoryApi = (id: string) =>
  defHttp.delete({ url: Api.DELETE + id });
