import { DescItem } from '@/components/Description'
import { FormSchema } from '@/components/Form'
import { BasicColumn } from '@/components/Table'
import dayjs from 'dayjs'

/** APP日志列表列配置 */
export const columns: BasicColumn[] = [
	{
		title: '日志内容',
		dataIndex: 'log',
		width: 400,
		ellipsis: true,
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

/** APP日志列表搜索表单配置 */
export const searchFormSchema: FormSchema[] = [
	{
		label: '日志内容',
		field: 'log',
		component: 'Input',
		colProps: { span: 6 },
	},
	{
		label: '时间范围',
		field: 'timeRange',
		component: 'RangePicker',
		componentProps: {
			style: { width: '100%' },
			class: 'range-picker-center',
			placeholder: ['开始日期', '结束日期'],
			presets: [
				{ label: '最近7天', value: [dayjs().subtract(7, 'day').startOf('day'), dayjs().endOf('day')] },
				{ label: '最近14天', value: [dayjs().subtract(14, 'day').startOf('day'), dayjs().endOf('day')] },
				{ label: '最近30天', value: [dayjs().subtract(30, 'day').startOf('day'), dayjs().endOf('day')] },
				{ label: '最近60天', value: [dayjs().subtract(60, 'day').startOf('day'), dayjs().endOf('day')] },
				{ label: '最近90天', value: [dayjs().subtract(90, 'day').startOf('day'), dayjs().endOf('day')] },
			],
		},
		colProps: { span: 8 },
	},
]

/** APP日志详情描述项配置 */
export const detailSchema: DescItem[] = [
	{
		label: '日志内容',
		field: 'log',
		span: 24,
	},
	{
		label: '创建时间',
		field: 'createTime',
		span: 12,
	},
	{
		label: '更新时间',
		field: 'updateTime',
		span: 12,
	},
]
