<template>
	<BasicModal v-bind="$attrs" :title="getTitle" @register="registerModal" width="1060px" :minHeight="450" :canFullscreen="true" :maskClosable="false" :centered="true" @ok="handleSubmit">
		<div class="dialog-content">
			<BasicForm @register="registerForm" @field-value-change="handleFieldValueChange">
				<template #uploadSlot="{ model, field, schema }">
					<SingleFileUpload v-model:value="model[field]" list-type="picture-card" :max-size="schema.maxSize || 10" :max-size-unit="schema.maxSizeUnit || 'MB'" :show-help-text="false" :show-delete="true" upload-text="上传图片" />
				</template>
				<template #formFooter>
					<Col :span="24" style="padding-top: 8px; width: 100%">
						<Divider orientation="left">等级亲密度标签配置</Divider>
						<div class="level-section-tip">
							<span>配置各等级解锁图片，每个等级需同时上传六种语言的图片。</span>
							<a-button type="primary" size="small" @click="addLevel">添加等级</a-button>
						</div>
						<div v-if="!levelList.length" class="level-empty">暂无等级配置，点击"添加等级"开始添加。</div>
						<div v-for="(item, index) in levelList" :key="item.localKey" class="level-card">
							<div class="level-card__header">
								<span class="level-card__title">解锁等级 {{ item.levelKey || index + 1 }}</span>
								<a-button type="link" class="level-card__delete-btn" @click="removeLevel(index)">
									<DeleteOutlined />
									<span>删除</span>
								</a-button>
							</div>
							<div class="level-card__body">
								<Form.Item label="解锁等级" :label-col="{ style: { width: '72px' } }" required style="align-items: center; margin-bottom: 16px">
									<InputNumber v-model:value="item.levelKey" :min="1" :precision="0" placeholder="正整数" style="width: 120px" />
								</Form.Item>
								<Row :gutter="12">
									<Col v-for="lang in i18nLanguages" :key="lang.code" :xs="12" :sm="8" :md="4">
										<div class="lang-upload-label">{{ lang.label }}</div>
										<SingleFileUpload v-model:value="item.urls[lang.code]" list-type="picture-card" :max-size="50" upload-api-url="/file/oss/upload" :max-size-unit="'KB'" :show-delete="true" :show-size="false" :upload-text="lang.label" />
									</Col>
								</Row>
							</div>
						</div>
					</Col>
				</template>
			</BasicForm>
		</div>
	</BasicModal>
</template>

<script setup lang="ts">
import { computed, ref, unref } from 'vue'
import { DeleteOutlined } from '@ant-design/icons-vue'
import { BasicModal, useModalInner } from '@/components/Modal'
import { BasicForm, useForm } from '@/components/Form'
import { useMessage } from '@/hooks/web/useMessage'
import { SingleFileUpload } from '@/components/FileUpload'
import { addRoleInfoApi, updateRoleInfoApi } from '@/api/deskMate/roleInfo.api'
import { RoleInfoIM } from '@/model/deskMate'
import { formSchema } from './data'
import { Row, Col, Divider, Form, InputNumber } from 'ant-design-vue'

const emit = defineEmits(['success', 'register'])
const { createMessage } = useMessage()
const isUpdate = ref(false)
const isCopy = ref(false)
const recordId = ref<string | undefined>()

// ========= 等级URL 相关状态 =========

/** 单条等级配置（前端使用），一个等级键名 + 六种语言图片 */
type LevelItem = {
	localKey: string
	levelKey: number | undefined
	urls: Record<string, string>
}

/** 国际化语言列表 */
const i18nLanguages = [
	{ code: 'zh', label: '中文' },
	{ code: 'en', label: '英文' },
	{ code: 'ja', label: '日文' },
	{ code: 'ko', label: '韩文' },
	{ code: 'ru', label: '俄文' },
	{ code: 'th', label: '泰文' },
] as const

/** 等级列表 */
const levelList = ref<LevelItem[]>([])

let levelIndex = 0

// ====================================

const [registerForm, { resetFields, setFieldsValue, validate, updateSchema, clearValidate }] = useForm({
	labelWidth: 100,
	schemas: formSchema,
	showActionButtonGroup: false,
})

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
	await resetFields()
	setModalProps({ loading: true, confirmLoading: false })
	isUpdate.value = !!data?.isUpdate
	isCopy.value = !!data?.isCopy
	recordId.value = undefined
	levelList.value = []
	levelIndex = 0
	let initialIsHidden = 0

	if ((unref(isUpdate) || unref(isCopy)) && data?.record) {
		const record = data.record as RoleInfoIM
		recordId.value = record.id
		initialIsHidden = record.isHidden ?? 0
		// features 后端存储为、分割的字符串，前端标签选择器需要数组
		const formData: Record<string, unknown> = {
			...record,
			features: record.features ? record.features.split('、') : [],
		}

		// 复制模式：清除名称、特点、设备识别码
		if (unref(isCopy)) {
			formData.name = ''
			formData.features = []
			formData.matchRole = ''
		}

		await setFieldsValue(formData)

		// 填充等级URL（从 levelUrlI18n 提取各语言URL，兼容旧 levelUrl 数据）
		const levelMap = new Map<string, { key: number; urls: Record<string, string> }>()
		const localKeyMap = new Map<string, string>()

		// 先用 levelUrl 填充中文
		if (record.levelUrl && typeof record.levelUrl === 'object') {
			for (const [rawKey, url] of Object.entries(record.levelUrl as Record<string, string>)) {
				const keyNum = extractLevelNumber(rawKey)
				if (keyNum != null && keyNum > 0) {
					const mapKey = String(keyNum)
					if (!levelMap.has(mapKey)) {
						localKeyMap.set(mapKey, createLocalKey())
						levelMap.set(mapKey, { key: keyNum, urls: {} })
					}
					levelMap.get(mapKey)!.urls['zh'] = String(url || '')
				}
			}
		}

		// 再用 levelUrlI18n 覆盖/补充各语言
		if (record.levelUrlI18n && typeof record.levelUrlI18n === 'object') {
			for (const lang of i18nLanguages) {
				const langData = (record.levelUrlI18n as Record<string, Record<string, string>>)[lang.code]
				if (langData && typeof langData === 'object') {
					for (const [rawKey, url] of Object.entries(langData)) {
						const keyNum = extractLevelNumber(rawKey)
						if (keyNum != null && keyNum > 0) {
							const mapKey = String(keyNum)
							if (!levelMap.has(mapKey)) {
								localKeyMap.set(mapKey, createLocalKey())
								levelMap.set(mapKey, { key: keyNum, urls: {} })
							}
							levelMap.get(mapKey)!.urls[lang.code] = String(url || '')
						}
					}
				}
			}
		}

		levelList.value = Array.from(levelMap.entries()).map(([mapKey, data]) => ({
			localKey: localKeyMap.get(mapKey)!,
			levelKey: data.key,
			urls: data.urls,
		}))
	}

	setModalProps({ loading: false })

	// 根据初始 isHidden 值更新 hiddenUrl 必填状态
	await updateHiddenUrlRequired(initialIsHidden)
})

const getTitle = computed(() => {
	if (unref(isCopy)) return '复制桌搭子角色'
	return unref(isUpdate) ? '编辑桌搭子角色' : '新增桌搭子角色'
})

// ========= 等级URL 工具函数 =========

/** 生成本地唯一 key */
function createLocalKey() {
	levelIndex += 1
	return `level_${Date.now()}_${levelIndex}`
}

/** 后端键名为纯数字字符串，直接解析 */
function extractLevelNumber(key: string): number | undefined {
	const num = Number(key)
	return Number.isInteger(num) && num > 0 ? num : undefined
}

/** 构建空 urls 对象 */
function createEmptyUrls(): Record<string, string> {
	const urls: Record<string, string> = {}
	for (const lang of i18nLanguages) {
		urls[lang.code] = ''
	}
	return urls
}

// ========= 等级操作 =========

/** 添加等级 */
function addLevel() {
	levelList.value.push({ localKey: createLocalKey(), levelKey: undefined, urls: createEmptyUrls() })
}

/** 删除等级 */
function removeLevel(index: number) {
	levelList.value.splice(index, 1)
}

// ====================================

// ========= 隐藏款头像动态必填 =========

/** 监听表单字段变化，当 isHidden 切换时更新 hiddenUrl 必填状态 */
async function handleFieldValueChange(key: string, value: unknown) {
	if (key === 'isHidden') {
		await updateHiddenUrlRequired(value as number)
	}
}

/** 根据 isHidden 值更新 hiddenUrl 字段的 required 和 rules */
async function updateHiddenUrlRequired(isHidden: number) {
	if (isHidden === 1) {
		await updateSchema({
			field: 'hiddenUrl',
			required: true,
			rules: [{ required: true, message: '隐藏款启用时请上传隐藏款头像', trigger: 'change' }],
		})
	} else {
		await updateSchema({
			field: 'hiddenUrl',
			required: false,
			rules: [],
		})
		// 清除该字段的校验状态
		await clearValidate('hiddenUrl')
	}
}

// ====================================

async function handleSubmit() {
	const values = await validate()
	if (!values) return

	try {
		setModalProps({ confirmLoading: true })
		// features 标签数组 → 、分割字符串
		// levelUrl 从中文（zh）URL 构建，levelUrlI18n 从各语言 URL 构建
		const payload = {
			...values,
			features: Array.isArray(values.features) ? values.features.join('、') : values.features,
			levelUrl: buildLevelUrlObject('zh'),
			levelUrlI18n: buildLevelUrlI18nObject(),
		} as unknown as RoleInfoIM
		if (unref(isUpdate)) {
			payload.id = recordId.value
			await updateRoleInfoApi(payload)
			createMessage.success('更新角色成功')
		} else {
			await addRoleInfoApi(payload)
			createMessage.success('新增角色成功')
		}
		closeModal()
		emit('success')
	} finally {
		setModalProps({ confirmLoading: false })
	}
}

/** 构建指定语言的 levelUrl 对象 */
function buildLevelUrlObject(lang: string): Record<string, string> {
	const obj: Record<string, string> = {}
	for (const item of levelList.value) {
		if (item.levelKey != null && item.levelKey > 0) {
			obj[String(item.levelKey)] = item.urls[lang] || ''
		}
	}
	return obj
}

/** 构建后端存储的 levelUrlI18n 对象 */
function buildLevelUrlI18nObject(): Record<string, Record<string, string>> {
	const obj: Record<string, Record<string, string>> = {}
	for (const lang of i18nLanguages) {
		const langObj = buildLevelUrlObject(lang.code)
		if (Object.keys(langObj).length > 0) {
			obj[lang.code] = langObj
		}
	}
	return obj
}
</script>

<style lang="scss" scoped>
.dialog-content {
	max-height: 70vh;
	overflow-y: auto;
	padding-right: 8px;
}

/* ========= 等级配置提示行 ========= */
.level-section-tip {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 16px;
	color: #909399;
	font-size: 13px;
}

.level-empty {
	padding: 16px;
	border: 1px dashed #dcdfe6;
	border-radius: 8px;
	color: #909399;
	text-align: center;
	background: #fafafa;
}

/* ========= 等级卡片 ========= */
.level-card {
	margin-bottom: 12px;
	padding: 0;
	border: 1px solid #dcdfe6;
	border-radius: 8px;
	background: #fff;
	overflow: hidden;
}

.level-card__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 18px;
	background: #fafafa;
	border-bottom: 1px solid #ebeef5;
}

.level-card__title {
	font-size: 14px;
	font-weight: 500;
	color: #303133;
}

.level-card__delete-btn {
	color: #f56c6c;
	padding: 0;
}

.level-card__body {
	align-items: center;
	padding: 24px 18px;
}

.lang-upload-label {
	font-size: 12px;
	color: #909399;
	margin-bottom: 4px;
	// text-align: center;
}

@media (max-width: 768px) {
	.level-section-tip {
		align-items: stretch;
		flex-direction: column;
		gap: 8px;
	}

	.level-section-tip .ant-btn {
		align-self: flex-end;
	}
}
</style>

<style lang="scss">
html[data-theme='dark'] {
	.level-section-tip {
		color: #8b949e;
	}

	.level-empty {
		color: #8b949e;
		background: #1a1a1a;
		border-color: #303030;
	}

	.level-card {
		background: #1a1a1a;
		border-color: #303030;
	}

	.level-card__header {
		background: #21262d;
		border-bottom-color: #303030;
	}

	.level-card__title {
		color: #e6edf3;
	}

	.lang-upload-label {
		color: #8b949e;
	}
}
</style>
