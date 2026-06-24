import { AppLogPPM, AppLogLM } from '@/model/app-system/app-log'
import { defHttp } from '@/utils/http/axios'
import dayjs from 'dayjs'

/** APP日志接口基础路径 */
const basicApi = '/log'

/** APP日志后端接口地址 */
enum Api {
  /** 查询APP日志列表 */
  LIST = basicApi,
}

/** 查询APP日志列表 */
export const listAppLogApi = (params?: AppLogPPM & { timeRange?: [string, string] }) => {
  const { timeRange, ...cleanParams } = (params || {}) as Recordable
  if (Array.isArray(timeRange) && timeRange.length === 2) {
    cleanParams.startTime = timeRange[0] ? dayjs(timeRange[0]).startOf('day').format('YYYY-MM-DD HH:mm:ss') : undefined
    cleanParams.endTime = timeRange[1] ? dayjs(timeRange[1]).endOf('day').format('YYYY-MM-DD HH:mm:ss') : undefined
  }
  return defHttp.get<AppLogLM>({ url: Api.LIST, params: cleanParams })
}
