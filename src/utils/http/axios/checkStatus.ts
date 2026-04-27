import type { ErrorMessageMode } from '#/axios';
import { useMessage } from '@/hooks/web/useMessage';
import { useUserStoreWithOut } from '@/store/modules/user';
import projectSetting from '@/settings/projectSetting';
import { SessionTimeoutProcessingEnum } from '@/enums';

const { createMessage, createErrorModal } = useMessage();
const stp = projectSetting.sessionTimeoutProcessing;

export function checkStatus(
  status: number | undefined,
  msg: string,
  errorMessageMode: ErrorMessageMode = 'message',
): void {
  const userStore = useUserStoreWithOut();
  let errMessage = '';

  switch (status) {
    case 400:
      errMessage = msg || '请求参数错误！';
      break;
    case 401:
      userStore.setToken(undefined);
      errMessage = msg || '用户未登录或登录已失效，请重新登录！';
      if (stp === SessionTimeoutProcessingEnum.PAGE_COVERAGE) {
        userStore.setSessionTimeout(true);
      } else {
        userStore.logout(false);
      }
      break;
    case 403:
      errMessage = msg || '没有权限访问当前资源！';
      break;
    case 404:
      errMessage = msg || '请求资源不存在！';
      break;
    case 405:
      errMessage = msg || '请求方法不允许！';
      break;
    case 408:
      errMessage = msg || '请求超时，请稍后重试！';
      break;
    case 500:
      errMessage = msg || '服务器内部错误，请联系管理员！';
      break;
    case 501:
      errMessage = msg || '服务暂未实现！';
      break;
    case 502:
      errMessage = msg || '网关错误，请稍后重试！';
      break;
    case 503:
      errMessage = msg || '服务不可用，服务器暂时过载或维护中！';
      break;
    case 504:
      errMessage = msg || '网关超时，请稍后重试！';
      break;
    case 505:
      errMessage = msg || 'HTTP 版本不支持当前请求！';
      break;
    default:
      errMessage = msg || '请求失败，请稍后重试！';
  }

  if (!errMessage || errorMessageMode === 'none') {
    return;
  }

  if (errorMessageMode === 'modal') {
    createErrorModal({ title: '错误提示', content: errMessage });
  } else if (errorMessageMode === 'message') {
    createMessage.error({ content: errMessage, key: `global_error_message_status_${status ?? 'unknown'}` });
  }
}
