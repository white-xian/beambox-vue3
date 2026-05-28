import { DescItem } from '@/components/Description';
import { FormSchema } from '@/components/Form';
import { BasicColumn } from '@/components/Table';
import { h } from 'vue';
import { Image } from 'ant-design-vue';
import { Tinymce } from '@/components/Tinymce';

/** 角色故事列表列配置 */
export const columns: BasicColumn[] = [
  {
    title: '故事角色',
    dataIndex: 'name',
    width: 120,
  },
  {
    title: '故事标题',
    dataIndex: 'storyTitle',
    width: 180,
  },
  {
    title: '故事缩略图',
    dataIndex: 'storyThumbnailUrl',
    width: 100,
    customRender: ({ record }) =>
      record.storyThumbnailUrl
        ? h(Image, { src: record.storyThumbnailUrl, style: { width: '60px', height: '40px', borderRadius: '4px', objectFit: 'cover' } })
        : '',
  },
  {
    title: '解锁等级',
    dataIndex: 'unlockLevel',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
  },
  {
    title: '更新时间',
    dataIndex: 'updateTime',
    width: 180,
  },
];

/** 角色故事列表搜索表单配置 */
export const searchFormSchema: FormSchema[] = [
  {
    label: '故事角色',
    field: 'tablesideId',
    component: 'ApiSelect',
    componentProps: {
      api: () => import('@/api/deskMate/roleInfo.api').then((m) => m.getRoleInfoOptionsApi()),
      labelField: 'name',
      valueField: 'id',
      placeholder: '请选择故事角色',
    },
    colProps: { span: 6 },
  },
  {
    label: '故事标题',
    field: 'storyTitle',
    component: 'Input',
    colProps: { span: 6 },
  },
];

/** 角色故事表单配置 */
export const formSchema: FormSchema[] = [
  {
    field: 'tablesideId',
    label: '故事角色',
    component: 'ApiSelect',
    componentProps: {
      api: () => import('@/api/deskMate/roleInfo.api').then((m) => m.getRoleInfoOptionsApi()),
      resultField: 'data',
      labelField: 'name',
      valueField: 'id',
      placeholder: '请选择故事角色',
    },
    required: true,
    rules: [{ required: true, message: '请选择故事角色', trigger: 'change' }],
    colProps: { xs: 24, md: 12 },
  },
   {
    field: 'unlockLevel',
    label: '解锁等级',
    component: 'Input',
    required: true,
    rules: [{ required: true, message: '请输入解锁等级', trigger: 'blur' }],
    colProps: { xs: 24, md: 12 },
  },
  {
    field: 'storyTitle',
    label: '故事标题',
    component: 'Input',
    required: true,
    rules: [{ required: true, message: '请输入故事标题', trigger: 'blur' }],
    colProps: { span:24 },
  },
  {
    field: 'storyThumbnailUrl',
    label: '故事小图',
    component: 'Input',
    slot: 'uploadSlot',
    maxSizeUnit: 'KB',
    maxSize: 50,
    required: true,
    rules: [{ required: true, message: '请上传故事缩略图', trigger: 'change' }],
    colProps: { xs: 24, md: 12 },
  },
  {
    field: 'storyIllustrationUrl',
    label: '故事大图',
    component: 'Input',
    slot: 'uploadSlot',
    maxSizeUnit: 'KB',
    maxSize: 400,
    required: true,
    rules: [{ required: true, message: '请上传故事配图', trigger: 'change' }],
    colProps: { xs: 24, md: 12 },
  },
  {
    field: 'lockStoryThumbnailUrl',
    label: '未解锁故事图',
    component: 'Input',
    slot: 'uploadSlot',
    maxSizeUnit: 'KB',
    maxSize: 400,
    required: true,
    rules: [{ required: true, message: '请上传未解锁故事图', trigger: 'change' }],
    colProps: { xs: 24, md: 12 },
  },
  {
    field: 'storyContent',
    label: '故事内容',
    component: 'InputTextArea',
    render: ({ model, field }) => {
      return h(Tinymce, {
        value: model[field],
        height: 400,
        showImageUpload: false,
        onChange: (value: string) => {
          model[field] = value;
        },
      });
    },
    required: true,
    rules: [{ required: true, message: '请输入故事内容', trigger: 'blur' }],
    colProps: { span: 24 },
  },
];

/** 角色故事详情描述项配置 */
export const detailSchema: DescItem[] = [
  {
    label: '故事角色名称',
    field: 'name',
    span: 8,
  },
  {
    label: '故事标题',
    field: 'storyTitle',
    span: 8,
    render: (val) => (val ? h('div', { innerHTML: val }) : ''),
  },
  {
    label: '解锁等级',
    field: 'unlockLevel',
    span: 8,
  },
  {
    label: '故事缩略图',
    field: 'storyThumbnailUrl',
    render: (val) => (val ? h(Image, { src: val, style: { width: '60px', height: '40px', borderRadius: '4px', objectFit: 'cover' } }) : ''),
    span: 8,
  },
  {
    label: '故事配图',
    field: 'storyIllustrationUrl',
    render: (val) => (val ? h(Image, { src: val, style: { width: '200px', height: '120px', borderRadius: '4px', objectFit: 'cover' } }) : ''),
    span: 8,
  },
  {
    label: '未解锁故事图',
    field: 'lockStoryThumbnailUrl',
    render: (val) => (val ? h(Image, { src: val, style: { width: '200px', height: '120px', borderRadius: '4px', objectFit: 'cover' } }) : ''),
    span: 8,
   },
  {
    label: '故事内容',
    field: 'storyContent',
    render: (val) => (val ? h('div', { innerHTML: val }) : ''),
    span: 24,
  },
  {
    label: '更新时间',
    field: 'updateTime',
    span: 24,
  },
  {
    label: '创建时间',
    field: 'createTime',
    span: 24,
  },
];
