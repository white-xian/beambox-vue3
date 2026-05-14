import type { PropType } from 'vue'
import type { ListType } from './types'
import { fileUploadApi } from '@/api/sys/upload.api'

export const fileUploadProps = {
	/** 当前值：单文件时为 url 字符串，多文件时为 url 字符串数组 */
	value: {
		type: [String, Array] as PropType<string | string[]>,
		default: undefined,
	},
	/** 上传模式：single 单文件 | multiple 多文件 */
	mode: {
		type: String as PropType<'single' | 'multiple'>,
		default: 'single',
	},
	/** 展示列表类型 */
	listType: {
		type: String as PropType<ListType>,
		default: 'picture-card',
	},
	/** 接受的文件类型，如 ['image/*', '.pdf']，空数组表示不限制 */
	accept: {
		type: Array as PropType<string[]>,
		default: () => [],
	},
	/** 单个文件最大大小（MB） */
	maxSize: {
		type: Number,
		default: 10,
	},
	/** 文件大小单位 */
	maxSizeUnit: {
		type: String as PropType<'B' | 'KB' | 'MB' | 'GB'>,
		default: 'MB',
	},
	/** 最大文件数量（仅多文件模式生效），Infinity 不限制 */
	maxNumber: {
		type: Number,
		default: 10,
	},
	/** 是否禁用 */
	disabled: {
		type: Boolean,
		default: false,
	},
	/** 是否显示预览按钮 */
	previewable: {
		type: Boolean,
		default: true,
	},
	/** 是否显示替换按钮（单文件模式可替换已有文件） */
	replaceable: {
		type: Boolean,
		default: true,
	},
	/** 上传接口函数（uploadApiUrl 为空时使用） */
	api: {
		type: Function as PropType<(...args: any[]) => Promise<any>>,
		default: fileUploadApi,
	},
	/** 上传接口路径，如 '/file/oss/upload'，设置后优先使用，组件内部直接调用 defHttp.uploadFile */
	uploadApiUrl: {
		type: String,
		default: '',
	},
	/** 上传时的文件字段名 */
	name: {
		type: String,
		default: 'file',
	},
	/** 上传时附加参数 */
	uploadParams: {
		type: Object as PropType<Recordable>,
		default: () => ({}),
	},
	/** 上传接口返回结果字段路径，如 'data.url'、'url'，空字符串则自动推断 */
	resultField: {
		type: String,
		default: '',
	},
	/** 提示文本，为空则自动生成 */
	helpText: {
		type: String,
		default: '',
	},
	/** 上传按钮文本 */
	uploadText: {
		type: String,
		default: '点击上传',
	},
	/** 是否显示文件大小 */
	showSize: {
		type: Boolean,
		default: true,
	},
	/** 是否显示删除按钮 */
	showDelete: {
		type: Boolean,
		default: true,
	},
	/** 是否显示帮助提示（Alert 横幅） */
	showHelpText: {
		type: Boolean,
		default: true,
	},
	/** 图片预览是否启用黑白动图特效（仅对 GIF 生效） */
	gifMonoEffect: {
		type: Boolean,
		default: false,
	},
	/** GIF 黑白特效背景色（无背景透明效果），仅 gifMonoEffect=true 生效 */
	gifMonoBg: {
		type: String,
		default: 'transparent',
	},
}
