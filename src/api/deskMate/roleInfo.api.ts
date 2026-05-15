import { RoleInfoIM, RoleInfoLM, RoleInfoOptionIM, RoleInfoPPM } from '@/model/deskMate';
import { defHttp } from '@/utils/http/axios';

/** 桌搭子角色基础信息接口基础路径 */
const basicApi = '/tableside/role-info';

/** 桌搭子角色基础信息后端接口地址 */
enum Api {
  /** 查询角色基础信息列表 */
  LIST = basicApi + '/query',
  /** 新增角色基础信息 */
  ADD = basicApi,
  /** 修改角色基础信息 */
  UPDATE = basicApi,
  /** 删除角色基础信息 */
  DELETE = basicApi + '/',
  /** 角色下拉列表 */
  OPTIONS = basicApi + '/options',
}

/** 查询桌搭子角色基础信息列表 */
export const listRoleInfoApi = (params?: RoleInfoPPM) =>
  defHttp.post<RoleInfoLM>({ url: Api.LIST, params });

/** 新增桌搭子角色基础信息 */
export const addRoleInfoApi = (params: RoleInfoIM) =>
  defHttp.post({ url: Api.ADD, params });

/** 修改桌搭子角色基础信息 */
export const updateRoleInfoApi = (params: RoleInfoIM) =>
  defHttp.put({ url: Api.UPDATE, params });

/** 删除桌搭子角色基础信息 */
export const deleteRoleInfoApi = (id: string) =>
  defHttp.delete({ url: Api.DELETE + id });

/** 获取角色下拉列表 */
export const getRoleInfoOptionsApi = () =>
  defHttp.get<RoleInfoOptionIM[]>({ url: Api.OPTIONS });
