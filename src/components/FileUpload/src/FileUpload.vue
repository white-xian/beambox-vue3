<!-- @format -->

<template>
	<div class="file-upload" :class="{ 'file-upload--disabled': disabled }">
		<!-- ============ 提示信息 ============ -->
		<div v-if="showHelpText && computedHelpText" class="file-upload__help">
			<Alert :message="computedHelpText" type="info" banner />
		</div>
		<!-- ============ 单文件模式 ============ -->
		<template v-if="mode === 'single'">
			<div class="file-upload__single">
				<!-- 无文件：显示上传触发区域 -->
				<template v-if="!currentFile">
					<Upload :accept="stringAccept" :multiple="false" :show-upload-list="false" :before-upload="handleBeforeUpload" :custom-request="handleCustomRequest" :disabled="disabled">
						<div class="file-upload__trigger" :class="triggerClass">
							<slot name="trigger">
								<div class="file-upload__trigger-content">
									<FileOutlined class="file-upload__trigger-icon" />
									<span class="file-upload__trigger-text">{{ uploadText }}</span>
								</div>
							</slot>
						</div>
					</Upload>
				</template>
				<!-- 有文件：展示区域 -->
				<template v-else>
					<div class="file-upload__preview-area" :class="[triggerClass, { 'file-upload__preview-area--clickable': previewable && checkPreviewable(currentFile.fileType) }]" @click="handlePreviewClick">
						<!-- 图片 / GIF 缩略图 -->
						<template v-if="isImageLike(currentFile.fileType)">
							<div
								class="file-upload__thumb"
								:class="{
									'file-upload__thumb--gif-mono': currentFile.fileType === 'gif' && gifMonoEffect,
								}"
								:style="gifMonoStyle"
							>
								<img :src="currentFile.thumbUrl || currentFile.url" :alt="currentFile.name" />
							</div>
						</template>
						<!-- 视频缩略图 -->
						<template v-else-if="currentFile.fileType === 'video'">
							<div class="file-upload__thumb file-upload__thumb--video">
								<video v-if="currentFile.thumbUrl || currentFile.url" muted preload="metadata">
									<source :src="currentFile.thumbUrl || currentFile.url" />
								</video>
								<PlayCircleOutlined class="file-upload__video-play" />
							</div>
						</template>
						<!-- 音频 / 文档 / 其他（只显示图标，详细信息在下方 info 区域） -->
						<template v-else>
							<div class="file-upload__thumb file-upload__thumb--file">
								<component :is="fileIconComp" class="file-upload__file-icon" />
							</div>
						</template>
						<!-- 上传进度遮罩 -->
						<div v-if="currentFile.status === 'uploading'" class="file-upload__progress-overlay">
							<Progress type="circle" :percent="currentFile.percent" :width="56" />
							<span class="file-upload__progress-name">{{ currentFile.name }}</span>
						</div>
						<!-- 操作按钮层 -->
						<div v-if="currentFile.status === 'done' && !disabled" class="file-upload__actions">
							<!-- 预览按钮 -->
							<a-button v-if="previewable && checkPreviewable(currentFile.fileType)" size="small" type="link" class="file-upload__action-btn" @click.stop="handlePreview(currentFile)">
								<EyeOutlined />
							</a-button>
							<!-- 替换按钮 -->
							<Upload v-if="replaceable" :accept="stringAccept" :multiple="false" :show-upload-list="false" :before-upload="handleBeforeUpload" :custom-request="handleCustomRequest" :disabled="disabled">
								<a-button size="small" type="link" class="file-upload__action-btn" @click.stop>
									<SwapOutlined />
								</a-button>
							</Upload>
							<!-- 删除按钮 -->
							<a-button v-if="showDelete" size="small" type="link" danger class="file-upload__action-btn" @click.stop="handleRemove(currentFile)">
								<DeleteOutlined />
							</a-button>
						</div>
						<!-- 上传失败操作 -->
						<div v-if="currentFile.status === 'error'" class="file-upload__actions">
							<a-button size="small" type="link" class="file-upload__action-btn" @click.stop="handleRetry(currentFile)">
								<ReloadOutlined />
							</a-button>
							<a-button v-if="showDelete" size="small" type="link" danger class="file-upload__action-btn" @click.stop="handleRemove(currentFile)">
								<DeleteOutlined />
							</a-button>
						</div>
					</div>
					<!-- 文件名显示 -->
					<div class="file-upload__info">
						<span class="file-upload__info-name" :title="currentFile.name">{{ currentFile.name }}</span>
						<span v-if="showSize && currentFile.size" class="file-upload__info-size">{{ formatFileSize(currentFile.size) }}</span>
					</div>
				</template>
			</div>
		</template>
		<!-- ============ 多文件模式 ============ -->
		<template v-else>
			<div class="file-upload__multiple">
				<div class="file-upload__list">
					<!-- 已有文件项 -->
					<div
						v-for="item in fileList"
						:key="item.uid"
						class="file-upload__list-item"
						:class="{
							'file-upload__list-item--uploading': item.status === 'uploading',
							'file-upload__list-item--error': item.status === 'error',
						}"
					>
						<!-- 图片 / GIF -->
						<template v-if="isImageLike(item.fileType)">
							<div class="file-upload__list-thumb" :class="{ 'file-upload__list-thumb--gif-mono': item.fileType === 'gif' && gifMonoEffect }" :style="gifMonoStyle">
								<img :src="item.thumbUrl || item.url" :alt="item.name" />
							</div>
						</template>
						<!-- 视频 -->
						<template v-else-if="item.fileType === 'video'">
							<div class="file-upload__list-thumb file-upload__list-thumb--video">
								<video v-if="item.thumbUrl || item.url" muted preload="metadata">
									<source :src="item.thumbUrl || item.url" />
								</video>
								<PlayCircleOutlined class="file-upload__list-video-play" />
							</div>
						</template>
						<!-- 其他文件 -->
						<template v-else>
							<div class="file-upload__list-thumb file-upload__list-thumb--file">
								<component :is="getFileIcon(item)" class="file-upload__list-file-icon" />
							</div>
						</template>
						<!-- 进度条 -->
						<div v-if="item.status === 'uploading'" class="file-upload__list-progress">
							<Progress type="circle" :percent="item.percent" :width="48" :stroke-width="6" />
						</div>
						<!-- 操作按钮 -->
						<div v-if="item.status === 'done' && !disabled" class="file-upload__list-actions">
							<EyeOutlined v-if="previewable && checkPreviewable(item.fileType)" class="file-upload__list-action-icon" @click.stop="handlePreview(item)" />
							<SwapOutlined v-if="replaceable" class="file-upload__list-action-icon" @click.stop="handleReplaceItem(item)" />
							<DeleteOutlined v-if="showDelete" class="file-upload__list-action-icon file-upload__list-action-icon--danger" @click.stop="handleRemove(item)" />
						</div>
						<div v-if="item.status === 'error'" class="file-upload__list-actions">
							<ReloadOutlined class="file-upload__list-action-icon" @click.stop="handleRetry(item)" />
							<DeleteOutlined v-if="showDelete" class="file-upload__list-action-icon file-upload__list-action-icon--danger" @click.stop="handleRemove(item)" />
						</div>
						<!-- 文件名 -->
						<div class="file-upload__list-name" :title="item.name">{{ item.name }}</div>
						<div v-if="showSize && item.size" class="file-upload__list-size">{{ formatFileSize(item.size) }}</div>
					</div>
					<!-- 添加按钮（仅按已完成数量判断上限） -->
					<div v-if="doneFileCount < maxNumber && !disabled" class="file-upload__list-item file-upload__list-item--add">
						<Upload :accept="stringAccept" :multiple="true" :show-upload-list="false" :before-upload="handleBeforeUpload" :custom-request="handleCustomRequest" :disabled="disabled">
							<div class="file-upload__list-add">
								<PlusOutlined />
								<span>{{ uploadText }}</span>
							</div>
						</Upload>
					</div>
				</div>
			</div>
		</template>
		<!-- ============ 隐藏的文件替换上传器（多文件模式下替换用） ============ -->
		<Upload v-if="mode === 'multiple' && pendingReplaceItem" ref="replaceUploadRef" :accept="stringAccept" :multiple="false" :show-upload-list="false" :before-upload="handleBeforeUpload" :custom-request="(opt: any) => handleReplaceUpload(opt, pendingReplaceItem!)" :disabled="disabled" style="display: none" />
		<!-- ============ 预览弹窗 ============ -->
		<FilePreviewModal v-model:open="previewOpen" :file="previewFile" :gif-mono-effect="gifMonoEffect" :gif-mono-bg="gifMonoBg" @close="handlePreviewClose" />
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { FileOutlined, EyeOutlined, DeleteOutlined, SwapOutlined, ReloadOutlined, PlayCircleOutlined, PlusOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FilePptOutlined, FileTextOutlined, FileZipOutlined, FileUnknownOutlined, AudioOutlined } from '@ant-design/icons-vue'
import { Upload, Progress, Alert, Modal as AModal } from 'ant-design-vue'
import { useMessage } from '@/hooks/web/useMessage'
import { defHttp } from '@/utils/http/axios'
import { isArray, isString, isObject } from '@/utils/core/ObjectUtil'
import { fileUploadProps } from './props'
import { FileTypeEnum, UploadStatusEnum } from './types'
import type { FileUploadItem } from './types'
import { isImageLike, isPreviewable as checkPreviewable, readFileAsDataUrl, normalizeUploadResponse, isSuccessCode, formatFileSize, createFileItem, createFileItemFromUrl } from './helper'
import FilePreviewModal from './FilePreviewModal.vue'

defineOptions({ name: 'FileUpload' })

const props = defineProps(fileUploadProps)
const emit = defineEmits(['update:value', 'change', 'upload-success', 'upload-error', 'delete'])

const { createMessage } = useMessage()

// ===================== 状态 =====================
const fileList = ref<FileUploadItem[]>([])
const previewOpen = ref(false)
const previewFile = ref<FileUploadItem | null>(null)
const pendingReplaceItem = ref<FileUploadItem | null>(null)
const replaceUploadRef = ref<any>(null)
const isInternalChange = ref(false)

// ===================== 计算属性 =====================

/** 已完成文件数量 */
const doneFileCount = computed(() => fileList.value.filter((f) => f.status === UploadStatusEnum.DONE).length)

/** 单文件模式下当前文件 */
const currentFile = computed(() => fileList.value[0] || null)

/** 转为 accept 字符串 */
const stringAccept = computed(() => {
	if (!props.accept || props.accept.length === 0) return undefined
	return props.accept
		.map((item) => {
			if (item.includes('/') || item.startsWith('.')) return item
			return `.${item}`
		})
		.join(',')
})

/** 触发区域样式类 */
const triggerClass = computed(() => ({
	'file-upload__trigger--card': props.listType === 'picture-card',
	'file-upload__trigger--picture': props.listType === 'picture',
	'file-upload__trigger--text': props.listType === 'text',
}))

/** 提示文本 */
const computedHelpText = computed(() => {
	if (props.helpText) return props.helpText
	const texts: string[] = []
	if (props.accept.length > 0) {
		texts.push(`支持 ${props.accept.join('、')} 格式`)
	}
	if (props.maxSize) {
		texts.push(`单个文件不超过 ${props.maxSize}MB`)
	}
	if (props.mode === 'multiple' && props.maxNumber !== Infinity) {
		texts.push(`最多上传 ${props.maxNumber} 个文件`)
	}
	return texts.join('，') || ''
})

/** GIF 黑白特效样式 */
const gifMonoStyle = computed(() => {
	if (!props.gifMonoEffect) return {}
	return {
		mixBlendMode: 'difference',
		background: props.gifMonoBg,
	} as Record<string, string>
})

/** 根据文件类型返回对应图标组件 */
function getFileIcon(item: FileUploadItem) {
	const ext = (item.name || '').split('.').pop()?.toLowerCase()
	const type = item.type?.toLowerCase() || ''
	if (ext === 'pdf' || type.includes('pdf')) return FilePdfOutlined
	if (ext === 'doc' || ext === 'docx' || type.includes('word')) return FileWordOutlined
	if (ext === 'xls' || ext === 'xlsx' || type.includes('excel') || type.includes('spreadsheet')) return FileExcelOutlined
	if (ext === 'ppt' || ext === 'pptx' || type.includes('presentation')) return FilePptOutlined
	if (ext === 'zip' || ext === 'rar' || ext === '7z' || ext === 'tar' || ext === 'gz') return FileZipOutlined
	if (ext === 'txt' || ext === 'md' || ext === 'json' || ext === 'xml' || ext === 'csv') return FileTextOutlined
	if (item.fileType === FileTypeEnum.AUDIO) return AudioOutlined
	return FileUnknownOutlined
}

const fileIconComp = computed(() => {
	if (!currentFile.value) return FileUnknownOutlined
	return getFileIcon(currentFile.value)
})

// ===================== 对外暴露方法 =====================

/** 获取当前值（单文件返回 url 字符串，多文件返回 url 数组） */
function getValue(): string | string[] {
	const urls = fileList.value.filter((f) => f.status === UploadStatusEnum.DONE && f.url).map((f) => f.url)
	if (props.mode === 'single') {
		return urls[0] || ''
	}
	return urls
}

function emitChange() {
	const val = getValue()
	isInternalChange.value = true
	emit('update:value', val)
	emit('change', val)
}

// ===================== 文件校验 =====================

function validateFile(file: File): boolean {
	const { maxSize, accept } = props
	// 大小校验
	if (maxSize && file.size / 1024 / 1024 > maxSize) {
		createMessage.error(`文件 "${file.name}" 超过 ${maxSize}MB 限制`)
		return false
	}
	// 类型校验
	if (accept && accept.length > 0) {
		const fileName = file.name.toLowerCase()
		const fileType = file.type.toLowerCase()
		const matched = accept.some((rule) => {
			if (rule.includes('/')) {
				// MIME 类型通配：image/*, video/* 等
				if (rule.endsWith('/*')) {
					const prefix = rule.replace('/*', '')
					return fileType.startsWith(prefix + '/')
				}
				return fileType === rule
			}
			// 后缀匹配
			const ext = rule.startsWith('.') ? rule : `.${rule}`
			return fileName.endsWith(ext)
		})
		if (!matched) {
			createMessage.error(`文件 "${file.name}" 格式不支持，允许：${accept.join(', ')}`)
			return false
		}
	}
	return true
}

// ===================== 上传处理 =====================

async function handleBeforeUpload(file: File): Promise<boolean> {
	if (!validateFile(file)) return false
	return true // 允许继续，走 customRequest
}

async function handleCustomRequest(options: Recordable) {
	const { file, onSuccess, onError } = options as any
	if (!validateFile(file)) {
		onError?.(new Error('文件校验失败'))
		return
	}

	const item = createFileItem(file)
	// 单文件模式：保存旧项以便失败时恢复
	const oldItem = props.mode === 'single' ? fileList.value[0] : undefined

	if (props.mode === 'single') {
		fileList.value = [item]
	} else {
		// 多文件模式：检查已完成数量（不含上传中/失败的）
		const doneCount = fileList.value.filter((f) => f.status === UploadStatusEnum.DONE).length
		if (doneCount >= props.maxNumber) {
			createMessage.warning(`最多只能上传 ${props.maxNumber} 个文件`)
			onError?.(new Error(`最多只能上传 ${props.maxNumber} 个文件`))
			return
		}
		fileList.value.push(item)
	}

	const success = await uploadFile(item)
	if (success) {
		onSuccess?.(item.response)
	} else {
		onError?.(new Error('上传失败'))
		// 单文件模式：恢复旧文件（如果是替换操作），否则清空
		if (props.mode === 'single') {
			fileList.value = oldItem && oldItem.status === UploadStatusEnum.DONE ? [oldItem] : []
		}
	}
	emitChange()
}

/** 执行单文件上传，返回 true 表示成功 */
async function uploadFile(item: FileUploadItem): Promise<boolean> {
	item.status = UploadStatusEnum.UPLOADING
	item.percent = 0

	try {
		// uploadApiUrl 优先：组件内部直接调用 defHttp.uploadFile
		let response: any
		if (props.uploadApiUrl) {
			response = await defHttp.uploadFile(
				{
					url: props.uploadApiUrl,
					onUploadProgress: (progressEvent: any) => {
						const total = progressEvent.total || item.file?.size || 0
						const percent = total ? Math.min(100, Math.round((progressEvent.loaded / total) * 100)) : 0
						item.percent = percent
					},
				},
				{
					name: props.name,
					file: item.file!,
					filename: item.file?.name,
					data: { ...(props.uploadParams || {}) },
				},
			)
		} else {
			response = await props.api(
				{
					name: props.name,
					file: item.file,
					filename: item.file?.name,
					data: { ...(props.uploadParams || {}) },
				},
				(progressEvent: any) => {
					const total = progressEvent.total || item.file?.size || 0
					const percent = total ? Math.min(100, Math.round((progressEvent.loaded / total) * 100)) : 0
					item.percent = percent
				},
			)
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

		item.url = result.url
		item.name = result.name || item.name
		item.size = Number(result.size) || item.size
		item.status = UploadStatusEnum.DONE
		item.percent = 100

		// 图片类生成缩略图
		if (isImageLike(item.fileType) && item.file) {
			try {
				item.thumbUrl = await readFileAsDataUrl(item.file)
			} catch {
				item.thumbUrl = item.url
			}
		} else if (isImageLike(item.fileType) && !item.thumbUrl) {
			item.thumbUrl = item.url
		}

		emit('upload-success', item)
		return true
	} catch (error: any) {
		item.status = UploadStatusEnum.ERROR
		// HTTP 层错误（404/500 等）由拦截器统一提示，这里只处理业务层错误
		if (!error?.response) {
			createMessage.error(error?.message || '文件上传失败')
		}
		emit('upload-error', { item, error })
		return false
	}
}

// ===================== 操作处理 =====================

function handlePreviewClick() {
	if (!currentFile.value) return
	if (!props.previewable || !checkPreviewable(currentFile.value.fileType)) return
	if (currentFile.value.status !== UploadStatusEnum.DONE) return
	handlePreview(currentFile.value)
}

function handlePreview(item: FileUploadItem) {
	previewFile.value = item
	previewOpen.value = true
}

function handlePreviewClose() {
	previewOpen.value = false
	previewFile.value = null
}

async function handleRemove(item: FileUploadItem) {
	const idx = fileList.value.findIndex((f) => f.uid === item.uid)
	if (idx === -1) return
	// 仅已完成文件需要确认删除
	if (item.status === UploadStatusEnum.DONE) {
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
			return // 用户取消
		}
	}
	const [removed] = fileList.value.splice(idx, 1)
	emit('delete', removed)
	emitChange()
}

async function handleRetry(item: FileUploadItem) {
	if (!item.file) {
		createMessage.warning('无法重试：原始文件已丢失')
		return
	}
	await uploadFile(item)
	emitChange()
}

/** 多文件模式：替换某个文件 */
function handleReplaceItem(item: FileUploadItem) {
	pendingReplaceItem.value = item
	// 通过隐藏 Upload 的 template ref 触发文件选择
	nextTick(() => {
		const input = replaceUploadRef.value?.$el?.querySelector('input[type="file"]') as HTMLInputElement
		input?.click()
	})
}

async function handleReplaceUpload(options: Recordable, targetItem: FileUploadItem) {
	const { file, onSuccess, onError } = options as any
	if (!validateFile(file)) {
		pendingReplaceItem.value = null
		onError?.(new Error('文件校验失败'))
		return
	}

	const idx = fileList.value.findIndex((f) => f.uid === targetItem.uid)
	if (idx === -1) {
		pendingReplaceItem.value = null
		onError?.(new Error('目标文件不存在'))
		return
	}

	// 备份旧项，失败时恢复
	const oldItem = { ...fileList.value[idx] }
	const newItem = createFileItem(file)
	fileList.value.splice(idx, 1, newItem)

	const success = await uploadFile(newItem)
	pendingReplaceItem.value = null
	if (success) {
		onSuccess?.(newItem.response)
	} else {
		onError?.(new Error('上传失败'))
		// 恢复旧文件
		fileList.value.splice(idx, 1, oldItem)
	}
	emitChange()
}

// ===================== 外部值同步 =====================

watch(
	() => props.value,
	(val) => {
		if (isInternalChange.value) {
			isInternalChange.value = false
			return
		}

		if (!val || (isArray(val) && val.length === 0)) {
			fileList.value = []
			return
		}

		let urls: string[] = []
		if (isArray(val)) {
			urls = val.filter((v: any) => isString(v) && v) as string[]
		} else if (isString(val) && val) {
			urls = [val]
		}
		// 如果是对象数组
		if (isArray(val) && val.length > 0 && isObject(val[0])) {
			urls = (val as any[]).map((v: any) => v.url || v.fileUrl || '').filter(Boolean)
		}

		// 将 url 转为 file item
		const existingUrls = new Set(fileList.value.filter((f) => f.status === UploadStatusEnum.DONE).map((f) => f.url))
		const newUrls = urls.filter((u) => !existingUrls.has(u))

		if (newUrls.length > 0) {
			const newItems = newUrls.map((url, i) => createFileItemFromUrl(url, i))
			if (props.mode === 'single') {
				fileList.value = newItems.slice(0, 1)
			} else {
				fileList.value = [...fileList.value, ...newItems]
			}
		}

		// 移除已不存在的
		const urlSet = new Set(urls)
		fileList.value = fileList.value.filter((f) => {
			if (f.status === UploadStatusEnum.DONE) return urlSet.has(f.url)
			return true // 保留上传中/失败的文件
		})
	},
	{ immediate: true, deep: true },
)
</script>

<style lang="scss" scoped>
/* ==================== 基础变量 ==================== */
$card-size: 104px;
$card-radius: 8px;
$border-color: #dcdfe6;
$border-color-dark: #303030;
$primary-color: #409eff;
$danger-color: #f56c6c;

/* ==================== 容器 ==================== */
.file-upload {
	&--disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	&__help {
		margin-bottom: 12px;
	}
}

/* ==================== 触发区域（通用） ==================== */
.file-upload__trigger {
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

/* ==================== 预览区域 ==================== */
.file-upload__preview-area {
	position: relative;
	width: $card-size;
	height: $card-size;
	border: 1px solid $border-color;
	border-radius: $card-radius;
	overflow: hidden;
	cursor: default;

	&:hover .file-upload__actions {
		opacity: 1;
	}

	&--clickable {
		cursor: pointer;
	}
}

/* ==================== 缩略图 ==================== */
.file-upload__thumb {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	overflow: hidden;

	img,
	video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	&--gif-mono {
		img {
			filter: grayscale(1) contrast(2);
			mix-blend-mode: difference;
		}
	}

	&--video {
		position: relative;
		background: #000;
	}

	&--file {
		background: #f5f7fa;
	}
}

.file-upload__video-play {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	font-size: 28px;
	color: rgba(255, 255, 255, 0.85);
	pointer-events: none;
}

.file-upload__file-icon {
	font-size: 28px;
	color: #8c939d;
}

.file-upload__file-name {
	font-size: 10px;
	color: #606266;
	text-align: center;
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	line-height: 1.3;
}

.file-upload__file-size {
	font-size: 10px;
	color: #c0c4cc;
}

/* ==================== 进度遮罩 ==================== */
.file-upload__progress-overlay {
	position: absolute;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	background: rgba(255, 255, 255, 0.8);
	border-radius: $card-radius;
}

.file-upload__progress-name {
	font-size: 10px;
	color: #606266;
	max-width: 90px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	text-align: center;
}

/* ==================== 操作按钮层 ==================== */
.file-upload__actions {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	background: rgba(0, 0, 0, 0.45);
	border-radius: $card-radius;
	opacity: 0;
	transition: opacity 0.2s;
}

.file-upload__action-btn {
	color: #fff !important;
	font-size: 16px;

	&:hover {
		color: $primary-color !important;
	}
}

/* ==================== 文件信息行 ==================== */
.file-upload__info {
	margin-top: 8px;
	display: flex;
	flex-direction: column;
	align-items: center;
	max-width: $card-size;

	&-name {
		font-size: 12px;
		color: #303133;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	&-size {
		font-size: 11px;
		color: #c0c4cc;
	}
}

/* ==================== 多文件列表 ==================== */
.file-upload__list {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}

.file-upload__list-item {
	position: relative;
	width: $card-size;
	border: 1px solid $border-color;
	border-radius: $card-radius;
	overflow: hidden;
	transition: border-color 0.2s;

	&:hover .file-upload__list-actions {
		opacity: 1;
	}

	&--uploading {
		border-color: $primary-color;
	}

	&--error {
		border-color: $danger-color;
	}

	&--add {
		border-style: dashed;
		cursor: pointer;
		display: flex;
		height: $card-size;

		&:hover {
			border-color: $primary-color;
			background: #f0f7ff;
		}
	}
}

.file-upload__list-thumb {
	width: $card-size;
	height: $card-size;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;

	img,
	video {
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
		background: #f5f7fa;
	}
}

.file-upload__list-video-play {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	font-size: 24px;
	color: rgba(255, 255, 255, 0.85);
}

.file-upload__list-file-icon {
	font-size: 32px;
	color: #8c939d;
}

.file-upload__list-progress {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

.file-upload__list-actions {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	background: rgba(0, 0, 0, 0.45);
	border-radius: $card-radius;
	opacity: 0;
	transition: opacity 0.2s;
}

.file-upload__list-action-icon {
	font-size: 16px;
	color: #fff;
	cursor: pointer;

	&:hover {
		color: $primary-color;
	}

	&--danger:hover {
		color: $danger-color;
	}
}

.file-upload__list-name {
	padding: 4px 8px 0;
	font-size: 11px;
	color: #303133;
	text-align: center;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.file-upload__list-size {
	padding: 0 8px 6px;
	font-size: 10px;
	color: #c0c4cc;
	text-align: center;
}

.file-upload__list-add {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	gap: 8px;
	color: #8c939d;
	font-size: 12px;
	cursor: pointer;

	.anticon {
		font-size: 22px;
	}
}

/* ==================== 移动端适配 ==================== */
@media (hover: none) and (pointer: coarse) {
	.file-upload__actions,
	.file-upload__list-actions {
		opacity: 1 !important;
		background: rgba(0, 0, 0, 0.3);
	}
}

/* ==================== 暗色主题 ==================== */
html[data-theme='dark'] {
	.file-upload {
		&__trigger--card,
		&__trigger--picture {
			border-color: $border-color-dark;
			background: #1a1a1a;

			&:hover {
				border-color: #58a6ff;
				background: #1c2a3d;
			}
		}

		&__trigger-content {
			color: #6e7681;
		}

		&__preview-area {
			border-color: $border-color-dark;
			background: #1a1a1a;

			&:hover .file-upload__actions {
				opacity: 1;
			}
		}

		&__thumb--file {
			background: #21262d;
		}

		&__file-icon,
		&__list-file-icon {
			color: #6e7681;
		}

		&__file-name,
		&__list-name {
			color: #e6edf3;
		}

		&__file-size,
		&__list-size {
			color: #484f58;
		}

		&__progress-overlay {
			background: rgba(0, 0, 0, 0.6);
		}

		&__list-item {
			border-color: $border-color-dark;
			background: #1a1a1a;

			&--add {
				&:hover {
					border-color: #58a6ff;
					background: #1c2a3d;
				}
			}
		}

		&__list-thumb--file {
			background: #21262d;
		}
	}
}
</style>
