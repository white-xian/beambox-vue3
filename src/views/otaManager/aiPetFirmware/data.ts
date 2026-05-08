import { h } from 'vue'
import { Tag } from 'ant-design-vue'
import { DescItem } from '@/components/Description'
import { FormSchema } from '@/components/Form'
import { BasicColumn } from '@/components/Table'
import { AiPetFirmwareIM, AiPetFirmwareStatusEnum } from '@/model/ota'

export const firmwareStatusOptions = [
	{ label: '草稿', value: AiPetFirmwareStatusEnum.DRAFT },
	{ label: '已发布', value: AiPetFirmwareStatusEnum.RELEASED },
]

export function formatFirmwareStatus(status?: AiPetFirmwareStatusEnum) {
	return status === AiPetFirmwareStatusEnum.RELEASED ? '已发布' : '草稿'
}

export function renderFirmwareStatus(status?: AiPetFirmwareStatusEnum) {
	const released = status === AiPetFirmwareStatusEnum.RELEASED
	return h(Tag, { color: released ? 'green' : 'orange' }, () => (released ? '已发布' : '草稿'))
}

export function formatFileSize(value?: string | number) {
	if (value === undefined || value === null || value === '') {
		return '-'
	}

	const size = Number(value)
	if (!Number.isFinite(size)) {
		return String(value)
	}

	if (size < 1024) {
		return `${size} B`
	}

	if (size < 1024 * 1024) {
		return `${(size / 1024).toFixed(2)} KB`
	}

	if (size < 1024 * 1024 * 1024) {
		return `${(size / 1024 / 1024).toFixed(2)} MB`
	}

	return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export const columns: BasicColumn[] = [
	{
		title: '主版本号',
		dataIndex: 'versionCode',
		width: 120,
	},
	{
		title: '主版本名称',
		dataIndex: 'versionName',
		width: 160,
	},
	{
		title: '升级说明',
		dataIndex: 'description',
		width: 260,
	},
	{
		title: '附属包数量',
		dataIndex: 'packages',
		width: 120,
		customRender: ({ record }) => {
			const data = record as AiPetFirmwareIM
			return data.packages?.length || 0
		},
	},
	{
		title: '状态',
		dataIndex: 'status',
		width: 120,
		customRender: ({ record }) => {
			const data = record as AiPetFirmwareIM
			return renderFirmwareStatus(data.status)
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

export const searchFormSchema: FormSchema[] = [
	{
		label: '主版本名称',
		field: 'versionName',
		component: 'Input',
		colProps: { span: 6 },
	},
	{
		label: '主版本号',
		field: 'versionCode',
		component: 'InputNumber',
		colProps: { span: 6 },
	},
	{
		label: '状态',
		field: 'status',
		component: 'Select',
		componentProps: {
			options: firmwareStatusOptions,
			showSearch: true,
			optionFilterProp: 'label',
		},
		colProps: { span: 6 },
	},
]

export const detailSchema: DescItem[] = [
	{
		label: '主版本号',
		field: 'versionCode',
		span: 8,
	},
	{
		label: '主版本名称',
		field: 'versionName',
		span: 8,
	},
	{
		label: '状态',
		field: 'status',
		render: (val) => renderFirmwareStatus(val),
		span: 8,
	},
	{
		label: '升级说明',
		field: 'description',
		span: 24,
	},
	{
		label: '创建时间',
		field: 'createTime',
		span: 8,
	},
	{
		label: '更新时间',
		field: 'updateTime',
		span: 8,
	},
]
