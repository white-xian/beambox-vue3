import { DescItem } from '@/components/Description';
import { FormSchema } from '@/components/Form';
import { BasicColumn } from '@/components/Table';
import { h } from 'vue';
import { Image } from 'ant-design-vue';
import { Tinymce } from '@/components/Tinymce';

/** 人物关系列表列配置 */
export const columns: BasicColumn[] = [
  {
    title: '本身角色名称',
    dataIndex: 'name',
    width: 140,
  },
  {
    title: '本身角色头像',
    dataIndex: 'roleCardAvatarUrl',
    width: 100,
    customRender: ({ record }) =>
      record.roleCardAvatarUrl ? h(Image, { src: record.roleCardAvatarUrl, style: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' } }) : '',
  },
  {
    title: '关联角色名称',
    dataIndex: 'relatedName',
    width: 140,
  },
  {
    title: '关联角色头像',
    dataIndex: 'roleRelationshipUrl',
    width: 100,
    customRender: ({ record }) =>
      record.roleRelationshipUrl ? h(Image, { src: record.roleRelationshipUrl, style: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' } }) : '',
  },
  {
    title: '说明',
    dataIndex: 'illustrate',
    width: 200,
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

/** 人物关系列表搜索表单配置 */
export const searchFormSchema: FormSchema[] = [
  {
    label: '本身角色',
    field: 'tablesideId',
    component: 'ApiSelect',
    componentProps: {
      api: () => import('@/api/deskMate/roleInfo.api').then((m) => m.getRoleInfoOptionsApi()),
      labelField: 'name',
      valueField: 'id',
      placeholder: '请选择本身角色',
    },
    colProps: { span: 6 },
  },
  {
    label: '关联角色',
    field: 'relatedId',
    component: 'ApiSelect',
    componentProps: {
      api: () => import('@/api/deskMate/roleInfo.api').then((m) => m.getRoleInfoOptionsApi()),
      labelField: 'name',
      valueField: 'id',
      placeholder: '请选择关联角色',
    },
    colProps: { span: 6 },
  },
  {
    label: '说明',
    field: 'illustrate',
    component: 'Input',
    colProps: { span: 6 },
  },
];

/** 人物关系表单配置 */
export const formSchema: FormSchema[] = [
  {
    field: 'tablesideId',
    label: '本身角色',
    component: 'ApiSelect',
    componentProps: {
      api: () => import('@/api/deskMate/roleInfo.api').then((m) => m.getRoleInfoOptionsApi()),
      resultField: 'data',
      labelField: 'name',
      valueField: 'id',
      placeholder: '请选择本身角色',
    },
    required: true,
    rules: [{ required: true, message: '请选择本身角色', trigger: 'change' }],
    colProps: { xs: 24, md: 12 },
  },
  {
    field: 'relatedId',
    label: '关联角色',
    component: 'ApiSelect',
    componentProps: {
      api: () => import('@/api/deskMate/roleInfo.api').then((m) => m.getRoleInfoOptionsApi()),
      resultField: 'data',
      labelField: 'name',
      valueField: 'id',
      placeholder: '请选择关联角色',
    },
    required: true,
    rules: [{ required: true, message: '请选择关联角色', trigger: 'change' }],
    colProps: { xs: 24, md: 12 },
  },
  {
    field: 'illustrate',
    label: '说明',
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
    rules: [{ required: true, message: '请输入说明', trigger: 'blur' }],
    colProps: { span: 24 },
  },
];

/** 人物关系详情描述项配置 */
export const detailSchema: DescItem[] = [
  {
    label: '本身角色名称',
    field: 'name',
    span: 8,
  },
  {
    label: '本身角色头像',
    field: 'roleCardAvatarUrl',
    render: (val) => (val ? h(Image, { src: val, style: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' } }) : ''),
    span: 8,
  },
  {
    label: '更新时间',
    field: 'updateTime',
    span: 8,
  },
  {
    label: '关联角色名称',
    field: 'relatedName',
    span: 8,
  },
  {
    label: '关联角色头像',
    field: 'roleRelationshipUrl',
    render: (val) => (val ? h(Image, { src: val, style: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' } }) : ''),
    span: 8,
  },
  {
    label: '创建时间',
    field: 'createTime',
    span: 8,
  },
  {
    label: '说明',
    field: 'illustrate',
    span: 24,
  },
];
