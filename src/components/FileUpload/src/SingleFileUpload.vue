<!-- @format -->

<template>
	<div class="single-file-upload" :class="{ 'single-file-upload--disabled': disabled }">
		<!-- 无文件：显示上传触发区域 -->
		<template v-if="!currentFile">
			<div class="single-file-upload__trigger" :class="triggerClass" @click="handleTriggerClick">
				<slot name="trigger">
					<div class="single-file-upload__trigger-content">
						<FileOutlined class="single-file-upload__trigger-icon" />
						<span class="single-file-upload__trigger-text">{{ uploadText }}</span>
					</div>
				</slot>
			</div>
		</template>

		<!-- 有文件：展示区域 -->
		<template v-else>
			<div class="single-file-upload__preview-area" :class="triggerClass">
				<!-- 图片 / GIF 缩略图 -->
				<template v-if="isImageLike(currentFile.fileType)">
					<div
						class="single-file-upload__thumb"
						:class="{
							'single-file-upload__thumb--gif-mono': currentFile.fileType === 'gif' && gifMonoEffect,
						}"
						:style="gifMonoStyle"
					>
						<Image :src="currentFile.thumbUrl || currentFile.url" :alt="currentFile.name" />
					</div>
				</template>

				<!-- 视频缩略图 -->
				<template v-else-if="currentFile.fileType === 'video'">
					<div class="single-file-upload__thumb single-file-upload__thumb--video">
						<video v-if="currentFile.thumbUrl || currentFile.url" muted preload="metadata">
							<source :src="currentFile.thumbUrl || currentFile.url" />
						</video>
						<PlayCircleOutlined class="single-file-upload__video-play" />
					</div>
				</template>

				<!-- 音频 / 文档 / 其他 -->
				<template v-else>
					<div class="single-file-upload__thumb single-file-upload__thumb--file">
						<component :is="fileIconComp" class="single-file-upload__file-icon" />
					</div>
				</template>

				<!-- 操作按钮（hover 显示） -->
				<div v-if="!disabled" class="single-file-upload__actions">
					<DeleteOutlined v-if="showDelete" class="single-file-upload__action-icon" @click.stop="handleRemove" />
				</div>
			</div>

			<!-- 文件名 -->
			<div class="single-file-upload__info">
				<span class="single-file-upload__info-name" :title="currentFile.name">
					{{ currentFile.name }}
				</span>
				<span v-if="showSize && currentFile.size" class="single-file-upload__info-size">
					{{ formatFileSize(currentFile.size) }}
				</span>
			</div>
		</template>

		<!-- ============ 上传弹窗 ============ -->
		<FileUpload v-model:open="uploadModalOpen" title="文件上传" :accept="accept" :max-size="maxSize" :max-size-unit="maxSizeUnit" :max-count="1" :multiple="false" :disabled="disabled" :upload-api-url="uploadApiUrl" :name="name" :upload-params="uploadParams" :result-field="resultField" :show-help-text="true" @confirm="onUploadConfirm" />
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { FileOutlined, DeleteOutlined, PlayCircleOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FilePptOutlined, FileTextOutlined, FileZipOutlined, FileUnknownOutlined, AudioOutlined } from '@ant-design/icons-vue'
import { Image, Modal as AModal } from 'ant-design-vue'
import { useInjectFormItemContext } from 'ant-design-vue/es/form'
import FileUpload from './FileUpload.vue'
import { FileTypeEnum } from './types'
import type { FileUploadItem, ListType } from './types'
import { isImageLike, formatFileSize } from './helper'
import { useFileUpload } from './hooks/useFileUpload'

defineOptions({ name: 'SingleFileUpload' })

// ===================== Props =====================

const props = defineProps({
	value: { type: String, default: '' },
	listType: { type: String as () => ListType, default: 'picture-card' },
	accept: { type: Array as () => string[], default: () => [] },
	maxSize: { type: Number, default: 10 },
	maxSizeUnit: { type: String as () => 'B' | 'KB' | 'MB' | 'GB', default: 'MB' },
	disabled: { type: Boolean, default: false },
	uploadApiUrl: { type: String, default: '' },
	name: { type: String, default: 'file' },
	uploadParams: { type: Object as () => Recordable, default: () => ({}) },
	resultField: { type: String, default: '' },
	uploadText: { type: String, default: '点击上传' },
	showSize: { type: Boolean, default: true },
	showDelete: { type: Boolean, default: true },
	gifMonoEffect: { type: Boolean, default: false },
	gifMonoBg: { type: String, default: 'transparent' },
})

const emit = defineEmits<{
	'update:value': [val: string]
	change: [val: string]
	'upload-success': [item: FileUploadItem]
	delete: [item: FileUploadItem]
}>()

// ===================== 钩子：数据管理 =====================

const { currentFile, addFiles, removeFile, getValue, syncFromExternal } = useFileUpload({ mode: 'single' })

// ===================== 自动触发表单校验 =====================
// 当组件在 Form.Item 内时，上传/删除后自动触发 change 校验
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
// 抑制外部同步标志
let suppressSync = false

// ===================== 计算属性 =====================

const triggerClass = computed(() => ({
	'single-file-upload__trigger--card': props.listType === 'picture-card',
	'single-file-upload__trigger--picture': props.listType === 'picture',
	'single-file-upload__trigger--text': props.listType === 'text',
}))

const gifMonoStyle = computed(() => (props.gifMonoEffect ? ({ mixBlendMode: 'difference', background: props.gifMonoBg } as Record<string, string>) : {}))

function getFileIcon(item: FileUploadItem) {
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

const fileIconComp = computed(() => (currentFile.value ? getFileIcon(currentFile.value) : FileUnknownOutlined))

// ===================== 操作 =====================

function handleTriggerClick() {
	uploadModalOpen.value = true
}

/** FileUpload 弹窗确认回调 —— 数据由钩子接管 */
function onUploadConfirm(items: FileUploadItem[]) {
	if (items.length > 0) {
		addFiles(items)
		suppressSync = true
		const val = getValue() as string
		emit('update:value', val)
		emit('change', val)
		emit('upload-success', items[0])
		notifyFormItem()
	}
}

async function handleRemove() {
	const item = currentFile.value
	if (!item) return
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
		emit('update:value', '')
		emit('change', '')
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
		syncFromExternal(val as string)
	},
	{ immediate: true },
)
</script>

<style lang="scss" scoped>
$card-size: 104px;
$card-radius: 8px;
$border-color: #dcdfe6;
$border-color-dark: #303030;
$primary-color: #409eff;
$danger-color: #f56c6c;

.single-file-upload {
	&--disabled {
		opacity: 0.6;
		pointer-events: none;
	}
}

.single-file-upload__trigger {
	cursor: pointer;
	transition:
		border-color 0.2s,
		background 0.2s;

	&--card {
		display: flex;
		align-items: center;
		justify-content: center;
		width: $card-size;
		height: $card-size;
		border: 1px dashed $border-color;
		border-radius: $card-radius;
		background: #fafafa;
		&:hover {
			border-color: $primary-color;
			background: #f0f7ff;
		}
	}
	&--picture {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		border: 1px dashed $border-color;
		border-radius: 6px;
		background: #fafafa;
	}
	&--text {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: $primary-color;
		&:hover {
			text-decoration: underline;
		}
	}

	&-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		color: #8c939d;
	}
	&-icon {
		font-size: 24px;
	}
	&-text {
		font-size: 12px;
	}
}

.single-file-upload__preview-area {
	position: relative;
	width: $card-size;
	height: $card-size;
	border: 1px solid $border-color;
	border-radius: $card-radius;
	overflow: hidden;
	cursor: default;
	&:hover .single-file-upload__actions {
		opacity: 1;
	}
}

.single-file-upload__thumb {
	width: 100%;
	height: 100%;
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
		position: relative;
		background: #000;
	}
	&--file {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f5f7fa;
	}
}

.single-file-upload__video-play {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	font-size: 28px;
	color: rgba(255, 255, 255, 0.85);
	pointer-events: none;
}

.single-file-upload__file-icon {
	font-size: 28px;
	color: #8c939d;
}

.single-file-upload__actions {
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

.single-file-upload__action-icon {
	font-size: 12px;
	color: #fff;
	cursor: pointer;
	&:hover {
		color: $danger-color;
	}
}

.single-file-upload__info {
	margin-top: 8px;
	display: flex;
	flex-direction: column;
	align-items: center;
	max-width: $card-size;
}

.single-file-upload__info-name {
	font-size: 12px;
	color: #303133;
	text-align: center;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	width: 100%;
}

.single-file-upload__info-size {
	font-size: 11px;
	color: #c0c4cc;
	margin-top: 2px;
}

@media (hover: none) and (pointer: coarse) {
	.single-file-upload__actions {
		opacity: 1 !important;
	}
}

html[data-theme='dark'] {
	.single-file-upload {
		&__preview-area {
			border-color: $border-color-dark;
			background: #1a1a1a;
		}
		&__thumb--file {
			background: #21262d;
		}
		&__file-icon {
			color: #6e7681;
		}
		&__info-name {
			color: #e6edf3;
		}
		&__info-size {
			color: #484f58;
		}
	}
	.single-file-upload__trigger {
		&--card,
		&--picture {
			border-color: $border-color-dark;
			background: #1a1a1a;
			color: #e6edf3;
		}
		&--text {
			color: #58a6ff;
		}
	}
}
</style>
