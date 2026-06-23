import {
  CharacterRelationshipsIM,
  CharacterRelationshipsLM,
  CharacterRelationshipsPPM,
} from '@/model/desk-mate';
import { defHttp } from '@/utils/http/axios';

/** 人物关系接口基础路径 */
const basicApi = '/tableside/character-relationships';

/** 人物关系后端接口地址 */
enum Api {
  /** 查询人物关系列表 */
  LIST = basicApi + '/query',
  /** 新增人物关系 */
  ADD = basicApi,
  /** 修改人物关系 */
  UPDATE = basicApi,
  /** 删除人物关系 */
  DELETE = basicApi + '/',
}

/** 查询人物关系列表 */
export const listCharacterRelationshipsApi = (params?: CharacterRelationshipsPPM) =>
  defHttp.post<CharacterRelationshipsLM[]>({ url: Api.LIST, params });

/** 新增人物关系 */
export const addCharacterRelationshipsApi = (params: CharacterRelationshipsIM) =>
  defHttp.post({ url: Api.ADD, params });

/** 修改人物关系 */
export const updateCharacterRelationshipsApi = (params: CharacterRelationshipsIM) =>
  defHttp.put({ url: Api.UPDATE, params });

/** 删除人物关系 */
export const deleteCharacterRelationshipsApi = (id: string) =>
  defHttp.delete({ url: Api.DELETE + id });
