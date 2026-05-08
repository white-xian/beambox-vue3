<!-- @format -->

<template>
	<BasicModal v-bind="$attrs" :title="getTitle" @register="registerModal" width="1060px" :minHeight="420" :canFullscreen="false" :maskClosable="false" wrapClassName="ai-pet-firmware-modal" @ok="handleSubmit">
		<div class="dialog-content">
			<el-form ref="formRef" :model="formModel" :rules="rules" label-width="96px">
				<el-row :gutter="16" class="basic-info-row">
					<el-col :xs="24" :md="12">
						<el-form-item label="主版本号" prop="versionCode">
							<el-input-number v-model="formModel.versionCode" :min="1" :precision="0" controls-position="right" style="width: 100%" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :md="12">
						<el-form-item label="主版本名称" prop="versionName">
							<el-input v-model="formModel.versionName" placeholder="例如 v1.0.0" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :md="12">
						<el-form-item label="状态">
							<el-radio-group v-model="formModel.status" disabled>
								<el-radio :value="AiPetFirmwareStatusEnum.DRAFT">草稿</el-radio>
								<el-radio :value="AiPetFirmwareStatusEnum.RELEASED">已发布</el-radio>
							</el-radio-group>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :md="12">
						<el-form-item label="附属包数量">
							<span class="package-count">{{ formModel.packages.length }} 条</span>
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="升级说明" prop="description">
							<el-input v-model="formModel.description" type="textarea" :rows="4" placeholder="请输入本次 OTA 升级说明" />
						</el-form-item>
					</el-col>
				</el-row>

				<el-divider content-position="left">附属包配置</el-divider>

				<div class="package-toolbar">
					<span class="package-toolbar__tip"> 支持配置多个模块的固件附属包，附属包项可按需新增。 </span>
					<el-button type="primary" plain size="small" @click="addPackage"> 添加附属包 </el-button>
				</div>

				<div v-if="!formModel.packages.length" class="package-empty">暂无附属包配置，点击右上角"添加附属包"开始添加。</div>

				<div v-for="(record, index) in formModel.packages" :key="record.localKey" class="package-card">
					<div class="package-card__header">
						<span>附属包 {{ index + 1 }}</span>
						<el-button link :disabled="formModel.packages.length <= 1" :style="{ color: formModel.packages.length <= 1 ? '#303133' : '#409eff' }" @click="removePackage(index)">
							<el-icon><Delete /></el-icon>
							<span style="margin-left: 2px">删除</span>
						</el-button>
					</div>

					<el-row :gutter="12" style="align-items: center">
						<el-col :xs="24" :md="7">
							<el-form-item label="模块编码" required label-width="84px">
								<el-input v-model="record.moduleCode" placeholder="MAIN/MCU/UI/RESOURCE" @blur="normalizeModuleCode(record)" />
							</el-form-item>
						</el-col>
						<el-col :xs="24" :md="7">
							<el-form-item label="模块名称" required label-width="84px">
								<el-input v-model="record.moduleName" placeholder="例如 MCU 固件" />
							</el-form-item>
						</el-col>
						<el-col :xs="24" :md="10">
							<el-form-item label="固件文件" required label-width="84px" style="align-items: center">
								<el-upload :show-file-list="false" :http-request="(options: any) => handlePackageUpload(options, record)">
									<el-tooltip :content="getPackageFileTip(record)" placement="top">
										<div
											class="package-file-icon"
											:class="{
												'is-uploaded': !!record.fileUrl,
												'is-uploading': record.uploading,
											}"
										>
											<LoadingOutlined v-if="record.uploading" spin />
											<FileOutlined v-else />
										</div>
									</el-tooltip>
								</el-upload>
							</el-form-item>
						</el-col>
					</el-row>
				</div>
			</el-form>
		</div>
	</BasicModal>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, unref } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { LoadingOutlined, FileOutlined } from '@ant-design/icons-vue'
import { BasicModal, useModalInner } from '@/components/Modal'
import { useMessage } from '@/hooks/web/useMessage'
import { fileUploadApi } from '@/api/sys/upload.api'
import { addAiPetFirmwareApi, updateAiPetFirmwareApi } from '@/api/ota/aiPetFirmware.api'
import { AiPetFirmwareIM, AiPetFirmwarePackageIM, AiPetFirmwareStatusEnum } from '@/model/ota'
import type { FormInstance, FormRules } from 'element-plus'

type PackageFormItem = AiPetFirmwarePackageIM & {
	localKey: string
	uploading?: boolean
	uploadPercent?: number
}

interface FirmwareFormModel {
	id?: string
	versionCode?: number
	versionName: string
	description: string
	status?: AiPetFirmwareStatusEnum
	packages: PackageFormItem[]
}

const emit = defineEmits(['success', 'register'])
const { createMessage } = useMessage()
const isUpdate = ref(false)
const formRef = ref<FormInstance | null>(null)
let packageIndex = 0

const moduleNameMap: Record<string, string> = {
	MAIN: '主控固件',
	MCU: 'MCU 固件',
	UI: 'UI 资源包',
	RESOURCE: '资源包',
}

const formModel = reactive<FirmwareFormModel>({
	versionCode: undefined,
	versionName: '',
	description: '',
	status: AiPetFirmwareStatusEnum.DRAFT,
	packages: [],
})

const rules: FormRules = {
	versionCode: [{ required: true, message: '请输入主版本号', trigger: 'change' }],
	versionName: [{ required: true, message: '请输入主版本名称', trigger: 'blur' }],
	description: [{ required: true, message: '请输入升级说明', trigger: 'blur' }],
}

const [registerModal, { setModalProps, closeModal }] = useModalInner((data) => {
	resetForm()
	setModalProps({ loading: true, confirmLoading: false })
	isUpdate.value = !!data?.isUpdate

	if (unref(isUpdate) && data?.record) {
		const record = data.record as AiPetFirmwareIM
		formModel.id = record.id
		formModel.versionCode = record.versionCode
		formModel.versionName = record.versionName
		formModel.description = record.description
		formModel.status = record.status ?? AiPetFirmwareStatusEnum.DRAFT
		formModel.packages = (record.packages || []).map((item) => ({
			...item,
			localKey: createLocalKey(),
			uploading: false,
			uploadPercent: item.fileUrl ? 100 : 0,
		}))
	}

	if (formModel.packages.length === 0) {
		addPackage()
	}

	setModalProps({ loading: false })
})

const getTitle = computed(() => (unref(isUpdate) ? '更新 AI 宠物固件 OTA' : '新增 AI 宠物固件 OTA'))

function createLocalKey() {
	packageIndex += 1
	return `package_${Date.now()}_${packageIndex}`
}

function createPackage(): PackageFormItem {
	return {
		localKey: createLocalKey(),
		moduleCode: '',
		moduleName: '',
		fileName: '',
		fileUrl: '',
		fileSize: '',
		uploading: false,
		uploadPercent: 0,
	}
}

function resetForm() {
	formModel.id = undefined
	formModel.versionCode = undefined
	formModel.versionName = ''
	formModel.description = ''
	formModel.status = AiPetFirmwareStatusEnum.DRAFT
	formModel.packages = []
}

function addPackage() {
	formModel.packages.push(createPackage())
	nextTick(() => formRef.value?.clearValidate())
}

function removePackage(index: number) {
	formModel.packages.splice(index, 1)
	nextTick(() => formRef.value?.clearValidate())
}

function normalizeModuleCode(record: PackageFormItem) {
	const moduleCode = record.moduleCode?.trim().toUpperCase()
	record.moduleCode = moduleCode
	if (!record.moduleName && moduleCode && moduleNameMap[moduleCode]) {
		record.moduleName = moduleNameMap[moduleCode]
	}
}

function normalizeText(value: unknown) {
	return String(value ?? '').trim()
}

function getPackageFileTip(record: PackageFormItem) {
	if (record.uploading) {
		return `上传中 ${record.uploadPercent || 0}%`
	}
	return record.fileName || '点击上传固件文件'
}

function pickUploadValue(data: Recordable, keys: string[]) {
	for (const key of keys) {
		const value = data?.[key]
		if (value !== undefined && value !== null && value !== '') {
			return value
		}
	}
	return undefined
}

function normalizeUploadResult(response: Recordable, file: File) {
	const responseData = response?.data || response || {}
	const data = responseData?.data || responseData
	const fileUrl = (typeof data === 'string' ? data : pickUploadValue(data, ['fileUrl', 'url', 'ossUrl', 'path'])) || ''
	const fileName = pickUploadValue(data, ['fileName', 'name', 'originalName', 'originalFilename']) || file.name
	const fileSize = pickUploadValue(data, ['fileSize', 'size']) ?? file.size

	return {
		fileName: String(fileName || ''),
		fileUrl: String(fileUrl || ''),
		fileSize: normalizeText(fileSize),
	}
}

async function handlePackageUpload(options: Recordable, record: PackageFormItem) {
	const file = options.file as File
	record.uploading = true
	record.uploadPercent = 0

	try {
		const response = await fileUploadApi({ name: 'file', file }, (progressEvent) => {
			const total = progressEvent.total || file.size || 0
			record.uploadPercent = total ? Math.min(100, Math.round((progressEvent.loaded / total) * 100)) : 0
		})
		const responseData = response?.data || {}

		if (responseData?.code && responseData.code !== 200) {
			throw new Error(responseData.message || '上传失败')
		}

		const uploadResult = normalizeUploadResult(response, file)
		if (!uploadResult.fileUrl) {
			throw new Error('上传接口未返回文件地址')
		}

		record.fileName = uploadResult.fileName
		record.fileUrl = uploadResult.fileUrl
		record.fileSize = uploadResult.fileSize
		record.uploadPercent = 100
		createMessage.success('固件文件上传成功')
	} catch (error: any) {
		createMessage.error(error?.message || '固件文件上传失败')
		throw error
	} finally {
		record.uploading = false
	}
}

function buildPayload(): AiPetFirmwareIM {
	return {
		id: formModel.id,
		versionCode: Number(formModel.versionCode),
		versionName: formModel.versionName.trim(),
		description: formModel.description.trim(),
		status: formModel.status,
		packages: formModel.packages.map((item) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { localKey, uploading, uploadPercent, ...packageItem } = item
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

async function handleSubmit() {
	if (!formRef.value) return

	try {
		await formRef.value.validate()
	} catch {
		return
	}

	// 自定义验证附属包
	if (formModel.packages.length === 0) {
		createMessage.warning('请至少添加一个附属包')
		return
	}

	const invalidModuleIndex = formModel.packages.findIndex((item) => !item.moduleCode?.trim() || !item.moduleName?.trim())
	if (invalidModuleIndex > -1) {
		createMessage.warning(`请完善第 ${invalidModuleIndex + 1} 个附属包模块信息`)
		return
	}

	const invalidFileIndex = formModel.packages.findIndex((item) => !item.fileName?.trim() || !item.fileUrl?.trim() || !normalizeText(item.fileSize))
	if (invalidFileIndex > -1) {
		createMessage.warning(`请上传第 ${invalidFileIndex + 1} 个附属包文件`)
		return
	}

	try {
		setModalProps({ confirmLoading: true })
		const payload = buildPayload()
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
	max-height: 68vh;
	overflow-y: auto;
	padding-right: 8px;
}

.basic-info-row > .el-col {
	display: flex;
}

.basic-info-row > .el-col :deep(.el-form-item) {
	width: 100%;
}

.package-count {
	color: #606266;
	line-height: 32px;
}

.package-toolbar {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 12px;
	margin-bottom: 12px;
}

.package-toolbar__tip {
	flex: 1;
	color: #606266;
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

.package-card {
	margin-bottom: 12px;
	padding: 16px 18px 4px;
	border: 1px solid #dcdfe6;
	border-radius: 8px;
	background: #fff;
	align-items: center;
}

.package-card__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
	color: #606266;
	font-weight: 500;
}

.package-file-icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 56px;
	height: 40px;
	border-radius: 8px;
	color: #b8c1cc;
	background: #f4f6fb;
	cursor: pointer;
	transition:
		color 0.2s ease,
		background-color 0.2s ease;
}

.package-file-icon:hover,
.package-file-icon.is-uploaded {
	color: #409eff;
	background: #ecf5ff;
}

.package-file-icon.is-uploading {
	color: #409eff;
}

@media (max-width: 768px) {
	.package-toolbar {
		align-items: stretch;
		flex-direction: column;
	}

	.package-toolbar .el-button {
		align-self: flex-end;
	}
}
</style>
