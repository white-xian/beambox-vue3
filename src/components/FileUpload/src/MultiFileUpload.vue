<!-- @format -->

<template>
	<div class="multi-file-upload" :class="{ 'multi-file-upload--disabled': disabled }">
		<!-- ============ 上传触发区域 ============ -->
		<div v-if="!disabled && !maxReached" class="multi-file-upload__trigger" @click="handleTriggerClick">
			<slot name="trigger">
				<a-button type="dashed" block>
					<template #icon><CloudUploadOutlined /></template>
					{{ uploadText }}
				</a-button>
			</slot>
		</div>

		<!-- 已达上限 -->
		<div v-if="maxReached" class="multi-file-upload__max-tip">
			<Alert message="已达到最大上传数量，可删除后继续添加" type="warning" banner />
		</div>

		<!-- ============ 文件列表 ============ -->
		<div v-if="doneFiles.length > 0" class="multi-file-upload__list">
			<div v-for="item in doneFiles" :key="item.uid" class="multi-file-upload__list-item">
				<!-- 图片 / GIF -->
				<template v-if="isImageLike(item.fileType)">
					<div class="multi-file-upload__list-thumb" :class="{ 'multi-file-upload__list-thumb--gif-mono': item.fileType === 'gif' && gifMonoEffect }" :style="gifMonoStyle">
						<Image :src="item.thumbUrl || item.url" :alt="item.name" />
					</div>
				</template>

				<!-- 视频 -->
				<template v-else-if="item.fileType === 'video'">
					<div class="multi-file-upload__list-thumb multi-file-upload__list-thumb--video">
						<video v-if="item.thumbUrl || item.url" muted preload="metadata">
							<source :src="item.thumbUrl || item.url" />
						</video>
						<PlayCircleOutlined class="multi-file-upload__list-video-play" />
					</div>
				</template>

				<!-- 其他文件 -->
				<template v-else>
					<div class="multi-file-upload__list-thumb multi-file-upload__list-thumb--file">
						<component :is="getFileIconComp(item)" class="multi-file-upload__list-file-icon" />
					</div>
				</template>

				<!-- 操作按钮 -->
				<div v-if="!disabled" class="multi-file-upload__list-actions">
					<DeleteOutlined v-if="showDelete" class="multi-file-upload__list-action-icon" @click.stop="handleRemove(item)" />
				</div>

				<!-- 文件名 & 大小 -->
				<div class="multi-file-upload__list-name" :title="item.name">{{ item.name }}</div>
				<div v-if="showSize && item.size" class="multi-file-upload__list-size">
					{{ formatFileSize(item.size) }}
				</div>
			</div>
		</div>

		<!-- ============ 上传弹窗 ============ -->
		<FileUpload v-model:open="uploadModalOpen" title="文件上传" :accept="accept" :max-size="maxSize" :max-size-unit="maxSizeUnit" :max-count="remainingSlots" :multiple="true" :disabled="disabled" :upload-api-url="uploadApiUrl" :name="name" :upload-params="uploadParams" :result-field="resultField" :show-help-text="showHelpText" :help-text="helpText" @confirm="onUploadConfirm" />
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DeleteOutlined, PlayCircleOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FilePptOutlined, FileTextOutlined, FileZipOutlined, FileUnknownOutlined, AudioOutlined, CloudUploadOutlined } from '@ant-design/icons-vue'
import { Image, Alert, Modal as AModal } from 'ant-design-vue'
import { useInjectFormItemContext } from 'ant-design-vue/es/form'
import FileUpload from './FileUpload.vue'
import { FileTypeEnum } from './types'
import type { FileUploadItem } from './types'
import { isImageLike, formatFileSize } from './helper'
import { useFileUpload } from './hooks/useFileUpload'

defineOptions({ name: 'MultiFileUpload' })

// ===================== Props =====================

const props = defineProps({
	value: { type: Array as () => string[], default: () => [] },
	accept: { type: Array as () => string[], default: () => [] },
	maxSize: { type: Number, default: 10 },
	maxSizeUnit: { type: String as () => 'B' | 'KB' | 'MB' | 'GB', default: 'MB' },
	maxCount: { type: Number, default: 10 },
	disabled: { type: Boolean, default: false },
	uploadApiUrl: { type: String, default: '' },
	name: { type: String, default: 'file' },
	uploadParams: { type: Object as () => Recordable, default: () => ({}) },
	resultField: { type: String, default: '' },
	uploadText: { type: String, default: '点击上传' },
	showSize: { type: Boolean, default: true },
	showDelete: { type: Boolean, default: true },
	helpText: { type: String, default: '' },
	showHelpText: { type: Boolean, default: true },
	gifMonoEffect: { type: Boolean, default: false },
	gifMonoBg: { type: String, default: 'transparent' },
})

const emit = defineEmits<{
	'update:value': [val: string[]]
	change: [val: string[]]
	'upload-success': [item: FileUploadItem]
	delete: [item: FileUploadItem]
}>()

// ===================== 钩子：数据管理 =====================

const { doneFiles, doneCount, addFiles, removeFile, getValue, syncFromExternal } = useFileUpload({ mode: 'multiple', maxCount: props.maxCount })

// ===================== 自动触发表单校验 =====================
let formItemContext: { onFieldChange: () => void } | null = null
try {
	formItemContext = useInjectFormItemContext()
} catch {
	// 不在 Form.Item 内，跳过
}
function notifyFormItem() {
	formItemContext?.onFieldChange()
}

// 模态框状态
const uploadModalOpen = ref(false)
let suppressSync = false

// ===================== 计算属性 =====================

const maxReached = computed(() => doneCount.value >= props.maxCount)
const remainingSlots = computed(() => Math.max(0, props.maxCount - doneCount.value))

const gifMonoStyle = computed(() => (props.gifMonoEffect ? ({ mixBlendMode: 'difference', background: props.gifMonoBg } as Record<string, string>) : {}))

function getFileIconComp(item: FileUploadItem) {
	const ext = (item.name || '').split('.').pop()?.toLowerCase() || ''
	const type = (item.type || '').toLowerCase()
	if (ext === 'pdf' || type.includes('pdf')) return FilePdfOutlined
	if (ext === 'doc' || ext === 'docx' || type.includes('word')) return FileWordOutlined
	if (ext === 'xls' || ext === 'xlsx' || type.includes('excel') || type.includes('spreadsheet')) return FileExcelOutlined
	if (ext === 'ppt' || ext === 'pptx' || type.includes('presentation')) return FilePptOutlined
	if (ext === 'zip' || ext === 'rar' || ext === '7z' || ext === 'tar' || ext === 'gz') return FileZipOutlined
	if (ext === 'txt' || ext === 'md' || ext === 'json' || ext === 'xml' || ext === 'csv') return FileTextOutlined
	if (item.fileType === FileTypeEnum.AUDIO) return AudioOutlined
	return FileUnknownOutlined
}

// ===================== 操作 =====================

function handleTriggerClick() {
	uploadModalOpen.value = true
}

/** FileUpload 弹窗确认回调 */
function onUploadConfirm(items: FileUploadItem[]) {
	if (items.length > 0) {
		addFiles(items)
		suppressSync = true
		const val = getValue() as string[]
		emit('update:value', val)
		emit('change', val)
		items.forEach((item) => emit('upload-success', item))
		notifyFormItem()
	}
}

async function handleRemove(item: FileUploadItem) {
	try {
		await new Promise<void>((resolve, reject) => {
			AModal.confirm({
				title: '确认删除',
				content: `确定要删除文件「${item.name}」吗？删除后不可恢复。`,
				okText: '删除',
				okType: 'danger',
				cancelText: '取消',
				onOk: () => resolve(),
				onCancel: () => reject(),
			})
		})
	} catch {
		return
	}
	const removed = removeFile(item.uid)
	if (removed) {
		suppressSync = true
		emit('delete', removed)
		const val = getValue() as string[]
		emit('update:value', val)
		emit('change', val)
		notifyFormItem()
	}
}

// ===================== 外部值同步（v-model 回显） =====================

watch(
	() => props.value,
	(val) => {
		if (suppressSync) {
			suppressSync = false
			return
		}
		syncFromExternal((val ?? []) as string[])
	},
	{ immediate: true, deep: true },
)
</script>

<style lang="scss" scoped>
$card-size: 104px;
$card-radius: 8px;
$border-color: #dcdfe6;
$border-color-dark: #303030;
$primary-color: #409eff;
$danger-color: #f56c6c;

.multi-file-upload {
	&--disabled {
		opacity: 0.6;
		pointer-events: none;
	}
}

.multi-file-upload__trigger {
	cursor: pointer;
	:deep(.ant-btn-dashed) {
		width: 100%;
		height: 40px;
	}
}

.multi-file-upload__max-tip {
	margin-bottom: 12px;
}

.multi-file-upload__list {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-top: 12px;
}

.multi-file-upload__list-item {
	position: relative;
	width: $card-size;
	border: 1px solid $border-color;
	border-radius: $card-radius;
	overflow: hidden;
	transition: border-color 0.2s;
	&:hover .multi-file-upload__list-actions {
		opacity: 1;
	}
}

.multi-file-upload__list-thumb {
	width: $card-size;
	height: $card-size;
	overflow: hidden;
	:deep(.ant-image) {
		display: block !important;
		width: 100% !important;
		height: 100% !important;
	}
	:deep(.ant-image-img) {
		display: block !important;
		width: 100% !important;
		height: 100% !important;
		object-fit: cover !important;
	}
	img,
	video {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	&--gif-mono img {
		filter: grayscale(1) contrast(2);
		mix-blend-mode: difference;
	}
	&--video {
		background: #000;
	}
	&--file {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f5f7fa;
	}
}

.multi-file-upload__list-video-play {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	font-size: 24px;
	color: rgba(255, 255, 255, 0.85);
}

.multi-file-upload__list-file-icon {
	font-size: 32px;
	color: #8c939d;
}

.multi-file-upload__list-actions {
	position: absolute;
	top: 4px;
	right: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	border-radius: 50%;
	background: rgba(0, 0, 0, 0.45);
	opacity: 0;
	transition: opacity 0.2s;
}

.multi-file-upload__list-action-icon {
	font-size: 12px;
	color: #fff;
	cursor: pointer;
	&:hover {
		color: $danger-color;
	}
}

.multi-file-upload__list-name {
	padding: 4px 8px 0;
	font-size: 11px;
	color: #303133;
	text-align: center;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.multi-file-upload__list-size {
	padding: 0 8px 6px;
	font-size: 10px;
	color: #c0c4cc;
	text-align: center;
}

@media (hover: none) and (pointer: coarse) {
	.multi-file-upload__list-actions {
		opacity: 1 !important;
	}
}

html[data-theme='dark'] {
	.multi-file-upload {
		&__list-item {
			border-color: $border-color-dark;
			background: #1a1a1a;
		}
		&__list-thumb--file {
			background: #21262d;
		}
		&__list-file-icon {
			color: #6e7681;
		}
		&__list-name {
			color: #e6edf3;
		}
		&__list-size {
			color: #484f58;
		}
	}
}
</style>
