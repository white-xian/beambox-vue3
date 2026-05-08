<!-- @format -->

<template>
	<BasicDrawer v-bind="$attrs" :title="getTitle" @register="registerDrawer" width="70%" showFooter :showOkBtn="false">
		<!-- 主版本基础信息 -->
		<Description @register="registerDescription" class="mt-4" />
		<Divider orientation="left">附属包</Divider>
		<!-- 附属包明细：图片直接预览，其他文件展示可点击链接 -->
		<Table :columns="packageColumns" :data-source="packageData" :pagination="false" row-key="id" size="small" bordered>
			<template #bodyCell="{ column, record }">
				<template v-if="column.key === 'fileUrl'">
					<div class="file-preview-cell">
						<Image v-if="isImageFile(record.fileUrl)" :src="record.fileUrl" :width="60" :height="60" :fallback="fallbackImg" style="object-fit: cover; border-radius: 4px; cursor: pointer" />
						<a v-else :href="record.fileUrl" target="_blank" rel="noopener noreferrer" class="file-link">
							<FileOutlined style="margin-right: 4px" />
							<span class="file-name">{{ record.fileName || getFileNameFromUrl(record.fileUrl) }}</span>
						</a>
					</div>
				</template>
				<span v-else-if="column.key === 'fileSize'">
					{{ formatFileSize(record.fileSize) }}
				</span>
			</template>
		</Table>
	</BasicDrawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Divider, Image, Table } from 'ant-design-vue'
import { FileOutlined } from '@ant-design/icons-vue'
import { Description, useDescription } from '@/components/Description'
import { BasicDrawer, useDrawerInner } from '@/components/Drawer'
import { DescItemSizeEnum } from '@/enums'
import { getAiPetFirmwareDetailApi } from '@/api/ota/aiPetFirmware.api'
import { AiPetFirmwareIM } from '@/model/ota'
import { detailSchema, formatFileSize } from './data'

const getTitle = ref('AI 宠物固件 OTA 详情')

/** 当前详情抽屉展示的主版本记录 */
const currentRecord = ref<AiPetFirmwareIM>({
	versionCode: 0,
	versionName: '',
	description: '',
	packages: [],
})

/** 附属包表格数据，统一从当前记录派生 */
const packageData = computed(() => currentRecord.value.packages || [])

/** 附属包表格列配置 */
const packageColumns: any[] = [
	{ title: '模块编码', dataIndex: 'moduleCode', key: 'moduleCode', width: 140 },
	{ title: '模块名称', dataIndex: 'moduleName', key: 'moduleName', width: 160 },
	{ title: '文件名称', dataIndex: 'fileName', key: 'fileName', width: 220 },
	{ title: '文件地址', dataIndex: 'fileUrl', key: 'fileUrl', width: 150 },
	{ title: '文件大小', dataIndex: 'fileSize', key: 'fileSize', width: 140 },
	{ title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
]

/** 主版本基础信息描述组件配置 */
const [registerDescription, { setDescProps }] = useDescription({
	title: 'AI 宠物固件 OTA 详情',
	schema: detailSchema,
	column: DescItemSizeEnum.DEFAULT,
})

/** 打开抽屉时先展示列表记录，再按 ID 补拉附属包详情 */
const [registerDrawer, { setDrawerProps }] = useDrawerInner((data) => {
	setDrawerProps({ loading: true, confirmLoading: false })
	const record = data.record as AiPetFirmwareIM
	// 先用 table 数据渲染主属性
	setRecord(record)
	// 再异步拉取附属包详情
	if (record.id) {
		fetchPackages(record.id)
	} else {
		setDrawerProps({ loading: false })
	}
})

/** 查询指定主版本的附属包详情 */
async function fetchPackages(versionId: string) {
	try {
		const packages = await getAiPetFirmwareDetailApi(versionId)
		if (Array.isArray(packages)) {
			currentRecord.value.packages = packages
		}
	} catch {
		// 保持 table 传入的数据
	} finally {
		setDrawerProps({ loading: false })
	}
}

/** 图片扩展名列表 */
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif']

/** 加载失败占位图 */
const fallbackImg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iMzAiIHk9IjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzk5OSIgZm9udC1zaXplPSI4Ij7lm77niYflpLHotKU8L3RleHQ+PC9zdmc+'

/** 判断文件 URL 是否为图片类型 */
function isImageFile(url: string): boolean {
	if (!url) return false
	const ext = url.split('.').pop()?.toLowerCase() || ''
	// 去除查询参数
	const cleanExt = ext.split('?')[0]
	return IMAGE_EXTENSIONS.includes(cleanExt)
}

/** 从 URL 提取文件名 */
function getFileNameFromUrl(url: string): string {
	if (!url) return ''
	const parts = url.split('/')
	const last = parts[parts.length - 1]
	return last.split('?')[0] || last
}

/** 同步当前抽屉记录，并刷新详情描述组件数据 */
function setRecord(record: AiPetFirmwareIM) {
	currentRecord.value = {
		versionCode: record.versionCode,
		versionName: record.versionName,
		description: record.description,
		status: record.status,
		packages: Array.isArray(record.packages) ? [...record.packages] : [],
		id: record.id,
		createTime: (record as any).createTime,
		updateTime: (record as any).updateTime,
	}
	setDescProps({ data: currentRecord.value })
	getTitle.value = `AI 宠物固件 OTA 详情:${record.versionName}`
}
</script>

<style lang="less" scoped>
.file-preview-cell {
	display: flex;
	align-items: center;
	min-height: 60px;

	.file-link {
		display: inline-flex;
		align-items: center;
		color: #1677ff;
		text-decoration: none;
		max-width: 100%;

		.file-name {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		&:hover {
			color: #4096ff;
			text-decoration: underline;
		}
	}
}
</style>
