/** 文件类型枚举：用于决定展示形态 */
export enum FileTypeEnum {
	IMAGE = 'image',
	VIDEO = 'video',
	GIF = 'gif',
	AUDIO = 'audio',
	DOCUMENT = 'document',
	OTHER = 'other',
}

/** 单个文件项（内部使用，含上传状态） */
export interface FileUploadItem {
	/** 本地唯一标识 */
	uid: string
	/** 文件名 */
	name: string
	/** 文件大小（字节） */
	size: number
	/** 文件类型（MIME 或后缀） */
	type: string
	/** 文件类型枚举 */
	fileType: FileTypeEnum
	/** 上传后返回的文件 url */
	url: string
	/** 本地缩略图 dataUrl（仅图片类） */
	thumbUrl?: string
	/** 上传进度 0-100 */
	percent: number
	/** 上传状态 */
	status: UploadStatusEnum
	/** 上传失败时的错误信息 */
	errorMessage?: string
	/** 原始 File 对象 */
	file?: File
	/** 接口原始响应 */
	response?: Recordable
	/** 额外自定义字段 */
	[key: string]: any
}

/** 上传状态 */
export enum UploadStatusEnum {
	READY = 'ready',
	UPLOADING = 'uploading',
	DONE = 'done',
	ERROR = 'error',
}

/** 展示列表类型 */
export type ListType = 'text' | 'picture' | 'picture-card'

/** 文件类型分组 */
export const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/svg+xml', 'image/tiff']
export const GIF_TYPE = 'image/gif'
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo']
export const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/webm']

/** 图片类后缀 */
export const IMG_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.ico']
