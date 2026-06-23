import { DescItem } from '@/components/Description';
import { FormSchema } from '@/components/Form';
import { BasicColumn } from '@/components/Table';
import { h } from 'vue';
import { Image } from 'ant-design-vue';
import { Tinymce } from '@/components/Tinymce';

/** 游戏记录列表列配�?*/
export const columns: BasicColumn[] = [
  {
    title: '角色名称',
    dataIndex: 'name',
    width: 140,
  },
  {
    title: '角色头像',
    dataIndex: 'roleCardAvatarUrl',
    width: 100,
    customRender: ({ record }) =>
      record.roleCardAvatarUrl ? h(Image, { src: record.roleCardAvatarUrl, style: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' } }) : '',
  },
  {
    title: '游戏名称',
    dataIndex: 'gameName',
    width: 160,
  },
  {
    title: '游戏图标',
    dataIndex: 'gameIconUrl',
    width: 100,
    customRender: ({ record }) =>
      record.gameIconUrl ? h(Image, { src: record.gameIconUrl, style: { width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' } }) : '',
  },
  {
    title: '游戏简�?,
    dataIndex: 'gameSummary',
    width: 200,
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

/** 游戏记录列表搜索表单配置 */
export const searchFormSchema: FormSchema[] = [
  {
    label: '游戏角色',
    field: 'tablesideId',
    component: 'ApiSelect',
    componentProps: {
      api: () => import('@/api/desk-mate/roleInfo.api').then((m) => m.getRoleInfoOptionsApi()),
      labelField: 'name',
      valueField: 'id',
      placeholder: '请选择游戏角色',
    },
    colProps: { span: 6 },
  },
  {
    label: '游戏名称',
    field: 'gameName',
    component: 'Input',
    colProps: { span: 6 },
  },
];

/** 游戏记录表单配置 */
export const formSchema: FormSchema[] = [
  {
    field: 'tablesideId',
    label: '角色',
    component: 'ApiSelect',
    componentProps: {
      api: () => import('@/api/desk-mate/roleInfo.api').then((m) => m.getRoleInfoOptionsApi()),
      resultField: 'data',
      labelField: 'name',
      valueField: 'id',
      placeholder: '请选择角色',
    },
    required: true,
    rules: [{ required: true, message: '请选择角色', trigger: 'change' }],
    colProps: { xs: 24, md: 12 },
  },
  {
    field: 'gameName',
    label: '游戏名称',
    component: 'Input',
    required: true,
    rules: [{ required: true, message: '请输入游戏名�?, trigger: 'blur' }],
    colProps: { xs: 24, md: 12 },
  },
  {
    field: 'gameWakeWord',
    label: '游戏唤醒�?,
    component: 'Input',
    required: true,
    rules: [{ required: true, message: '请输入游戏唤醒词', trigger: 'blur' }],
    colProps: { xs: 24, md: 12 },
  },
  {
    field: 'unlockLevel',
    label: '解锁等级',
    component: 'Input',
    required: true,
    rules: [{ required: true, message: '请输入解锁等�?, trigger: 'blur' }],
    colProps: { xs: 24, md: 12 },
  },
  {
    field: 'gameIconUrl',
    label: '游戏图标',
    component: 'Input',
    slot: 'uploadSlot',
    maxSizeUnit: 'KB',
    maxSize: 50,
    required: true,
    rules: [{ required: true, message: '请上传游戏图�?, trigger: 'change' }],
    colProps: { xs: 24, md: 12 },
  },
  {
    field: 'badgeThumbnailUrl',
    label: '徽章',
    component: 'Input',
    slot: 'uploadSlot',
    maxSizeUnit: 'KB',
    maxSize: 50,
    required: true,
    rules: [{ required: true, message: '请上传徽章图', trigger: 'change' }],
    colProps: { xs: 24, md: 12 },
  },
  {
    field: 'lockBadgeThumbnailUrl',
    label: '未解锁徽�?,
    component: 'Input',
    slot: 'uploadSlot',
    maxSizeUnit: 'KB',
    maxSize: 50,
    required: true,
    rules: [{ required: true, message: '请上传未解锁的徽章图', trigger: 'change' }],
    colProps: { xs: 24, md: 12 },
  },
  {
    field: 'badgeDesignUrl',
    label: '徽章大图',
    component: 'Input',
    slot: 'uploadSlot',
    maxSizeUnit: 'KB',
    maxSize: 200,
    required: true,
    rules: [{ required: true, message: '请上传徽章预览图', trigger: 'change' }],
    colProps: { xs: 24, md: 12 },
  },
  {
    field: 'gameSummary',
    label: '游戏简�?,
    component: 'Input',
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
    rules: [{ required: true, message: '请输入游戏简�?, trigger: 'change' }],
    colProps: { span: 24 },
  },
  {
    field: 'gameContent',
    label: '游戏详情',
    component: 'Input',
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
    rules: [{ required: true, message: '请输入游戏详�?, trigger: 'change' }],
    colProps: { span: 24 },
  },
];

/** 游戏记录详情描述项配�?*/
export const detailSchema: DescItem[] = [
  {
    label: '角色名称',
    field: 'name',
    span: 8,
  },
  {
    label: '游戏名称',
    field: 'gameName',
    span: 8,
  },
   {
    label: '解锁等级',
    field: 'unlockLevel',
    span: 8,
  },
  {
    label: '角色头像',
    field: 'roleCardAvatarUrl',
    render: (val) => (val ? h(Image, { src: val, style: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' } }) : ''),
    span: 8,
  },
  {
    label: '游戏图标',
    field: 'gameIconUrl',
    render: (val) => (val ? h(Image, { src: val, style: { width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' , backgroundColor: '#1e1e1e'} }) : ''),
    span: 8,
  },
  {
    label: '游戏唤醒�?,
    field: 'gameWakeWord',
    span: 8,
  },
  {
    label: '徽章',
    field: 'badgeThumbnailUrl',
    render: (val) => (val ? h(Image, { src: val, style: { width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' } }) : ''),
    span: 8,
  },
  {
    label: '未解锁徽章图',
    field: 'lockBadgeThumbnailUrl',
    render: (val) => (val ? h(Image, { src: val, style: { width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' } }) : ''),
    span: 8,
  },
  {
    label: '徽章大图',
    field: 'badgeDesignUrl',
    render: (val) => (val ? h(Image, { src: val, style: { width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' } }) : ''),
    span: 8,
  },
  {
    label: '游戏简�?,
    field: 'gameSummary',
    render: (val) => (val ? h('div', { innerHTML: val }) : ''),
    span: 24,
  },
  {
    label: '游戏详情',
    field: 'gameContent',
    render: (val) => (val ? h('div', { innerHTML: val }) : ''),
    span: 24,
  },
  {
    label: '更新时间',
    field: 'updateTime',
    span: 12,
  },
  {
    label: '创建时间',
    field: 'createTime',
    span: 12,
  },
];
