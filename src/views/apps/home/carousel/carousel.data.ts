import { FormSchema } from '@/components/Form'
import { BasicColumn } from '@/components/Table'
import { DescItem } from '@/components/Description'
import { h } from 'vue'
import { CarouselIM } from '@/model/apps/home'

/** 跳转方式选项 */
export const redirectOptions = [
  { label: '不跳转', value: 0 },
  { label: 'App内跳', value: 1 },
  { label: '外部浏览器', value: 2 },
]

/** 状态选项 */
export const statusOptions = [
  { label: '禁用', value: 0 },
  { label: '启用', value: 1 },
]

/** 表格列配置 */
export const columns: BasicColumn[] = [
  {
    title: '轮播图标题',
    dataIndex: 'title',
    width: 150,
  },
  {
    title: '图片',
    dataIndex: 'imageUrl',
    width: 120,
    customRender: ({ record }) => {
      const data = record as CarouselIM
      return data.imageUrl
        ? {
            children: { style: { width: '60px', height: '36px', objectFit: 'cover', borderRadius: '4px' } },
            tag: 'img',
            src: data.imageUrl,
          }
        : '-'
    },
  },
  {
    title: '跳转链接',
    dataIndex: 'linkUrl',
    width: 200,
    ellipsis: true,
  },
  {
    title: '是否跳转',
    dataIndex: 'isRedirect',
    width: 120,
    customRender: ({ record }) => {
      const data = record as CarouselIM
      const opt = redirectOptions.find((o) => o.value === data.isRedirect)
      return opt?.label ?? '-'
    },
  },
  {
    title: '排序',
    dataIndex: 'sortOrder',
    width: 80,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 80,
    customRender: ({ record }) => {
      const data = record as CarouselIM
      const opt = statusOptions.find((o) => o.value === data.status)
      return opt?.label ?? '-'
    },
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
]

/** 搜索表单配置 */
export const searchFormSchema: FormSchema[] = [
  {
    label: '轮播图标题',
    field: 'title',
    component: 'Input',
    colProps: { span: 6 },
  },
  {
    label: '状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: statusOptions,
    },
    colProps: { span: 6 },
  },
]

/** 表单配置 */
export const formSchema: FormSchema[] = [
  {
    label: '轮播图ID',
    field: 'carouselId',
    component: 'Input',
    show: false,
    colProps: { span: 12 },
  },
  {
    label: '轮播图标题',
    field: 'title',
    component: 'Input',
    required: true,
    colProps: { span: 24 },
  },
  {
    label: '图片URL',
    field: 'imageUrl',
    component: 'Input',
    required: true,
    colProps: { span: 24 },
    rules: [{ type: 'url', message: '请输入正确的URL地址' }],
  },
  {
    label: '跳转链接',
    field: 'linkUrl',
    component: 'Input',
    colProps: { span: 24 },
  },
  {
    label: '是否跳转',
    field: 'isRedirect',
    component: 'RadioButtonGroup',
    required: true,
    defaultValue: 0,
    componentProps: {
      options: redirectOptions,
    },
    colProps: { span: 12 },
  },
  {
    label: '排序',
    field: 'sortOrder',
    component: 'InputNumber',
    required: true,
    defaultValue: 0,
    componentProps: {
      min: 0,
      max: 9999,
    },
    colProps: { span: 12 },
  },
  {
    label: '状态',
    field: 'status',
    component: 'RadioButtonGroup',
    required: true,
    defaultValue: 1,
    componentProps: {
      options: statusOptions,
    },
    colProps: { span: 12 },
  },
]

/** 详情展示配置 */
export const detailSchema: DescItem[] = [
  {
    label: '轮播图标题',
    field: 'title',
  },
  {
    label: '图片',
    field: 'imageUrl',
    render: (val) => (val ? h('img', { src: val as string, style: { width: '120px', height: '72px', objectFit: 'cover', borderRadius: '8px' } }) : '-'),
  },
  {
    label: '跳转链接',
    field: 'linkUrl',
  },
  {
    label: '是否跳转',
    field: 'isRedirect',
    render: (val) => {
      const opt = redirectOptions.find((o) => o.value === val)
      return opt?.label ?? '-'
    },
  },
  {
    label: '排序',
    field: 'sortOrder',
  },
  {
    label: '状态',
    field: 'status',
    render: (val) => {
      const opt = statusOptions.find((o) => o.value === val)
      return opt?.label ?? '-'
    },
  },
  {
    label: '创建时间',
    field: 'createTime',
  },
  {
    label: '更新时间',
    field: 'updateTime',
  },
]
