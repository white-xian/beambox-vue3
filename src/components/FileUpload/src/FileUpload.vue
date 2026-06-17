<!-- @format -->

<template>
	<Modal :open="props.open" :title="title" :width="560" :destroy-on-close="false" :mask-closable="false" centered wrap-class-name="file-upload-modal" @cancel="handleCancel">
		<div class="file-upload" :class="{ 'file-upload--disabled': disabled }">
			<!-- ============ 提示信息 ============ -->
			<div v-if="computedHelpText" class="file-upload__help">
				<Alert :message="computedHelpText" type="info" banner />
			</div>

			<!-- ============ 已完成文件列表 ============ -->
			<div v-if="doneItems.length > 0" class="file-upload__done-list">
				<div class="file-upload__done-item" v-for="item in doneItems" :key="item.uid">
					<CheckCircleOutlined class="file-upload__done-icon" />
					<span class="file-upload__done-name" :title="item.name">{{ item.name }}</span>
					<span class="file-upload__done-size">{{ formatFileSize(item.size) }}</span>
					<CloseOutlined class="file-upload__done-remove" @click="handleRemoveDone(item.uid)" />
				</div>
			</div>

			<!-- ============ 拖拽上传区域 ============ -->
			<div v-if="!disabled && !maxCountReached" class="file-upload__drag-area">
				<UploadDragger :accept="stringAccept" :multiple="props.maxCount !== 1" :show-upload-list="false" :before-upload="handleBeforeUpload" :custom-request="handleCustomRequest" :disabled="disabled" class="file-upload__dragger">
					<div class="file-upload__drag-icon">
						<InboxOutlined />
					</div>
					<p class="file-upload__drag-text">将文件拖到此处，或<em>点击上传</em></p>
					<p v-if="computedHelpText" class="file-upload__drag-tip">
						<template v-if="maxSize">
							大小不超过 <b>{{ displayMaxSize }}</b>
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
						<CloseOutlined v-if="item.status === 'uploading'" class="file-upload__progress-cancel" @click="handleCancelOne(item.uid)" title="取消此文件上传" />
					</div>
					<div class="file-upload__progress-bar-wrap">
						<div class="file-upload__progress-bar">
							<div class="file-upload__progress-inner" :style="{ width: item.percent + '%' }"></div>
						</div>
						<span class="file-upload__progress-text">
							<template v-if="item.status === 'uploading'">{{ (item.percent || 0).toFixed(2) }}%</template>
							<span v-else-if="item.status === 'done'" class="file-upload__progress-text--success">上传成功</span>
							<template v-else-if="item.status === 'error'">
								<a-button type="link" size="small" class="file-upload__progress-retry" @click="handleRetry(item.uid)">重试</a-button>
								<CloseOutlined class="file-upload__progress-close" @click="handleRemoveError(item.uid)" title="移除" />
							</template>
						</span>
					</div>
					<div v-if="item.status === 'error' && item.errorMessage" class="file-upload__progress-error">
						{{ item.errorMessage }}
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
import { computed, watch } from 'vue'
import { InboxOutlined, CheckCircleOutlined, CloseOutlined } from '@ant-design/icons-vue'
import { Upload, Alert, Modal } from 'ant-design-vue'
import type { Component as VueComponent } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'
import { useUploadCore, type UploadApiFn } from './hooks/useUploadCore'
import { formatFileSize, parseMaxSize } from './helper'
import type { FileUploadItem } from './types'

// ---- ant-design-vue 类型兼容 ----
const UploadDragger: VueComponent = (Upload as any).Dragger

defineOptions({ name: 'FileUpload' })

// ============================================================
// Props
// ============================================================

const props = defineProps({
	open: { type: Boolean, default: false },
	title: { type: String, default: '文件上传' },
	accept: { type: Array as () => string[], default: () => [] },
	/**
	 * 单个文件最大体积
	 * - 数字 → MB（兼容旧版）  - 字符串 → '10MB' / '500KB' / '2GB'
	 */
	maxSize: { type: [Number, String], default: '10MB' },
	/** 最大文件数，1 = 单文件模式，>1 = 多文件模式 */
	maxCount: { type: Number, default: 10 },
	disabled: { type: Boolean, default: false },
	/**
	 * 超时时间（毫秒），undefined = 不限制
	 */
	timeout: { type: Number, default: undefined },
	/**
	 * 上传方式
	 * - string → 上传接口路径
	 * - function → 自定义上传函数
	 */
	upload: { type: [String, Function], default: '/file/oss/upload' },
	/** 表单文件字段名 */
	name: { type: String, default: 'file' },
	uploadParams: { type: Object as () => Recordable, default: () => ({}) },
	resultField: { type: String, default: '' },
	/**
	 * 提示文字
	 * - true（默认）→ 自动生成
	 * - string → 自定义文字
	 * - false → 不显示
	 */
	helpText: { type: [Boolean, String], default: true },
})

// ============================================================
// Emits
// ============================================================

const emit = defineEmits<{
	'update:open': [val: boolean]
	/** 用户点击确定，携带所有上传成功的文件 */
	confirm: [items: FileUploadItem[]]
	/** 用户点击取消 */
	cancel: []
	uploaded: [item: FileUploadItem]
	'upload-error': [payload: { item: FileUploadItem; error: unknown }]
}>()

const { createMessage } = useMessage()

// ============================================================
// 核心逻辑（委托给 composable）
// ============================================================

const {
	uploadingItems,
	doneItems,
	upload,
	cancelAll,
	cancelOne,
	retry,
	reset,
	removeDone,
	removeError,
	validateFile,
} = useUploadCore({
	upload: props.upload as string | UploadApiFn | undefined,
	name: props.name,
	uploadParams: props.uploadParams,
	resultField: props.resultField,
	maxSize: props.maxSize,
	accept: props.accept as string[],
	timeout: props.timeout,
})

// ============================================================
// 弹窗状态
// ============================================================

/** 关闭弹窗（由确认/取消操作调用，不由 Modal 自身控制） */
function closeModal() {
	emit('update:open', false)
}

/**
 * 弹窗打开时重置状态，关闭时取消所有上传
 *
 * 这确保了：
 * - 每次打开弹窗都是全新的上传会话
 * - 关闭弹窗（任何方式）都会中止进行中的请求
 */
watch(
	() => props.open,
	(val) => {
		if (val) {
			reset()
		} else {
			cancelAll()
		}
	},
)

// ============================================================
// 计算属性（UI 相关）
// ============================================================

const stringAccept = computed(() => {
	if (!props.accept || props.accept.length === 0) return undefined
	return props.accept
		.map((item) => (item.includes('/') || item.startsWith('.') ? item : '.' + item))
		.join(',')
})

const maxSizeParsed = computed(() => parseMaxSize(props.maxSize))
const displayMaxSize = computed(() => maxSizeParsed.value.display)

const computedHelpText = computed(() => {
	const h = props.helpText
	// false → 不显示
	if (h === false) return ''
	// 自定义字符串 → 直接使用
	if (typeof h === 'string' && h.length > 0) return h
	// true / 空字符串 → 自动生成
	const texts: string[] = []
	if (props.accept.length > 0) {
		texts.push('支持 ' + props.accept.join('、') + ' 格式')
	}
	if (props.maxSize) {
		texts.push('单个文件不超过 ' + displayMaxSize.value)
	}
	if (props.maxCount !== Infinity) {
		texts.push('最多上传 ' + props.maxCount + ' 个文件')
	}
	return texts.join('，') || ''
})

const maxCountReached = computed(() => doneItems.value.length >= props.maxCount)

// ============================================================
// 操作
// ============================================================

function handleConfirm() {
	emit('confirm', [...doneItems.value])
	closeModal()
}

/**
 * 取消操作：
 * - 无已上传文件且无进行中上传 → 直接关闭
 * - 有已上传文件或有进行中上传 → 弹确认框防止误操作
 *
 * watch(open → false) 会自动调用 cancelAll() 在后台清理，
 * 避免用户看到「进度条先消失再关弹窗」的中间状态。
 */
async function handleCancel() {
	const hasDone = doneItems.value.length > 0
	const hasUploading = uploadingItems.value.length > 0

	if (hasDone || hasUploading) {
		const parts: string[] = []
		if (hasUploading) parts.push('有文件正在上传')
		if (hasDone) parts.push(`有 ${doneItems.value.length} 个已上传的文件尚未保存`)
		const content = parts.join('，') + '，关闭弹窗将丢失这些内容。'

		try {
			await new Promise<void>((resolve, reject) => {
				Modal.confirm({
					centered: true,
					title: '确认取消',
					content,
					okText: '确定关闭',
					okType: 'danger',
					cancelText: '继续操作',
					onOk: () => resolve(),
					onCancel: () => reject(),
				})
			})
		} catch {
			return // 用户点了「继续操作」，不关闭
		}
	}

	emit('cancel')
	closeModal()
}

function handleRemoveDone(uid: string) {
	removeDone(uid)
}

/** 取消单个上传项 */
function handleCancelOne(uid: string) {
	cancelOne(uid)
}

/** 重试失败的上传 */
function handleRetry(uid: string) {
	retry(uid)
}

/** 手动关闭错误项（从进度列表移除，不触发上传） */
function handleRemoveError(uid: string) {
	removeError(uid)
}

// ============================================================
// ant-design-vue Upload 适配
// ============================================================

/**
 * beforeUpload 钩子 — 仅做校验，返回 false 阻止 antd 默认上传行为
 * 实际上传由 customRequest 接管
 */
async function handleBeforeUpload(file: File): Promise<boolean> {
	const result = validateFile(file)
	if (!result.valid) {
		createMessage.error(result.message!)
	}
	return result.valid || (Upload as any).LIST_IGNORE
}

/**
 * customRequest 钩子 — 接管上传流程，委托给 useUploadCore
 */
async function handleCustomRequest(options: Recordable) {
	const { file, onSuccess, onError } = options as {
		file: File
		onSuccess?: (body: unknown) => void
		onError?: (err: Error) => void
	}

	try {
		const result = await upload(file)
		if (result !== null) {
			// 上传成功
			onSuccess?.(result.response ?? {})
			emit('uploaded', result)
		}
		// result === null 意味着用户取消，静默处理
	} catch (error: unknown) {
		onError?.(new Error('上传失败'))
		emit('upload-error', {
			item: { name: file.name, size: file.size } as FileUploadItem,
			error,
		})
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

.file-upload__progress-cancel {
	color: #c0c4cc;
	font-size: 12px;
	cursor: pointer;
	flex-shrink: 0;
	margin-left: 6px;
	padding: 2px;

	&:hover {
		color: $danger-color;
	}
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
	width: auto;
	min-width: 65px;
	text-align: right;
	font-size: 12px;
	color: #606266;
	margin-left: 8px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	gap: 4px;

	&--success {
		color: $success-color;
	}

	&--error {
		color: $danger-color;
	}
}

.file-upload__progress-retry {
	padding: 0 4px;
	font-size: 12px;
	height: auto;
}

.file-upload__progress-close {
	color: #c0c4cc;
	font-size: 12px;
	cursor: pointer;
	flex-shrink: 0;
	padding: 2px;

	&:hover {
		color: $danger-color;
	}
}

.file-upload__progress-error {
	margin-top: 6px;
	font-size: 12px;
	color: $danger-color;
	line-height: 1.4;
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

		&__progress-cancel {
			color: #484f58;
			&:hover {
				color: $danger-color;
			}
		}

		&__progress-close {
			color: #484f58;
			&:hover {
				color: $danger-color;
			}
		}

		&__progress-error {
			color: #f85149;
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
