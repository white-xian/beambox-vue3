import { FileTypeEnum, IMAGE_TYPES, GIF_TYPE, VIDEO_TYPES, AUDIO_TYPES, IMG_EXTENSIONS } from './types'
import type { FileUploadItem } from './types'
import { buildUUID } from '@/utils/core/IdUtil'

/**
 * 根据 MIME 类型或文件后缀判断文件类型枚举
 */
export function detectFileType(file: File | { type?: string; name: string }): FileTypeEnum {
	const mime = (file.type || '').toLowerCase()
	const name = (file.name || '').toLowerCase()

	// 优先按 MIME 判断
	if (mime === GIF_TYPE) return FileTypeEnum.GIF
	if (IMAGE_TYPES.some((t) => mime === t)) return FileTypeEnum.IMAGE
	if (VIDEO_TYPES.some(() => mime.startsWith('video/'))) return FileTypeEnum.VIDEO
	if (AUDIO_TYPES.some(() => mime.startsWith('audio/'))) return FileTypeEnum.AUDIO

	// 按后缀判断
	if (/\.gif$/i.test(name)) return FileTypeEnum.GIF
	if (IMG_EXTENSIONS.some((ext) => name.endsWith(ext))) return FileTypeEnum.IMAGE
	if (/\.(mp4|webm|ogg|avi|mov|mkv|flv|wmv)$/i.test(name)) return FileTypeEnum.VIDEO
	if (/\.(mp3|wav|ogg|aac|flac|m4a|wma)$/i.test(name)) return FileTypeEnum.AUDIO

	return FileTypeEnum.OTHER
}

/**
 * 判断是否为图片类文件（含 GIF）
 */
export function isImageLike(type: FileTypeEnum): boolean {
	return type === FileTypeEnum.IMAGE || type === FileTypeEnum.GIF
}

/**
 * 判断是否可预览（图片 / GIF / 视频）
 */
export function isPreviewable(type: FileTypeEnum): boolean {
	return type === FileTypeEnum.IMAGE || type === FileTypeEnum.GIF || type === FileTypeEnum.VIDEO
}

/**
 * 读取文件为 base64 dataUrl
 */
export function readFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.readAsDataURL(file)
		reader.onload = () => resolve(reader.result as string)
		reader.onerror = (e) => reject(e)
	})
}

/**
 * 从多层嵌套响应中按候选 key 列表取值
 */
export function pickValue(data: Recordable, keys: string[]): string | undefined {
	for (const key of keys) {
		const val = data?.[key]
		if (val !== undefined && val !== null && val !== '') {
			return String(val)
		}
	}
	return undefined
}

/**
 * 归一化上传响应 —— 兼容多种后端返回格式
 *
 * 常见格式：
 * 1. { code: 200, data: { url: 'xxx', fileName: 'xxx' } }
 * 2. { code: 200, data: { fileUrl: 'xxx', name: 'xxx' } }
 * 3. { code: 200, data: { ossUrl: 'xxx', originalName: 'xxx' } }
 * 4. { code: 200, url: 'xxx', message: 'success' }
 * 5. { code: 0, message: 'success', url: 'xxx' }
 * 6. 直接返回 url 字符串
 */
export function normalizeUploadResponse(response: Recordable, file: File, resultField?: string) {
	// 如果是字符串，直接当 url
	if (typeof response === 'string') {
		return { url: response, name: file.name, size: String(file.size) }
	}

	const responseData = response?.data || response || {}
	const data = responseData?.data || responseData

	// 支持自定义 resultField（如 'data.url' 点号路径）
	let url = ''
	if (resultField) {
		const keys = resultField.split('.')
		let current: any = response
		for (const k of keys) {
			current = current?.[k]
			if (current === undefined || current === null) break
		}
		url = typeof current === 'string' ? current : ''
	}

	if (!url) {
		// 如果 data 是字符串，直接作为 url
		if (typeof data === 'string') {
			url = data
		} else {
			url = pickValue(data, ['fileUrl', 'url', 'ossUrl', 'path', 'link', 'src']) || ''
		}
	}

	const name = pickValue(data, ['fileName', 'name', 'originalName', 'originalFilename', 'title']) || file.name
	const size = pickValue(data, ['fileSize', 'size']) || String(file.size)

	return { url, name, size }
}

/**
 * 校验业务 code 是否成功（兼容 200/0/'0'/'200' 等）
 */
export function isSuccessCode(code: unknown): boolean {
	return code === 200 || code === 0 || code === '200' || code === '0'
}

/**
 * 格式化文件大小为可读字符串
 */
export function formatFileSize(bytes: number | string): string {
	const num = Number(bytes)
	if (!num || num <= 0) return '0 B'
	const units = ['B', 'KB', 'MB', 'GB', 'TB']
	const k = 1024
	const i = Math.floor(Math.log(num) / Math.log(k))
	return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

/**
 * 从 url 中提取文件名
 */
export function getFileNameFromUrl(url: string): string {
	if (!url) return ''
	try {
		const pathname = new URL(url, location.origin).pathname
		const name = pathname.substring(pathname.lastIndexOf('/') + 1)
		return decodeURIComponent(name)
	} catch {
		const idx = url.lastIndexOf('/')
		return idx > -1 ? url.substring(idx + 1).split('?')[0] : url.split('?')[0]
	}
}

/**
 * 创建一个初始文件项
 */
export function createFileItem(file: File): FileUploadItem {
	const fileType = detectFileType(file)
	return {
		uid: buildUUID(),
		name: file.name,
		size: file.size,
		type: file.type || file.name.split('.').pop() || '',
		fileType,
		url: '',
		thumbUrl: undefined,
		percent: 0,
		status: 'ready' as any,
		file,
	}
}

/**
 * 从 url 字符串创建一个已上传完成的文件项
 */
export function createFileItemFromUrl(url: string, _index: number): FileUploadItem {
	const name = getFileNameFromUrl(url)
	// 从文件名推断类型
	const fakeFile = { type: '', name }
	const fileType = detectFileType(fakeFile)
	return {
		uid: buildUUID(),
		name,
		size: 0,
		type: name.split('.').pop() || '',
		fileType,
		url,
		thumbUrl: isImageLike(fileType) ? url : undefined,
		percent: 100,
		status: 'done' as any,
	}
}

/**
 * 解析 maxSize prop
 *
 * 支持格式：
 * - 数字 → 视为 MB（向后兼容）
 * - 字符串 → '10MB' / '500KB' / '2GB' / '1024B'
 *
 * @returns { bytes: 字节数, unit: 单位字符串, display: 展示文字 }
 */
export function parseMaxSize(input: string | number): { bytes: number; unit: string; display: string } {
	// 数字 → 兼容旧版用法，视为 MB
	if (typeof input === 'number') {
		const v = Number.isFinite(input) && input > 0 ? input : 10
		return { bytes: v * 1024 * 1024, unit: 'MB', display: `${v}MB` }
	}

	const match = String(input).trim().match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i)
	if (match) {
		const value = parseFloat(match[1])
		const unit = match[2].toUpperCase()
		const factor: Record<string, number> = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 }
		if (factor[unit]) {
			return { bytes: value * factor[unit], unit, display: `${value}${unit}` }
		}
	}

	// 解析失败 → 兜底 10MB
	return { bytes: 10 * 1024 * 1024, unit: 'MB', display: '10MB' }
}
