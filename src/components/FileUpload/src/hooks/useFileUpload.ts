/**
 * useFileUpload — 文件上传数据流管理钩子
 *
 * 职责：
 * 1. 管理文件列表状态（fileList / doneFiles / currentFile）
 * 2. 暴露 settled 信号，确保上传回调完成才触发表单验证
 * 3. 提供 addFiles / removeFile / getValue / syncFromExternal 等操作
 *
 * 使用场景：
 * - 配合 FileUpload Modal：弹窗确认后调用 addFiles()
 * - 配合 SingleFileUpload / MultiFileUpload 展示组件
 * - 表单页独立使用：直接调用 addFiles() 管理文件数据
 */

import { ref, computed } from 'vue'
import { UploadStatusEnum } from '../types'
import type { FileUploadItem } from '../types'
import { createFileItemFromUrl } from '../helper'

export interface UseFileUploadOptions {
	/** 上传模式 */
	mode?: 'single' | 'multiple'
	/** 最大文件数（多文件模式生效） */
	maxCount?: number
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
	const { mode = 'single', maxCount = 10 } = options

	// ===================== 状态 =====================

	const fileList = ref<FileUploadItem[]>([])

	// ===================== 计算属性 =====================

	/** 上传成功的文件列表 */
	const doneFiles = computed(() => fileList.value.filter((f) => f.status === UploadStatusEnum.DONE))

	/** 单文件模式的当前文件 */
	const currentFile = computed(() => (mode === 'single' ? (doneFiles.value[0] ?? null) : null))

	/** 是否有文件正在上传 */
	const hasUploading = computed(() => fileList.value.some((f) => f.status === UploadStatusEnum.UPLOADING))

	/**
	 * 上传是否已 settled（无进行中的上传）
	 * 表单验证应等待 settled 为 true 后再触发
	 */
	const settled = computed(() => !hasUploading.value)

	/** 已完成文件数量 */
	const doneCount = computed(() => doneFiles.value.length)

	// ===================== 操作 =====================

	/** 设置文件列表（整体替换） */
	function setFiles(items: FileUploadItem[]) {
		fileList.value = [...items]
	}

	/** 添加文件 */
	function addFiles(items: FileUploadItem[]) {
		if (mode === 'single') {
			fileList.value = items.slice(0, 1)
		} else {
			const remaining = (maxCount ?? Infinity) - doneFiles.value.length
			if (remaining <= 0) return
			fileList.value = [...fileList.value, ...items.slice(0, remaining)]
		}
	}

	/** 移除单个文件，返回被移除的项 */
	function removeFile(uid: string): FileUploadItem | undefined {
		const idx = fileList.value.findIndex((f) => f.uid === uid)
		if (idx === -1) return undefined
		const [removed] = fileList.value.splice(idx, 1)
		return removed
	}

	/** 清空所有文件 */
	function clearFiles() {
		fileList.value = []
	}

	/** 获取对外输出的值（v-model） */
	function getValue(): string | string[] {
		const urls = doneFiles.value.map((f) => f.url)
		return mode === 'single' ? urls[0] || '' : urls
	}

	/** 从外部 url 同步文件列表（用于 v-model:value 回显） */
	function syncFromExternal(val: string | string[]): boolean {
		// 空值处理
		if (!val || (Array.isArray(val) && val.length === 0)) {
			if (fileList.value.length > 0) {
				fileList.value = []
				return true
			}
			return false
		}

		const urls = (Array.isArray(val) ? val : [val]).filter((v): v is string => typeof v === 'string' && !!v)
		if (urls.length === 0) {
			if (fileList.value.length > 0) {
				fileList.value = []
				return true
			}
			return false
		}

		const existingUrls = new Set(doneFiles.value.map((f) => f.url))

		// 移除不在外部值中的文件
		const removed: string[] = []
		fileList.value = fileList.value.filter((f) => {
			if (f.status !== UploadStatusEnum.DONE) return true
			if (!urls.includes(f.url)) {
				removed.push(f.uid)
				return false
			}
			return true
		})

		// 添加新的 url
		const newUrls = urls.filter((u) => !existingUrls.has(u))
		if (newUrls.length > 0) {
			const newItems = newUrls.map((url, i) => createFileItemFromUrl(url, i))
			fileList.value = [...fileList.value, ...newItems]
		}

		return newUrls.length > 0 || removed.length > 0
	}

	return {
		// 状态（只读）
		fileList,
		doneFiles,
		currentFile,
		settled,
		hasUploading,
		doneCount,

		// 操作
		setFiles,
		addFiles,
		removeFile,
		clearFiles,
		getValue,
		syncFromExternal,
	}
}
