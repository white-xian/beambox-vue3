import { FormSchema } from '@/components/Form'
import { AiPetFirmwareStatusEnum } from '@/model/ota'

export const formSchema: FormSchema[] = [
	{
		field: 'versionName',
		label: '固件版本',
		component: 'Input',
		componentProps: ({ formModel }) => ({
			addonBefore: 'V',
			placeholder: '例如 1.0.0',
			onChange(e: any) {
				const value = String(e?.target?.value ?? e ?? '')
					.replace(/^[vV]/, '')
					.replace(/[^\d.]/g, '')
				formModel.versionName = value
				const code = value.replace(/\./g, '')
				formModel.versionCode = code ? Number(code) : undefined
			},
		}),
		required: true,
		rules: [{ required: true, message: '请输入固件版本名称', trigger: 'blur' }],
		colProps: { xs: 24, md: 12 },
	},
	{
		field: 'versionCode',
		label: '固件版本号',
		component: 'InputNumber',
		componentProps: {
			disabled: true,
			min: 1,
			precision: 0,
			style: { width: '100%' },
		},
		rules: [{ required: true, message: '请输入固件版本号', trigger: 'change' }],
		colProps: { xs: 24, md: 12 },
	},
	{
		field: 'subVersionCode',
		label: '美术包版本',
		component: 'InputNumber',
		componentProps: {
			min: 1,
			precision: 0,
			step: 1,
			placeholder: '同一固件版本下的美术包版本号，例如 1、2',
			style: { width: '100%' },
			parser: (value: string) => value?.replace(/[^\d]/g, '') ?? '',
		},
    rules: [{ required: true, message: '请输入美术包版本号', trigger: 'change' }],
		colProps: { xs: 24, md: 12 },
	},
	{
		field: 'status',
		label: '状态',
		component: 'RadioGroup',
		componentProps: {
			disabled: true,
			options: [
				{ label: '草稿', value: AiPetFirmwareStatusEnum.DRAFT },
				{ label: '已发布', value: AiPetFirmwareStatusEnum.RELEASED },
			],
		},
		defaultValue: AiPetFirmwareStatusEnum.DRAFT,
		colProps: { xs: 24, md: 12 },
	},
	{
		field: 'description',
		label: '升级说明',
		component: 'InputTextArea',
		componentProps: {
			rows: 4,
			placeholder: '请输入本次 OTA 升级说明',
		},
		required: true,
		rules: [{ required: true, message: '请输入升级说明', trigger: 'blur' }],
		colProps: { span: 24 },
	},
]
