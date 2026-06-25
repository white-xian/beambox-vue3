/**
 * useUploadCore — 上传核心逻辑 composable
 *
 * ## 设计原则
 *
 * 1. **单一职责** — 只负责上传执行，不关心 UI 渲染
 * 2. **完整生命周期** — 管理 AbortController、timer 的创建与销毁
 * 3. **类型安全** — 消灭 any，使用 discriminated union 区分错误类型
 * 4. **可测试** — 纯逻辑层，不依赖 DOM / 组件实例
 *
 * ## 使用方式
 *
 * ```ts
 * const { state, upload, cancelAll, cancelOne } = useUploadCore({
 *   uploadApiUrl: '/file/oss/upload',
 *   maxSize: 10,        // MB
 *   accept: ['jpg', 'png'],
 * })
 *
 * // 上传文件
 * const file = new File([...], 'test.jpg')
 * upload(file)
 *
 * // 取消
 * cancelOne(fileId)
 * cancelAll()
 * ```
 */

import { ref, computed, onBeforeUnmount } from 'vue'
import axios, { AxiosProgressEvent } from 'axios'
import { defHttp } from '@/utils/http/axios'
import { useGlobSetting } from '@/hooks/setting'
import { useMessage } from '@/hooks/web/useMessage'
import { buildUUID } from '@/utils/core/IdUtil'
import { detectFileType, isImageLike, readFileAsDataUrl, normalizeUploadResponse, isSuccessCode, formatFileSize, parseMaxSize } from '../helper'
import type { FileUploadItem } from '../types'
import { UploadStatusEnum } from '../types'

// ============================================================
// 类型定义
// ============================================================

/** 上传核心配置 */
export interface UploadCoreOptions {
	/**
	 * 上传方式
	 * - string → 上传接口路径（如 '/file/oss/upload'），组件内部拼接 baseUrl
	 * - function → 自定义上传函数
	 */
	upload?: string | UploadApiFn
	/** 表单文件字段名 */
	name?: string
	/** 额外上传参数 */
	uploadParams?: Recordable
	/** 响应中文件 URL 的字段路径，如 'data.url' */
	resultField?: string
	/**
	 * 单个文件最大体积
	 * - 数字 → MB（向后兼容）
	 * - 字符串 → '10MB' / '500KB' / '2GB'
	 * 默认 '10MB'
	 */
	maxSize?: string | number
	/** 允许的文件类型 */
	accept?: string[]
	/**
	 * 超时时间（毫秒）
	 * undefined / 0 → 不限制
	 */
	timeout?: number
}

/** 自定义上传函数签名 */
export type UploadApiFn = (
	params: {
		name?: string
		file?: File
		filename?: string
		data?: Recordable
		signal?: AbortSignal
	},
	onProgress?: (event: AxiosProgressEvent) => void,
	timeout?: number,
) => Promise<any>

/** 文件校验结果 */
export interface ValidationResult {
	valid: boolean
	message?: string
}

/** 上传项扩展（含 AbortController） */
interface ActiveUpload {
	item: FileUploadItem
	abortController: AbortController
}

// ============================================================
// Composable 实现
// ============================================================

export function useUploadCore(options: UploadCoreOptions = {}) {
	const { uploadUrl = '' } = useGlobSetting()
	const { createMessage } = useMessage()

	// ---- 配置归一化 ----

	const maxSizeParsed = computed(() => parseMaxSize(options.maxSize ?? '10MB'))
	const maxSizeInBytes = computed(() => maxSizeParsed.value.bytes)

	// ---- 状态 ----

	const uploadingItems = ref<FileUploadItem[]>([])
	const doneItems = ref<FileUploadItem[]>([])

	/** 活跃上传的 Map，用于取消和清理 */
	const activeUploads = new Map<string, ActiveUpload>()

	// ---- 计算属性 ----

	const hasActive = computed(() => activeUploads.size > 0)
	const doneCount = computed(() => doneItems.value.length)

	// ============================================================
	// 文件校验

	/**
	 * 校验单个文件
	 *
	 * 校验顺序：大小 → 文件名 → 类型
	 * 早返回策略，避免不必要的检查
	 */
	function validateFile(file: File): ValidationResult {
		// 1. 大小校验
		if (options.maxSize && file.size > maxSizeInBytes.value) {
			const displaySize = formatFileSize(maxSizeInBytes.value)
			return { valid: false, message: `文件 "${file.name}" 超过 ${displaySize} 限制` }
		}

		// 2. 文件名校验
		if (file.name.includes(',')) {
			return { valid: false, message: '文件名不能包含英文逗号' }
		}

		// 3. 类型校验
		if (options.accept && options.accept.length > 0) {
			const fileName = file.name.toLowerCase()
			const fileType = file.type.toLowerCase()
			const matched = options.accept.some((rule) => {
				if (rule.includes('/')) {
					return rule.endsWith('/*')
						? fileType.startsWith(rule.replace('/*', '/'))
						: fileType === rule
				}
				const ext = rule.startsWith('.') ? rule : '.' + rule
				return fileName.endsWith(ext)
			})
			if (!matched) {
				return {
					valid: false,
					message: `文件 "${file.name}" 格式不支持，允许：${options.accept.join(', ')}`,
				}
			}
		}

		return { valid: true }
	}

	// ============================================================
	// 内部工具
	// ============================================================

	/** 通过响应式数组索引更新项（确保触发视图更新） */
	function updateUploadingItem(uid: string, patch: Partial<FileUploadItem>) {
		const idx = uploadingItems.value.findIndex((f) => f.uid === uid)
		if (idx !== -1) {
			// 使用 Object.assign 保证响应式触发
			Object.assign(uploadingItems.value[idx], patch)
		}
	}

	/** 从进行中列表移除并清理 */
	function removeFromUploading(uid: string) {
		const idx = uploadingItems.value.findIndex((f) => f.uid === uid)
		if (idx !== -1) {
			uploadingItems.value.splice(idx, 1)
		}
	}

	/** 判断是否为用户主动取消 */
	function isUserCancellation(error: unknown): boolean {
		return axios.isCancel(error) || (error instanceof DOMException && error.name === 'AbortError')
	}

	// ============================================================
	// 上传执行
	// ============================================================

	/**
	 * 上传单个文件
	 *
	 * 返回 Promise<FileUploadItem | null>
	 * - 成功：返回含 url 的 item
	 * - 取消：返回 null
	 * - 失败：抛出错误
	 */
	async function upload(file: File): Promise<FileUploadItem | null> {
		// 1. 校验
		const validation = validateFile(file)
		if (!validation.valid) {
			createMessage.error(validation.message!)
			throw new Error(validation.message)
		}

		// 2. 创建上传项
		const fileType = detectFileType(file)
		const item: FileUploadItem = {
			uid: buildUUID(),
			name: file.name,
			size: file.size,
			type: file.type || file.name.split('.').pop() || '',
			fileType,
			url: '',
			thumbUrl: undefined,
			percent: 0,
			status: UploadStatusEnum.UPLOADING,
			file,
		}

		// 3. 注册到状态
		uploadingItems.value.push(item)
		const abortController = new AbortController()
		const active: ActiveUpload = { item, abortController }
		activeUploads.set(item.uid, active)

		try {
			// 4. 执行上传
			const response = await executeUpload(item, abortController.signal)

			// 5. 处理响应
			const responseData = response?.data || response || {}
			const data = responseData?.data || responseData
			const bizCode = data?.code ?? responseData?.code

			if (bizCode !== undefined && !isSuccessCode(bizCode)) {
				throw new Error(data?.message || data?.msg || '上传失败')
			}

			const result = normalizeUploadResponse(response, file, options.resultField)

			// 6. 生成缩略图（图片类）
			let thumbUrl: string | undefined = result.url || undefined
			if (isImageLike(fileType)) {
				try {
					thumbUrl = await readFileAsDataUrl(file)
				} catch {
					// 缩略图生成失败不影响上传结果
				}
			}

			// 7. 更新为完成状态 — url/name/size 为 best-effort，业务侧优先从 response 取原始数据
			const doneItem: FileUploadItem = {
				...item,
				url: result.url || '',
				name: result.name || item.name,
				size: Number(result.size) || item.size,
				thumbUrl,
				status: UploadStatusEnum.DONE,
				percent: 100,
				response: data,
			}

			// 8. 从进行中移到已完成
			removeFromUploading(item.uid)
			doneItems.value.push(doneItem)

			return doneItem
		} catch (error: unknown) {
			// 用户主动取消 → 静默返回 null
			if (isUserCancellation(error)) {
				removeFromUploading(item.uid)
				return null
			}

			// 真实错误 → 标记失败，存错误信息
			const errorMessage = error instanceof Error ? error.message : '上传失败'
			updateUploadingItem(item.uid, { status: UploadStatusEnum.ERROR, errorMessage })

			// 区分错误类型：仅业务错误弹 toast
			if (axios.isAxiosError(error)) {
				// HTTP 错误 / 超时 / 网络错误 → 由 axios 拦截器统一提示，此处跳过
			} else if (error instanceof Error) {
				createMessage.error(error.message || '文件上传失败')
			}

			throw error
		} finally {
			// 清理 AbortController
			activeUploads.delete(item.uid)
		}
	}

	/**
	 * 执行实际的上传请求
	 *
	 * 支持两种模式：
	 * 1. uploadApiUrl — 使用内置的 defHttp.uploadFile
	 * 2. api — 调用外部传入的自定义函数
	 *
	 * 两种模式都支持 signal 取消
	 */
	async function executeUpload(item: FileUploadItem, signal: AbortSignal): Promise<any> {
		const name = options.name || 'file'
		const params = {
			name,
			file: item.file!,
			filename: item.name,
			data: { ...(options.uploadParams || {}) },
		}

		const onProgress = (progressEvent: AxiosProgressEvent) => {
			if (progressEvent.lengthComputable && progressEvent.total && progressEvent.total > 0) {
				// 上传中封顶 99%，成功后由外层置 100%
				const percent = Math.min(99, Math.round((progressEvent.loaded / progressEvent.total) * 100))
				updateUploadingItem(item.uid, { percent })
			}
		}

		// 根据 upload 类型选择上传方式
		const upload = options.upload

		// 模式 1：字符串路径 → 使用内置 defHttp.uploadFile
		if (typeof upload === 'string') {
			return defHttp.uploadFile(
				{
					url: uploadUrl + upload,
					timeout: options.timeout ?? 0,
					signal,
					onUploadProgress: onProgress,
				},
				params,
			)
		}

		// 模式 2：自定义函数
		if (typeof upload === 'function') {
			return upload(
				{ ...params, signal },
				onProgress,
				options.timeout ?? 0,
			)
		}

		throw new Error('upload 配置无效：需要提供上传路径或自定义上传函数')
	}

	// ============================================================
	// 取消操作
	// ============================================================

	/** 取消单个上传 */
	function cancelOne(uid: string) {
		const active = activeUploads.get(uid)
		if (active) {
			active.abortController.abort()
			// isUserCancellation 会在 catch 中识别并静默处理
		}
	}

	/** 取消所有进行中的上传 */
	function cancelAll() {
		activeUploads.forEach((active) => {
			active.abortController.abort()
		})
	}

	/** 重试失败的上传 */
	function retry(uid: string) {
		const idx = uploadingItems.value.findIndex((f) => f.uid === uid)
		if (idx === -1) return
		const failed = uploadingItems.value[idx]
		if (!failed.file) return

		// 从列表移除旧项，重新上传
		uploadingItems.value.splice(idx, 1)
		upload(failed.file)
	}

	// ============================================================
	// 状态重置
	// ============================================================

	/** 重置所有状态（弹窗打开时调用） */
	function reset() {
		cancelAll()
		uploadingItems.value = []
		doneItems.value = []
	}

	/** 从已完成列表移除一项 */
	function removeDone(uid: string) {
		const idx = doneItems.value.findIndex((f) => f.uid === uid)
		if (idx !== -1) {
			doneItems.value.splice(idx, 1)
		}
	}

	/** 获取用于外部输出的值 */
	function getDoneUrls(): string[] {
		return doneItems.value.map((f) => f.url)
	}

	// ============================================================
	// 生命周期清理
	//
	// 确保组件销毁时：
	// - 所有 AbortController 被 abort
	// - 所有 setTimeout 被 clear
	// ============================================================

	onBeforeUnmount(() => {
		// 取消所有进行中的上传
		activeUploads.forEach((active) => {
			active.abortController.abort()
		})
		activeUploads.clear()
	})

	// ============================================================
	// 对外 API
	// ============================================================

	return {
		/** 响应式数组（模板中需要直接使用） */
		uploadingItems,
		doneItems,
		hasActive,
		doneCount,

		/** 操作 */
		upload,
		cancelOne,
		cancelAll,
		retry,
		reset,
		removeDone,
		removeError: removeFromUploading,
		getDoneUrls,
		validateFile,
	}
}
