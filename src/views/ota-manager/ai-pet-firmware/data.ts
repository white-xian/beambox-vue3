import { h } from 'vue'
import { Tag } from 'ant-design-vue'
import { DescItem } from '@/components/Description'
import { FormSchema } from '@/components/Form'
import { BasicColumn } from '@/components/Table'
import { AiPetFirmwareIM, AiPetFirmwareStatusEnum } from '@/model/ota'

/** 固件状态下拉选项，供列表筛选和表单展示复用 */
export const firmwareStatusOptions = [
	{ label: '草稿', value: AiPetFirmwareStatusEnum.DRAFT },
	{ label: '已发布', value: AiPetFirmwareStatusEnum.RELEASED },
	{ label: '已下架', value: AiPetFirmwareStatusEnum.OFFLINE },
]

function getFirmwareUpdateTimestamp(record: AiPetFirmwareIM) {
	const updateTime = record.updateTime
	if (!updateTime) {
		return 0
	}

	const timestamp = Date.parse(updateTime)
	if (Number.isFinite(timestamp)) {
		return timestamp
	}

	const normalizedTimestamp = Date.parse(updateTime.replace(/-/g, '/').replace('T', ' '))
	return Number.isFinite(normalizedTimestamp) ? normalizedTimestamp : 0
}

/** 后端只返回 0/1，前端根据更新时间将旧的已发布版本展示为已下架 */
export function normalizeFirmwareStatusByLatestUpdateTime(records: AiPetFirmwareIM[]) {
	if (!Array.isArray(records)) {
		return records
	}

	let latestReleasedIndex = -1
	let latestReleasedUpdateTime = Number.NEGATIVE_INFINITY

	records.forEach((record, index) => {
		if (Number(record.status) !== AiPetFirmwareStatusEnum.RELEASED) {
			return
		}

		const updateTime = getFirmwareUpdateTimestamp(record)
		if (updateTime > latestReleasedUpdateTime) {
			latestReleasedUpdateTime = updateTime
			latestReleasedIndex = index
		}
	})

	return records.map((record, index) => {
		const status = Number(record.status)
		if (status === AiPetFirmwareStatusEnum.RELEASED) {
			return {
				...record,
				status: index === latestReleasedIndex ? AiPetFirmwareStatusEnum.RELEASED : AiPetFirmwareStatusEnum.OFFLINE,
			}
		}

		if (status === AiPetFirmwareStatusEnum.DRAFT || status === AiPetFirmwareStatusEnum.OFFLINE) {
			return {
				...record,
				status,
			}
		}

		return record
	})
}

/** 将固件状态枚举转换成中文文案 */
export function formatFirmwareStatus(status?: AiPetFirmwareStatusEnum) {
	if (status === AiPetFirmwareStatusEnum.RELEASED) {
		return '已发布'
	} else if (status === AiPetFirmwareStatusEnum.OFFLINE) {
		return '已下架'
	}
	return '草稿'
}

/** 渲染列表/详情中的固件状态标签 */
export function renderFirmwareStatus(status?: AiPetFirmwareStatusEnum) {
	const released = status === AiPetFirmwareStatusEnum.RELEASED
	const offline = status === AiPetFirmwareStatusEnum.OFFLINE
	return h(Tag, { color: released ? 'green' : offline ? 'red' : 'orange' }, () => (released ? '已发布' : offline ? '已下架' : '草稿'))
}

/** 格式化文件大小，兼容后端返回字符串或数字 */
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

/** AI 宠物固件 OTA 列表列配置 */
export const columns: BasicColumn[] = [
	{
		title: '固件版本号',
		dataIndex: 'versionCode',
		width: 120,
	},
	{
		title: '固件版本名称',
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
		/** 根据附属包数组 + 副版本附属包实时展示数量 */
		customRender: ({ record }) => {
			const data = record as AiPetFirmwareIM
			const mainCount = data.packages?.length || 0
			const subCount = data.subVersionPackage?.length || 0
			return mainCount + subCount
		},
	},
	{
		title: '状态',
		dataIndex: 'status',
		width: 120,
		/** 状态列统一用彩色标签呈现 */
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

/** AI 宠物固件 OTA 列表搜索表单配置 */
export const searchFormSchema: FormSchema[] = [
	{
		label: '固件版本名称',
		field: 'versionCode',
		component: 'InputNumber',
		colProps: { span: 6 },
	},
	{
		label: '升级说明',
		field: 'description',
		component: 'Input',
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

/** AI 宠物固件 OTA 详情描述项配置 */
export const detailSchema: DescItem[] = [
	{
		label: '固件版本号',
		field: 'versionCode',
		span: 8,
	},
	{
		label: '固件版本名称',
		field: 'versionName',
		span: 8,
	},
	{
		label: '美术包版本号',
		field: 'subVersionCode',
		render: (val) => val ?? '-',
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
