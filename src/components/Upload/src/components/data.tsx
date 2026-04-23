import type { ActionItem, BasicColumn } from '@/components/Table';
import { FileBasicColumn, FileItem, PreviewFileItem, UploadResultStatus } from '../types/typing';
import { isImgTypeByName } from '../helper';
import { Progress, Tag } from 'ant-design-vue';
import TableAction from '@/components/Table/src/components/TableAction.vue';
import ThumbUrl from './ThumbUrl.vue';
import { previewColumnsFnType } from '../props';

// 文件上传列表
export function createTableColumns(): FileBasicColumn[] {
  return [
    {
      dataIndex: 'thumbUrl',
      title: "略缩图",
      width: 100,
      customRender: ({ record }) => {
        const { thumbUrl } = (record as FileItem) || {};
        return thumbUrl && <ThumbUrl fileUrl={thumbUrl} />;
      },
    },
    {
      dataIndex: 'name',
      title: "文件名",
      align: 'left',
      customRender: ({ text, record }) => {
        const { percent, status: uploadStatus } = (record as FileItem) || {};
        let status: 'normal' | 'exception' | 'active' | 'success' = 'normal';
        if (uploadStatus === UploadResultStatus.ERROR) {
          status = 'exception';
        } else if (uploadStatus === UploadResultStatus.UPLOADING) {
          status = 'active';
        } else if (uploadStatus === UploadResultStatus.SUCCESS) {
          status = 'success';
        }
        return (
          <div>
            <p class="truncate mb-1 max-w-[280px]" title={text}>
              {text}
            </p>
            <Progress percent={percent} size="small" status={status} />
          </div>
        );
      },
    },
    {
      dataIndex: 'size',
      title: "文件大小",
      width: 100,
      customRender: ({ text = 0 }) => {
        return text && (text / 1024).toFixed(2) + 'KB';
      },
    },
    {
      dataIndex: 'status',
      title: "状态",
      width: 100,
      customRender: ({ text }) => {
        if (text === UploadResultStatus.SUCCESS) {
          return <Tag color="green">{() => "上传成功"}</Tag>;
        } else if (text === UploadResultStatus.ERROR) {
          return <Tag color="red">{() => "上传失败"}</Tag>;
        } else if (text === UploadResultStatus.UPLOADING) {
          return <Tag color="blue">{() => "上传中"}</Tag>;
        }

        return text || "待上传";
      },
    },
  ];
}

export function createActionColumn(handleRemove: Function): BasicColumn {
  return {
    width: 120,
    title: "操作",
    dataIndex: 'action',
    fixed: false,
    customRender: ({ record }) => {
      const actions: ActionItem[] = [
        {
          label: "删除",
          color: 'error',
          onClick: handleRemove.bind(null, {
            record,
            uidKey: 'uid',
            valueKey: 'url',
          }),
        },
      ];
      return <TableAction actions={actions} outside={true} />;
    },
  };
}

// 文件预览列表
export function createPreviewColumns(): BasicColumn[] {
  return [
    {
      dataIndex: 'url',
      title: "略缩图",
      width: 100,
      customRender: ({ record }) => {
        const { url } = (record as PreviewFileItem) || {};
        return isImgTypeByName(url) && <ThumbUrl fileUrl={url} />;
      },
    },
    {
      dataIndex: 'name',
      title: "文件名",
      align: 'left',
    },
  ];
}

export function createPreviewActionColumn({
  handleRemove,
  handleDownload,
}: {
  handleRemove: previewColumnsFnType['handleRemove'];
  handleDownload: Fn;
}): BasicColumn {
  return {
    width: 160,
    title: "操作",
    dataIndex: 'action',
    fixed: false,
    customRender: ({ record }) => {
      const actions: ActionItem[] = [
        {
          label: "删除",
          color: 'error',
          onClick: handleRemove.bind(null, {
            record,
            uidKey: 'uid',
            valueKey: 'url',
          }),
        },
        {
          label: "下载",
          onClick: handleDownload.bind(null, record),
        },
      ];

      return <TableAction actions={actions} outside={true} />;
    },
  };
}
