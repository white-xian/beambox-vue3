import { GameRecordsIM, GameRecordsLM, GameRecordsPPM } from '@/model/deskMate';
import { defHttp } from '@/utils/http/axios';

/** 游戏记录接口基础路径 */
const basicApi = '/tableside/game-records';

/** 游戏记录后端接口地址 */
enum Api {
  /** 查询游戏记录列表 */
  LIST = basicApi + '/query',
  /** 新增游戏记录 */
  ADD = basicApi,
  /** 修改游戏记录 */
  UPDATE = basicApi,
  /** 删除游戏记录 */
  DELETE = basicApi + '/',
}

/** 查询游戏记录列表 */
export const listGameRecordsApi = (params?: GameRecordsPPM) =>
  defHttp.post<GameRecordsLM[]>({ url: Api.LIST, params });

/** 新增游戏记录 */
export const addGameRecordsApi = (params: GameRecordsIM) =>
  defHttp.post({ url: Api.ADD, params });

/** 修改游戏记录 */
export const updateGameRecordsApi = (params: GameRecordsIM) =>
  defHttp.put({ url: Api.UPDATE, params });

/** 删除游戏记录 */
export const deleteGameRecordsApi = (id: string) =>
  defHttp.delete({ url: Api.DELETE + id });
