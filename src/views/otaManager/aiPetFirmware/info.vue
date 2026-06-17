<!-- @format -->

<template>
	<BasicModal v-bind="$attrs" :title="getTitle" @register="registerModal" width="1060px" :minHeight="450" :canFullscreen="true" :maskClosable="false" :centered="true" wrapClassName="ai-pet-firmware-modal" @ok="handleSubmit">
		<div class="dialog-content">
			<BasicForm @register="registerForm" class="basic-info-form">
				<template #formFooter>
					<Col :span="24" style="padding-top: 8px; width: 100%">
						<Divider orientation="left">附属包配置共 {{ packageList.length }} 条</Divider>
						<div class="package-section-tip">
							<span>支持配置多个模块的固件附属包，附属包项可按需新增。</span>
							<a-button type="primary" size="small" @click="addPackage"> 添加附属包 </a-button>
						</div>
						<!-- 空状态提示 -->
						<div v-if="!packageList.length" class="package-empty">暂无附属包配置，点击右上角"添加附属包"开始添加。</div>
						<!-- 附属包表单卡片 -->
						<div v-for="(record, index) in packageList" :key="record.localKey" class="package-card">
							<div class="package-card__header">
								<span class="package-card__title">附属包 {{ index + 1 }}</span>
								<a-button type="link" :disabled="packageList.length <= 1" class="package-card__delete-btn" @click="removePackage(index)">
									<DeleteOutlined />
									<span>删除</span>
								</a-button>
							</div>
							<Row :gutter="16" class="package-card__body">
								<Col :span="8">
									<Form.Item label="模块编码" :label-col="{ style: { width: '72px' } }" required>
										<a-input disabled v-model:value="record.moduleCode" placeholder="MAIN/MCU/UI/RESOURCE" @blur="normalizeModuleCode(record)" />
									</Form.Item>
								</Col>
								<Col :span="8">
									<Form.Item label="模块名称" :label-col="{ style: { width: '72px' } }" required>
										<a-input v-model:value="record.moduleName" placeholder="例如 MCU 固件" />
									</Form.Item>
								</Col>
								<Col :span="8">
									<Form.Item label="固件文件" :label-col="{ style: { width: '72px' } }" required style="align-items: center">
										<SingleFileUpload v-model:value="record.fileUrl" list-type="picture-card" :max-size="200" :upload="'/file/oss/upload'" :show-delete="true" :show-size="false" upload-text="上传固件" @upload-success="(item: any) => onPackageUploadSuccess(record, item)" />
									</Form.Item>
								</Col>
							</Row>
						</div>
					</Col>
				</template>
			</BasicForm>
		</div>
	</BasicModal>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, unref } from 'vue'
import { DeleteOutlined } from '@ant-design/icons-vue'
import { BasicModal, useModalInner } from '@/components/Modal'
import { BasicForm, useForm } from '@/components/Form'
import { useMessage } from '@/hooks/web/useMessage'
import { SingleFileUpload } from '@/components/FileUpload'
import { addAiPetFirmwareApi, updateAiPetFirmwareApi } from '@/api/ota/aiPetFirmware.api'
import { AiPetFirmwareIM, AiPetFirmwarePackageIM, AiPetFirmwareStatusEnum } from '@/model/ota'
import { formSchema } from './info.data'
import { Row, Col, Divider, Form } from 'ant-design-vue'

/** 前端表单使用的附属包项，比接口模型多本地 key */
type PackageFormItem = AiPetFirmwarePackageIM & {
	localKey: string
}

const emit = defineEmits(['success', 'register'])
const { createMessage } = useMessage()
const isUpdate = ref(false)
const recordId = ref<string | undefined>()
const packageList = ref<PackageFormItem[]>([])
let packageIndex = 0

const [registerForm, { resetFields, setFieldsValue, validate, clearValidate }] = useForm({
	labelWidth: 96,
	schemas: formSchema,
	showActionButtonGroup: false,
})

/** 常用模块编码与模块名称映射，用于输入编码后自动补全名称 */
const moduleNameMap: Record<string, string> = {
	MAIN: '主控固件',
	MCU: 'MCU 固件',
	UI: 'UI 资源包',
	RESOURCE: '资源包',
}

/** 打开弹窗时根据新增/更新模式初始化表单 */
const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
	await resetFields()
	setModalProps({ loading: true, confirmLoading: false })
	isUpdate.value = !!data?.isUpdate
	recordId.value = undefined
	packageList.value = []

	if (unref(isUpdate) && data?.record) {
		const record = data.record as AiPetFirmwareIM
		recordId.value = record.id
		await setFieldsValue({
			versionName: normalizeVersionNameInput(record.versionName),
			versionCode: getVersionCodeByName(record.versionName) ?? record.versionCode,
			description: record.description,
			status: record.status ?? AiPetFirmwareStatusEnum.DRAFT,
		})
		packageList.value = (record.packages || []).map((item) => ({
			...item,
			localKey: createLocalKey(),
		}))
	} else {
		await setFieldsValue({
			status: AiPetFirmwareStatusEnum.DRAFT,
		})
	}

	if (packageList.value.length === 0) {
		addPackage()
	}

	setModalProps({ loading: false })
})

/** 根据弹窗模式展示标题 */
const getTitle = computed(() => (unref(isUpdate) ? '更新 AI 宠物固件 OTA' : '新增 AI 宠物固件 OTA'))

/** 生成本地唯一 key，保证附属包表单项渲染稳定 */
function createLocalKey() {
	packageIndex += 1
	return `package_${Date.now()}_${packageIndex}`
}

/** 创建一个空的附属包表单项 */
function createPackage(): PackageFormItem {
	return {
		localKey: createLocalKey(),
		moduleCode: '',
		moduleName: '',
		fileName: '',
		fileUrl: '',
		fileSize: '',
	}
}

/** 仅为新建附属包自动分配 moduleCode（纯数字序号），不覆盖已有编码 */
function assignDefaultModuleCode(record: PackageFormItem, index: number) {
	if (!record.moduleCode || /^\d+$/.test(record.moduleCode)) {
		record.moduleCode = String(index + 1)
	}
}

/** 添加一个附属包，并清理旧校验状态 */
function addPackage() {
	packageList.value.push(createPackage())
	packageList.value.forEach((item, idx) => assignDefaultModuleCode(item, idx))
	nextTick(() => {
		clearValidate()
	})
}

/** 删除指定附属包，并清理旧校验状态 */
function removePackage(index: number) {
	packageList.value.splice(index, 1)
	packageList.value.forEach((item, idx) => assignDefaultModuleCode(item, idx))
	nextTick(() => clearValidate())
}

/** 规范化模块编码，并在命中常用编码时自动填充模块名称 */
function normalizeModuleCode(record: PackageFormItem) {
	const moduleCode = record.moduleCode?.trim().toUpperCase()
	record.moduleCode = moduleCode
	if (!record.moduleName && moduleCode && moduleNameMap[moduleCode]) {
		record.moduleName = moduleNameMap[moduleCode]
	}
}

/** 统一把任意值整理成去空格字符串 */
function normalizeText(value: unknown) {
	return String(value ?? '').trim()
}

/** 去掉用户误输入的 V 前缀，并保留版本号需要的数字和点 */
function normalizeVersionNameInput(value: string) {
	return normalizeText(value)
		.replace(/^[vV]/, '')
		.replace(/[^\d.]/g, '')
}

/** 根据主版本名称去掉点号后生成主版本号 */
function getVersionCodeByName(value: string) {
	const versionCode = normalizeVersionNameInput(value ?? '').replace(/\./g, '')
	return versionCode ? Number(versionCode) : undefined
}

/** FileUpload 上传成功后，将文件名和大小同步到附属包表单项 */
function onPackageUploadSuccess(record: PackageFormItem, uploadItem: { name: string; size: number; url: string }) {
	record.fileName = uploadItem.name || ''
	record.fileUrl = uploadItem.url || ''
	record.fileSize = String(uploadItem.size || '')
}

/** 构造后端新增/更新接口需要的 payload */
function buildPayload(values: Recordable): AiPetFirmwareIM {
	const versionName = values.versionName ? `V${values.versionName}` : ''

	return {
		id: recordId.value,
		versionCode: getVersionCodeByName(values.versionName) ?? Number(values.versionCode),
		versionName,
		description: (values.description || '').trim(),
		status: values.status,
		packages: packageList.value.map((item) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { localKey, ...packageItem } = item
			return {
				...packageItem,
				moduleCode: packageItem.moduleCode.trim(),
				moduleName: packageItem.moduleName.trim(),
				fileName: packageItem.fileName.trim(),
				fileUrl: packageItem.fileUrl.trim(),
				fileSize: normalizeText(packageItem.fileSize),
			}
		}),
	}
}

/** 提交新增或更新表单 */
async function handleSubmit() {
	let values: Recordable
	try {
		values = await validate()
	} catch {
		return
	}

	// 自定义验证附属包
	if (packageList.value.length === 0) {
		createMessage.warning('请至少添加一个附属包')
		return
	}

	const invalidModuleIndex = packageList.value.findIndex((item) => !item.moduleCode?.trim() || !item.moduleName?.trim())
	if (invalidModuleIndex > -1) {
		createMessage.warning(`请完善第 ${invalidModuleIndex + 1} 个附属包模块信息`)
		return
	}

	const invalidFileIndex = packageList.value.findIndex((item) => !item.fileName?.trim() || !item.fileUrl?.trim() || !normalizeText(item.fileSize))
	if (invalidFileIndex > -1) {
		createMessage.warning(`请上传第 ${invalidFileIndex + 1} 个附属包文件`)
		return
	}

	try {
		setModalProps({ confirmLoading: true })
		const payload = buildPayload(values)
		if (unref(isUpdate)) {
			await updateAiPetFirmwareApi(payload)
			createMessage.success('更新 AI 宠物固件 OTA 成功')
		} else {
			await addAiPetFirmwareApi(payload)
			createMessage.success('新增 AI 宠物固件 OTA 成功')
		}
		closeModal()
		emit('success')
	} finally {
		setModalProps({ confirmLoading: false })
	}
}
</script>

<style lang="scss" scoped>
.dialog-content {
	max-height: 70vh;
	overflow-y: auto;
	padding-right: 8px;
}

/* ========= 附属包提示行 ========= */
.package-section-tip {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 16px;
	color: #909399;
	font-size: 13px;
}

.package-empty {
	padding: 16px;
	border: 1px dashed #dcdfe6;
	border-radius: 8px;
	color: #909399;
	text-align: center;
	background: #fafafa;
}

/* ========= 附属包卡片 ========= */
.package-card {
	margin-bottom: 12px;
	padding: 0;
	border: 1px solid #dcdfe6;
	border-radius: 8px;
	background: #fff;
	overflow: hidden;
}

.package-card__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 18px;
	background: #fafafa;
	border-bottom: 1px solid #ebeef5;
}

.package-card__title {
	font-size: 14px;
	font-weight: 500;
	color: #303133;
}

.package-card__delete-btn {
	color: #f56c6c;
	padding: 0;
}

.package-card__body {
	align-items: center;
	padding: 24px 18px 4px;
}

@media (max-width: 768px) {
	.package-section-tip {
		align-items: stretch;
		flex-direction: column;
		gap: 8px;
	}

	.package-section-tip .ant-btn {
		align-self: flex-end;
	}
}
</style>

<style lang="scss">
html[data-theme='dark'] {
	.ai-pet-firmware-modal {
		.ant-divider-inner-text {
			color: #c9d1d9;
			background: #151515;
		}

		.package-section-tip {
			color: #8b949e;
		}

		.package-empty {
			color: #8b949e;
			background: #1a1a1a;
			border-color: #303030;
		}

		.package-card {
			background: #1a1a1a;
			border-color: #303030;
		}

		.package-card__header {
			background: #21262d;
			border-bottom-color: #303030;
		}

		.package-card__title {
			color: #e6edf3;
		}
	}
}
</style>
