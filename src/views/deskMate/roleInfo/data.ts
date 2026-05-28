import { DescItem } from '@/components/Description'
import { FormSchema } from '@/components/Form'
import { BasicColumn } from '@/components/Table'
import { h } from 'vue'
import { Image } from 'ant-design-vue'
import { Tinymce } from '@/components/Tinymce'

/** 是否隐藏款选项 */
export const hiddenOptions = [
	{ label: '否', value: 0 },
	{ label: '是', value: 1 },
]

/** 桌搭子角色基础信息列表列配置 */
export const columns: BasicColumn[] = [
	{
		title: '名称',
		dataIndex: 'name',
		width: 160,
	},
	{
		title: '职业',
		dataIndex: 'profession',
		width: 160,
	},
	{
		title: '设备识别码',
		dataIndex: 'matchRole',
		width: 160,
	},
	{
		title: '特点',
		dataIndex: 'features',
		width: 200,
	},
	{
		title: '隐藏款',
		dataIndex: 'isHidden',
		width: 120,
		customRender: ({ record }) => (record.isHidden === 1 ? '是' : '否'),
	},
	{
		title: '创建时间',
		dataIndex: 'createTime',
		width: 180,
	},
	{
		title: '更新时间',
		dataIndex: 'updateTime',
		width: 180,
	},
]

/** 桌搭子角色基础信息列表搜索表单配置 */
export const searchFormSchema: FormSchema[] = [
	{
		label: '角色',
		field: 'tablesideId',
		component: 'ApiSelect',
		componentProps: {
			api: () => import('@/api/deskMate/roleInfo.api').then((m) => m.getRoleInfoOptionsApi()),
			labelField: 'name',
			valueField: 'id',
			showSearch: true,
			optionFilterProp: 'label',
			placeholder: '请选择角色',
		},
		colProps: { span: 6 },
	},
	{
		label: '名称',
		field: 'name',
		component: 'Input',
		colProps: { span: 6 },
	},
]

/** 桌搭子角色基础信息表单配置 */
export const formSchema: FormSchema[] = [
	{
		field: 'name',
		label: '名称',
		component: 'Input',
		required: true,
		rules: [{ required: true, message: '请输入名称', trigger: 'blur' }],
		colProps: { xs: 24, md: 12 },
	},
	{
		field: 'features',
		label: '特点',
		component: 'Select',
		componentProps: {
			mode: 'tags',
			placeholder: '输入后按回车添加特点',
		},
		required: true,
		rules: [{ required: true, message: '请添加至少一个特点', trigger: 'change', type: 'array' }],
		colProps: { xs: 24, md: 12 },
	},
	{
		field: 'profession',
		label: '职业',
		component: 'Input',
		required: true,
		rules: [{ required: true, message: '请输入职业', trigger: 'blur' }],
		colProps: { xs: 24, md: 12 },
	},
	{
		field: 'matchRole',
		label: '设备识别码',
		component: 'Input',
		required: true,
		rules: [{ required: true, message: '请输入设备识别码', trigger: 'blur' }],
		colProps: { xs: 24, md: 12 },
	},
	{
		field: 'isHidden',
		label: '隐藏款',
		component: 'RadioGroup',
		componentProps: {
			options: hiddenOptions,
		},
		defaultValue: 0,
		required: true,
		colProps: { span: 24 },
	},
	{
		field: 'roleCardAvatarUrl',
		label: '角色卡头像',
		component: 'Input',
		slot: 'uploadSlot',
		required: true,
		maxSizeUnit: 'KB',
		maxSize: 200,
		rules: [{ required: true, message: '请上传头像', trigger: 'change' }],
		colProps: { xs: 24, sm: 12, md: 8, lg: 6 },
	},
	{
		field: 'roleRelationshipUrl',
		label: '角色圆形头像',
		component: 'Input',
		slot: 'uploadSlot',
		required: true,
		maxSizeUnit: 'KB',
		maxSize: 50,
		rules: [{ required: true, message: '请上传圆形头像', trigger: 'change' }],
		colProps: { xs: 24, sm: 12, md: 8, lg: 6 },
	},
	{
		field: 'roleCardBackgroundUrl',
		label: '角色卡背景',
		component: 'Input',
		slot: 'uploadSlot',
		maxSizeUnit: 'KB',
		maxSize: 500,
		required: true,
		rules: [{ required: true, message: '请上传角色卡背景', trigger: 'change' }],
		colProps: { xs: 24, sm: 12, md: 8, lg: 6 },
	},
	{
		field: 'hiddenUrl',
		label: '隐藏款头像',
		component: 'Input',
		slot: 'uploadSlot',
		maxSizeUnit: 'KB',
		maxSize: 50,
		colProps: { xs: 24, sm: 12, md: 8, lg: 6 },
	},
	{
		field: 'onlineModelUrl',
		label: '设备在线角色',
		component: 'Input',
		slot: 'uploadSlot',
		required: true,
		maxSizeUnit: 'KB',
		maxSize: 200,
		colProps: { xs: 24, sm: 12, md: 8, lg: 6 },
	},
	{
		field: 'offlineModelUrl',
		label: '设备离线角色',
		component: 'Input',
		slot: 'uploadSlot',
		required: true,
		maxSizeUnit: 'KB',
		maxSize: 200,
		colProps: { xs: 24, sm: 12, md: 8, lg: 6 },
	},
	{
		field: 'onlineBackgroundUrl',
		label: '设备在线背景',
		component: 'Input',
		slot: 'uploadSlot',
		required: true,
		maxSizeUnit: 'KB',
		maxSize: 500,
		colProps: { xs: 24, sm: 12, md: 8, lg: 6 },
	},
	{
		field: 'offlineBackgroundUrl',
		label: '设备离线背景',
		component: 'Input',
		slot: 'uploadSlot',
		required: true,
		maxSizeUnit: 'KB',
		maxSize: 500,
		colProps: { xs: 24, sm: 12, md: 8, lg: 6 },
	},
	{
		field: 'characterBackground',
		label: '角色来历',
		component: 'Input',
		render: ({ model, field }) => {
			return h(Tinymce, {
				value: model[field],
				height: 300,
				showImageUpload: false,
				contentType: 'app',
				onChange: (value: string) => {
					model[field] = value
				},
			})
		},
		required: true,
		rules: [{ required: true, message: '请输入角色来历', trigger: 'blur' }],
		colProps: { span: 24 },
	},
	{
		field: 'interactionProtocolBrief',
		label: '交互协议简略',
		component: 'Input',
		render: ({ model, field }) => {
			return h(Tinymce, {
				value: model[field],
				height: 300,
				showImageUpload: false,
				contentType: 'app',
				onChange: (value: string) => {
					model[field] = value
				},
			})
		},
		required: true,
		rules: [{ required: true, message: '请输入交互协议简略描述', trigger: 'blur' }],
		colProps: { span: 24 },
	},
	{
		field: 'interactionProtocol',
		label: '交互回响',
		component: 'Input',
		render: ({ model, field }) => {
			return h(Tinymce, {
				value: model[field],
				height: 300,
				showImageUpload: false,
				contentType: 'app',
				onChange: (value: string) => {
					model[field] = value
				},
			})
		},
		required: true,
		rules: [{ required: true, message: '请输入交互回响', trigger: 'blur' }],
		colProps: { span: 24 },
	},
]

/** 渲染指定语言的等级图片 */
function renderLevelImages(i18n: Record<string, Record<string, string>> | undefined, lang: string) {
	const langData = i18n?.[lang]
	if (!langData || typeof langData !== 'object' || !Object.keys(langData).length) return ''
	return h('div', { style: { display: 'flex', gap: '12px', flexWrap: 'wrap' } },
		Object.entries(langData).map(([level, url]) =>
			h('div', { key: level, style: { textAlign: 'center' } }, [
				h('div', { style: { fontSize: '12px', marginBottom: '4px', color: '#909399' } }, `等级 ${level}`),
				url ? h(Image, { src: url, style: { maxWidth: '80px', maxHeight: '80px', borderRadius: '8px', objectFit: 'cover' } }) : '',
			])
		)
	)
}

/** 桌搭子角色基础信息详情描述项配置 */
export const detailSchema: DescItem[] = [
	{
		label: '名称',
		field: 'name',
		span: 6,
	},
	{
		label: '特点',
		field: 'features',
		span: 6,
	},
	{
		label: '头像',
		field: 'roleCardAvatarUrl',
		render: (val) => (val ? h('div', { style: { textAlign: 'center' } }, h(Image, { src: val, style: { maxWidth: '120px', maxHeight: '120px', borderRadius: '8px' } })) : ''),
		span: 6,
	},
	{
		label: '职业',
		field: 'profession',
		span: 6,
	},
	{
		label: '设备识别码',
		field: 'matchRole',
		span: 6,
	},
	{
		label: '角色圆形头像',
		field: 'roleRelationshipUrl',
		render: (val) => (val ? h('div', { style: { textAlign: 'center' } }, h(Image, { src: val, style: { maxWidth: '120px', maxHeight: '120px', borderRadius: '8px' } })) : ''),
		span: 6,
	},
	{
		label: '设备在线角色',
		field: 'onlineModelUrl',
		render: (val) => (val ? h('div', { style: { textAlign: 'center' } }, h(Image, { src: val, style: { maxWidth: '200px', maxHeight: '100px', borderRadius: '8px' } })) : ''),
		span: 6,
	},
	{
		label: '设备离线角色',
		field: 'offlineModelUrl',
		render: (val) => (val ? h('div', { style: { textAlign: 'center' } }, h(Image, { src: val, style: { maxWidth: '120px', maxHeight: '120px', borderRadius: '8px' } })) : ''),
		span: 6,
	},
	{
		label: '隐藏款头像',
		field: 'hiddenUrl',
		render: (val) => (val ? h('div', { style: { textAlign: 'center' } }, h(Image, { src: val, style: { maxWidth: '120px', maxHeight: '120px', borderRadius: '8px' } })) : ''),
		span: 6,
	},
	{
		label: '设备在线背景',
		field: 'onlineBackgroundUrl',
		render: (val) => (val ? h('div', { style: { textAlign: 'center' } }, h(Image, { src: val, style: { maxWidth: '200px', maxHeight: '100px', borderRadius: '8px' } })) : ''),
		span: 6,
	},
	{
		label: '设备离线背景',
		field: 'offlineBackgroundUrl',
		render: (val) => (val ? h('div', { style: { textAlign: 'center' } }, h(Image, { src: val, style: { maxWidth: '200px', maxHeight: '100px', borderRadius: '8px' } })) : ''),
		span: 6,
	},
	{
		label: '背景',
		field: 'roleCardBackgroundUrl',
		render: (val) => (val ? h('div', { style: { textAlign: 'center' } }, h(Image, { src: val, style: { maxWidth: '200px', maxHeight: '100px', borderRadius: '8px' } })) : ''),
		span: 6,
	},
	{
		label: '隐藏款',
		field: 'isHidden',
		render: (val) => (val === 1 ? '是' : '否'),
		span: 24,
	},
	{
		label: '中文-标签',
		field: 'levelUrlI18n',
		render: (val: Record<string, Record<string, string>>) => renderLevelImages(val, 'zh'),
		span: 24,
	},
	{
		label: '英文-标签',
		field: 'levelUrlI18n',
		render: (val: Record<string, Record<string, string>>) => renderLevelImages(val, 'en'),
		span: 24,
	},
	{
		label: '日文-标签',
		field: 'levelUrlI18n',
		render: (val: Record<string, Record<string, string>>) => renderLevelImages(val, 'ja'),
		span: 24,
	},
	{
		label: '韩文-标签',
		field: 'levelUrlI18n',
		render: (val: Record<string, Record<string, string>>) => renderLevelImages(val, 'ko'),
		span: 24,
	},
	{
		label: '俄文-标签',
		field: 'levelUrlI18n',
		render: (val: Record<string, Record<string, string>>) => renderLevelImages(val, 'ru'),
		span: 24,
	},
	{
		label: '泰文-标签',
		field: 'levelUrlI18n',
		render: (val: Record<string, Record<string, string>>) => renderLevelImages(val, 'th'),
		span: 24,
	},
	{
		label: '角色背景',
		field: 'characterBackground',
		render: (val) => (val ? h('div', { innerHTML: val }) : ''),
		span: 24,
	},
	{
		label: '交互回响',
		field: 'interactionProtocol',
		render: (val) => (val ? h('div', { innerHTML: val }) : ''),
		span: 24,
	},
	{
		label: '交互协议简略',
		field: 'interactionProtocolBrief',
		render: (val) => (val ? h('div', { innerHTML: val }) : ''),
		span: 24,
	},
	{
		label: '更新时间',
		field: 'updateTime',
		span: 24,
	},
	{
		label: '创建时间',
		field: 'createTime',
		span: 24,
	},
]
