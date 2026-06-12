import { defHttp } from '@/utils/http/axios';
import { UploadIM } from '@/model/sys';
import { UploadFileParams } from '#/axios';
import { useGlobSetting } from '@/hooks/setting';
import { AxiosProgressEvent } from 'axios';

const { uploadUrl = '' } = useGlobSetting();

enum Api {
  // UPLOAD_FILE = '/file/admin/upload',
  UPLOAD_FILE = '/file/oss/upload',
}

/** 文件上传 */
export const fileUploadApi = (
  params: UploadFileParams,
  onUploadProgress: (progressEvent: AxiosProgressEvent) => void,
  timeout?: number,
) =>
  defHttp.uploadFile<UploadIM>(
    {
      url: uploadUrl + Api.UPLOAD_FILE,
      onUploadProgress,
      timeout: timeout ?? 0,
      signal: params.signal,
    },
    params,
  );


