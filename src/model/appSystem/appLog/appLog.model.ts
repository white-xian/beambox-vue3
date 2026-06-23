import { BaseEntity, BasicPageParams } from '@/model';

/** APP日志模型 */
export interface AppLogIM extends BaseEntity {
  /** ID 编号 */
  id?: string;
  /** 日志内容 */
  log: string;
}

/** APP日志查询参数 */
export interface AppLogPM {
  /** 日志内容 */
  log?: string;
  /** 开始时间 */
  startTime?: string;
  /** 结束时间 */
  endTime?: string;
}

/** APP日志分页查询参数 */
export type AppLogPPM = BasicPageParams & AppLogPM;

/** APP日志列表模型 */
export type AppLogLM = AppLogIM[];
