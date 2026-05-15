<!-- @format -->

<template>
	<Modal v-model:open="modalOpen" :title="title" :width="560" :destroy-on-close="false" :mask-closable="false" centered wrap-class-name="file-upload-modal" @cancel="handleCancel">
		<div class="file-upload" :class="{ 'file-upload--disabled': disabled }">
			<!-- ============ 提示信息 ============ -->
			<div v-if="showHelpText && computedHelpText" class="file-upload__help">
				<Alert :message="computedHelpText" type="info" banner />
			</div>

			<!-- ============ 已完成文件列表 ============ -->
			<div v-if="doneItems.length > 0" class="file-upload__done-list">
				<div class="file-upload__done-item" v-for="item in doneItems" :key="item.uid">
					<CheckCircleOutlined class="file-upload__done-icon" />
					<span class="file-upload__done-name" :title="item.name">{{ item.name }}</span>
					<span class="file-upload__done-size">{{ formatFileSize(item.size) }}</span>
					<CloseOutlined class="file-upload__done-remove" @click="removeDoneItem(item.uid)" />
				</div>
			</div>

			<!-- ============ 拖拽上传区域 ============ -->
			<div v-if="!disabled && !maxCountReached" class="file-upload__drag-area">
				<UploadDragger :accept="stringAccept" :multiple="multiple" :show-upload-list="false" :before-upload="handleBeforeUpload" :custom-request="handleCustomRequest" :disabled="disabled" class="file-upload__dragger">
					<div class="file-upload__drag-icon">
						<InboxOutlined />
					</div>
					<p class="file-upload__drag-text">将文件拖到此处，或<em>点击上传</em></p>
					<p v-if="computedHelpText" class="file-upload__drag-tip">
						<template v-if="maxSize">
							大小不超过 <b>{{ displayMaxSize }}{{ normalizedMaxSizeUnit }}</b>
						</template>
						<template v-if="accept && accept.length > 0">
							格式为 <b>{{ accept.join('、').toUpperCase() }}</b>
						</template>
						<template v-if="maxCount !== Infinity">
							最多上传 <b>{{ maxCount }}</b> 个文件</template
						>
					</p>
				</UploadDragger>
			</div>

			<!-- ============ 已达上限提示 ============ -->
			<div v-if="maxCountReached" class="file-upload__max-tip">
				<Alert :message="'已达到最大上传数量 ' + maxCount + ' 个，可移除已上传文件后继续添加'" type="warning" banner />
			</div>

			<!-- ============ 上传进度列表 ============ -->
			<div v-if="uploadingItems.length > 0" class="file-upload__progress-list">
				<div class="file-upload__progress-item" v-for="item in uploadingItems" :key="item.uid">
					<div class="file-upload__progress-file-info">
						<span class="file-upload__progress-file-name">{{ item.name }}</span>
						<span class="file-upload__progress-file-size">{{ formatFileSize(item.size) }}</span>
					</div>
					<div class="file-upload__progress-bar-wrap">
						<div class="file-upload__progress-bar">
							<div class="file-upload__progress-inner" :style="{ width: item.percent + '%' }"></div>
						</div>
						<span class="file-upload__progress-text">
							<template v-if="item.status === 'uploading'">{{ (item.percent || 0).toFixed(2) }}%</template>
							<span v-else-if="item.status === 'done'" class="file-upload__progress-text--success">上传成功</span>
							<span v-else-if="item.status === 'error'" class="file-upload__progress-text--error">上传失败</span>
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- ============ 底部操作栏 ============ -->
		<template #footer>
			<div class="file-upload__footer">
				<span class="file-upload__footer-count">
					已上传 <b>{{ doneItems.length }}</b
					>{{ maxCount !== Infinity ? '/' + maxCount : '' }} 个文件
				</span>
				<div class="file-upload__footer-actions">
					<a-button @click="handleCancel">取消</a-button>
					<a-button type="primary" :disabled="doneItems.length === 0" @click="handleConfirm">确定</a-button>
				</div>
			</div>
		</template>
	</Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { InboxOutlined, CheckCircleOutlined, CloseOutlined } from '@ant-design/icons-vue'
import { Upload, Alert, Modal } from 'ant-design-vue'
import type { Component as VueComponent } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'

const UploadDragger: VueComponent = (Upload as any).Dragger
import { defHttp } from '@/utils/http/axios'
import { useGlobSetting } from '@/hooks/setting'
import { fileUploadApi } from '@/api/sys/upload.api'
import { UploadStatusEnum } from './types'
import type { FileUploadItem } from './types'
import { isImageLike, readFileAsDataUrl, normalizeUploadResponse, isSuccessCode, formatFileSize, createFileItem } from './helper'

defineOptions({ name: 'FileUpload' })

const { uploadUrl = '' } = useGlobSetting()
const { createMessage } = useMessage()

// ===================== Props =====================

const props = defineProps({
	/** 弹窗是否打开 */
	open: { type: Boolean, default: false },
	/** 弹窗标题 */
	title: { type: String, default: '文件上传' },
	accept: { type: Array as () => string[], default: () => [] },
	maxSize: { type: Number, default: 10 },
	maxSizeUnit: { type: String as () => 'B' | 'KB' | 'MB' | 'GB', default: 'MB' },
	maxCount: { type: Number, default: 10 },
	multiple: { type: Boolean, default: true },
	disabled: { type: Boolean, default: false },
	/** 上传超时时间，单位毫秒，默认 0 表示不限制 */
	timeout: { type: Number, default: 0 },
	uploadApiUrl: { type: String, default: '' },
	name: { type: String, default: 'file' },
	uploadParams: { type: Object as () => Recordable, default: () => ({}) },
	resultField: { type: String, default: '' },
	helpText: { type: String, default: '' },
	showHelpText: { type: Boolean, default: true },
	api: { type: Function, default: fileUploadApi },
})

const emit = defineEmits<{
	'update:open': [val: boolean]
	/** 确认：返回所有上传成功的文件列表 */
	confirm: [items: FileUploadItem[]]
	/** 取消 */
	cancel: []
	uploaded: [item: FileUploadItem]
	'upload-error': [payload: { item: FileUploadItem; error: any }]
}>()

// ===================== 状态 =====================

const uploadingItems = ref<FileUploadItem[]>([])
const doneItems = ref<FileUploadItem[]>([])

// ===================== 计算属性 =====================

const stringAccept = computed(() => {
	if (!props.accept || props.accept.length === 0) return undefined
	return props.accept
		.map((item) => {
			if (item.includes('/') || item.startsWith('.')) return item
			return '.' + item
		})
		.join(',')
})

const normalizedMaxSizeUnit = computed(() => {
	const unit = String(props.maxSizeUnit || 'MB').toUpperCase()
	return ['B', 'KB', 'MB', 'GB'].includes(unit) ? unit : 'MB'
})

const displayMaxSize = computed(() => {
	const value = Number(props.maxSize)
	if (Number.isNaN(value)) return props.maxSize
	return Number.isInteger(value)
		? value
		: value
				.toFixed(2)
				.replace(/\.0+$/, '')
				.replace(/(\.\d*[1-9])0+$/, '$1')
})

const maxSizeInBytes = computed(() => {
	const value = Number(props.maxSize)
	if (Number.isNaN(value)) return 0
	const unitFactorMap: Record<string, number> = {
		B: 1,
		KB: 1024,
		MB: 1024 * 1024,
		GB: 1024 * 1024 * 1024,
	}
	return value * (unitFactorMap[normalizedMaxSizeUnit.value] || 1024 * 1024)
})

const computedHelpText = computed(() => {
	if (props.helpText) return props.helpText
	const texts: string[] = []
	if (props.accept.length > 0) {
		texts.push('支持 ' + props.accept.join('、') + ' 格式')
	}
	if (props.maxSize) {
		texts.push('单个文件不超过 ' + props.maxSize + props.maxSizeUnit)
	}
	if (props.maxCount !== Infinity) {
		texts.push('最多上传 ' + props.maxCount + ' 个文件')
	}
	return texts.join('，') || ''
})

const maxCountReached = computed(() => doneItems.value.length >= props.maxCount)

// ===================== 弹窗开关（v-model 双向绑定） =====================

const modalOpen = computed({
	get: () => props.open,
	set: (val: boolean) => emit('update:open', val),
})

// ===================== 弹窗打开时重置状态 =====================

watch(
	() => props.open,
	(val) => {
		if (val) {
			// 打开弹窗时清空本次上传记录
			uploadingItems.value = []
			doneItems.value = []
		}
	},
)

// ===================== 弹窗操作 =====================

function handleConfirm() {
	emit('confirm', [...doneItems.value])
	emit('update:open', false)
}

function handleCancel() {
	emit('cancel')
	emit('update:open', false)
}

function removeDoneItem(uid: string) {
	const idx = doneItems.value.findIndex((f) => f.uid === uid)
	if (idx !== -1) doneItems.value.splice(idx, 1)
}

// ===================== 文件校验 =====================

function validateFile(file: File): boolean {
	// 大小校验
	if (props.maxSize && file.size > maxSizeInBytes.value) {
		createMessage.error('文件 "' + file.name + '" 超过 ' + displayMaxSize.value + normalizedMaxSizeUnit.value + ' 限制')
		return false
	}
	// 文件名逗号校验
	if (file.name.includes(',')) {
		createMessage.error('文件名不正确，不能包含英文逗号!')
		return false
	}
	// 类型校验
	if (props.accept && props.accept.length > 0) {
		const fileName = file.name.toLowerCase()
		const fileType = file.type.toLowerCase()
		const matched = props.accept.some((rule) => {
			if (rule.includes('/')) {
				if (rule.endsWith('/*')) {
					const prefix = rule.replace('/*', '')
					return fileType.startsWith(prefix + '/')
				}
				return fileType === rule
			}
			const ext = rule.startsWith('.') ? rule : '.' + rule
			return fileName.endsWith(ext)
		})
		if (!matched) {
			createMessage.error('文件 "' + file.name + '" 格式不支持，允许：' + props.accept.join(', '))
			return false
		}
	}
	return true
}

// ===================== 上传处理 =====================

/** 更新上传进度（通过响应式数组索引，确保触发视图更新） */
function updateItemProgress(uid: string, percent: number) {
	const idx = uploadingItems.value.findIndex((f) => f.uid === uid)
	if (idx !== -1) {
		uploadingItems.value[idx].percent = percent
	}
}

/** 更新上传项字段（通过响应式数组索引） */
function updateItem(uid: string, updates: Partial<FileUploadItem>) {
	const idx = uploadingItems.value.findIndex((f) => f.uid === uid)
	if (idx !== -1) {
		Object.assign(uploadingItems.value[idx], updates)
	}
}

async function handleBeforeUpload(file: File): Promise<boolean> {
	return validateFile(file)
}

async function handleCustomRequest(options: Recordable) {
	const { file, onSuccess, onError } = options as any
	if (!validateFile(file)) {
		onError?.(new Error('文件校验失败'))
		return
	}

	const item = createFileItem(file)
	item.status = UploadStatusEnum.UPLOADING
	item.percent = 0
	uploadingItems.value.push(item)

	const uid = item.uid

	try {
		let response: any
    // const response = await defHttp.uploadFile(
		// 	{
		// 		url: 'https://file.beambox.app/oss/upload',
		// 		onUploadProgress: (progressEvent: any) => {
		// 			if (progressEvent.lengthComputable && progressEvent.total > 0) {
		// 				const percent = Math.min(99, Math.round((progressEvent.loaded / progressEvent.total) * 100))
		// 				updateItemProgress(uid, percent)
		// 			}
		// 		},
		// 	},
		// 	{
		// 		name: props.name,
		// 		file: item.file!,
		// 		filename: item.file?.name,
		// 		data: { ...(props.uploadParams || {}) },
		// 	},
		// )
		if (props.uploadApiUrl) {
			response = await defHttp.uploadFile(
				{
					url: uploadUrl + props.uploadApiUrl,
					timeout: props.timeout,
					onUploadProgress: (progressEvent: any) => {
						console.log('[FileUpload] progress event:', {
							lengthComputable: progressEvent.lengthComputable,
							loaded: progressEvent.loaded,
							total: progressEvent.total,
							event: progressEvent,
						})
						if (progressEvent.lengthComputable && progressEvent.total > 0) {
							const percent = Math.min(99, Math.round((progressEvent.loaded / progressEvent.total) * 100))
							console.log('[FileUpload] percent:', percent)
							updateItemProgress(uid, percent)
						} else {
							console.warn('[FileUpload] progress 不可计算 — lengthComputable:', progressEvent.lengthComputable, 'total:', progressEvent.total)
						}
					},
				},
				{
					name: props.name,
					file: item.file!,
					filename: item.file?.name,
					data: { ...(props.uploadParams || {}) },
				},
			)
		} else if (props.api) {
			response = await props.api(
				{
					name: props.name,
					file: item.file,
					filename: item.file?.name,
					data: { ...(props.uploadParams || {}) },
				},
				(progressEvent: any) => {
					console.log('[FileUpload] progress event (api):', {
						lengthComputable: progressEvent.lengthComputable,
						loaded: progressEvent.loaded,
						total: progressEvent.total,
						event: progressEvent,
					})
					if (progressEvent.lengthComputable && progressEvent.total > 0) {
						const percent = Math.min(99, Math.round((progressEvent.loaded / progressEvent.total) * 100))
						console.log('[FileUpload] percent (api):', percent)
						updateItemProgress(uid, percent)
					} else {
						console.warn('[FileUpload] progress 不可计算 (api) — lengthComputable:', progressEvent.lengthComputable, 'total:', progressEvent.total)
					}
				},
				props.timeout,
			)
		} else {
			throw new Error('uploadApiUrl 和 api 至少需要提供一个')
		}

		const responseData = response?.data || response || {}
		const data = responseData?.data || responseData
		const bizCode = data?.code ?? responseData?.code

		if (bizCode !== undefined && !isSuccessCode(bizCode)) {
			throw new Error(data?.message || data?.msg || '上传失败')
		}

		const result = normalizeUploadResponse(response, item.file!, props.resultField)
		if (!result.url) {
			throw new Error('上传接口未返回文件地址')
		}

		// 通过响应式数组更新字段
		updateItem(uid, {
			url: result.url,
			name: result.name || item.name,
			size: Number(result.size) || item.size,
			status: UploadStatusEnum.DONE,
			percent: 100,
		})

		// 图片类生成缩略图
		if (isImageLike(item.fileType) && item.file) {
			try {
				const thumbUrl = await readFileAsDataUrl(item.file)
				updateItem(uid, { thumbUrl })
			} catch {
				updateItem(uid, { thumbUrl: result.url })
			}
		} else if (isImageLike(item.fileType) && !item.thumbUrl) {
			updateItem(uid, { thumbUrl: result.url })
		}

		// 从进度列表移除，加入已完成列表
		const idx = uploadingItems.value.findIndex((f) => f.uid === uid)
		if (idx !== -1) {
			const [doneItem] = uploadingItems.value.splice(idx, 1)
			doneItems.value.push(doneItem)
		}

		onSuccess?.(item.response)
		emit('uploaded', { ...item, url: result.url, name: result.name || item.name } as FileUploadItem)
	} catch (error: any) {
		updateItem(uid, { status: UploadStatusEnum.ERROR })
		// 超时 / 网络错误由 axios 拦截器统一提示，这里跳过
		const isTimeoutOrNetwork =
			error?.code === 'ECONNABORTED' ||
			error?.message?.includes('Network Error') ||
			error?.message?.includes('timeout');
		// HTTP 层错误由拦截器统一提示，这里只处理业务层错误
		if (!error?.response && !isTimeoutOrNetwork) {
			createMessage.error(error?.message || '文件上传失败')
		}
		onError?.(new Error('上传失败'))
		emit('upload-error', { item: { ...item, status: UploadStatusEnum.ERROR } as FileUploadItem, error })

		// 3秒后从进度列表移除失败项
		setTimeout(() => {
			const idx = uploadingItems.value.findIndex((f) => f.uid === uid)
			if (idx !== -1) uploadingItems.value.splice(idx, 1)
		}, 3000)
	}
}
</script>

<style lang="scss" scoped>
$border-color: #dcdfe6;
$border-color-dark: #303030;
$primary-color: #409eff;
$danger-color: #f56c6c;
$success-color: #67c23a;

.file-upload {
	&--disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	&__help {
		margin-bottom: 12px;
	}
}

/* ==================== 已完成文件列表 ==================== */
.file-upload__done-list {
	margin-bottom: 12px;
	max-height: 180px;
	overflow-y: auto;
	overflow-x: hidden;
	background: #f6ffed;
	border-radius: 8px;
	border: 1px solid #b7eb8f;
	padding: 8px 12px;
}

.file-upload__done-item {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 4px 0;
	font-size: 13px;

	& + & {
		border-top: 1px solid #d9f7be;
		margin-top: 4px;
		padding-top: 8px;
	}
}

.file-upload__done-icon {
	color: $success-color;
	font-size: 14px;
	flex-shrink: 0;
}

.file-upload__done-name {
	flex: 1;
	color: #303133;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	min-width: 0;
}

.file-upload__done-size {
	color: #909399;
	font-size: 12px;
	flex-shrink: 0;
}

.file-upload__done-remove {
	color: #c0c4cc;
	font-size: 12px;
	cursor: pointer;
	flex-shrink: 0;
	padding: 2px;

	&:hover {
		color: $danger-color;
	}
}

/* ==================== 已达上限提示 ==================== */
.file-upload__max-tip {
	margin-bottom: 12px;
}

/* ==================== 拖拽上传区域 ==================== */
.file-upload__drag-area {
	margin-bottom: 16px;
}

.file-upload__dragger {
	:deep(.ant-upload-drag) {
		border: 2px dashed $border-color;
		border-radius: 6px;
		background: #fafafa;
		cursor: pointer;
		transition:
			border-color 0.2s,
			background-color 0.2s,
			border-width 0.2s;

		&:hover {
			border-color: $primary-color;
			background: #f0f7ff;
		}
	}

	// 拖拽文件悬停时的样式
	:deep(.ant-upload-drag-hover),
	:deep(.ant-upload.ant-upload-drag-hover) {
		border-color: $primary-color !important;
		background: #e6f4ff !important;
	}

	:deep(.ant-upload-drag-hover .ant-upload-drag) {
		border-color: $primary-color;
		background: #e6f4ff;
	}
}

.file-upload__drag-icon {
	font-size: 48px;
	color: #8c939d;
	margin-bottom: 8px;
}

.file-upload__drag-text {
	font-size: 14px;
	color: #606266;
	margin: 0 0 4px;

	em {
		color: $primary-color;
		font-style: normal;
	}
}

.file-upload__drag-tip {
	font-size: 12px;
	color: #909399;
	margin: 0;

	b {
		color: $danger-color;
	}
}

/* ==================== 上传进度列表 ==================== */
.file-upload__progress-list {
	margin-bottom: 12px;
	max-height: 220px;
	overflow-y: auto;
	overflow-x: hidden;
	background: #fafafa;
	border-radius: 8px;
	border: 1px solid $border-color;
	padding: 8px 12px;
}

.file-upload__progress-item {
	background: #fff;
	border-radius: 4px;
	padding: 8px 12px;
	margin-bottom: 8px;
	border: 1px solid #ebeef5;

	&:last-child {
		margin-bottom: 0;
	}
}

.file-upload__progress-file-info {
	display: flex;
	justify-content: space-between;
	margin-bottom: 6px;
}

.file-upload__progress-file-name {
	font-size: 12px;
	color: #303133;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	flex: 1;
	max-width: calc(100% - 75px);
}

.file-upload__progress-file-size {
	font-size: 11px;
	color: #909399;
	margin-left: 10px;
	white-space: nowrap;
}

.file-upload__progress-bar-wrap {
	display: flex;
	align-items: center;
}

.file-upload__progress-bar {
	flex: 1;
	height: 6px;
	background: #ebeef5;
	border-radius: 3px;
	overflow: hidden;
	min-width: 0;
}

.file-upload__progress-inner {
	height: 100%;
	background: $primary-color;
	border-radius: 3px;
	transition: width 0.3s;
}

.file-upload__progress-text {
	width: 65px;
	text-align: right;
	font-size: 12px;
	color: #606266;
	margin-left: 8px;
	flex-shrink: 0;

	&--success {
		color: $success-color;
	}

	&--error {
		color: $danger-color;
	}
}

/* ==================== 底部操作栏 ==================== */
.file-upload__footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.file-upload__footer-count {
	font-size: 13px;
	color: #909399;

	b {
		color: $primary-color;
	}
}

.file-upload__footer-actions {
	display: flex;
	gap: 8px;
}

/* ==================== 暗色主题适配 ==================== */
html[data-theme='dark'] {
	.file-upload {
		/* 已完成文件列表 */
		&__done-list {
			background: #0d1f14;
			border-color: #1a4d2e;
		}

		&__done-item {
			& + & {
				border-top-color: #1a3a26;
			}
		}

		&__done-name {
			color: #e6edf3;
		}

		&__done-size {
			color: #6e7681;
		}

		&__done-remove {
			color: #6e7681;
			&:hover {
				color: $danger-color;
			}
		}

		/* 拖拽区域 */
		&__dragger {
			:deep(.ant-upload-drag) {
				border-color: #30363d;
				background: #161b22;

				&:hover {
					border-color: $primary-color;
					background: #0d2137;
				}
			}

			:deep(.ant-upload-drag-hover),
			:deep(.ant-upload.ant-upload-drag-hover) {
				border-color: $primary-color !important;
				background: #0d2137 !important;
			}
		}

		&__drag-icon {
			color: #6e7681;
		}

		&__drag-text {
			color: #c9d1d9;
		}

		&__drag-tip {
			color: #8b949e;
		}

		/* 进度列表 */
		&__progress-list {
			background: #161b22;
			border-color: #30363d;
		}

		&__progress-item {
			background: #0d1117;
			border-color: #21262d;
		}

		&__progress-file-name {
			color: #e6edf3;
		}

		&__progress-file-size {
			color: #6e7681;
		}

		&__progress-bar {
			background: #21262d;
		}

		&__progress-text {
			color: #c9d1d9;
		}

		/* 底部 */
		&__footer-count {
			color: #8b949e;
		}
	}
}
</style>
