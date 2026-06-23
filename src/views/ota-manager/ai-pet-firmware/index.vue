<template>
	<div>
		<BasicTable @register="registerTable">
			<!-- 顶部工具栏：新增 OTA 主版本和批量删除草稿版本 -->
			<template #toolbar>
				<a-button :preIcon="IconEnum.ADD" v-auth="AiPetFirmwareAuth.ADD" type="primary" @click="handleCreate"> 新增 </a-button>
				<a-button :preIcon="IconEnum.DELETE" v-auth="AiPetFirmwareAuth.Delete" type="primary" color="error" @click="handleDelete()"> 删除 </a-button>
			</template>
			<!-- 行操作：按状态控制查看、更新、发布和删除入口 -->
			<template #action="{ record }">
				<TableAction
					:actions="[
						{
							icon: IconEnum.VIEW,
							tooltip: '查看',
							auth: AiPetFirmwareAuth.SINGLE,
							onClick: handleView.bind(null, record),
						},
						{
							icon: IconEnum.EDIT,
							tooltip: '更新',
							auth: AiPetFirmwareAuth.Update,
							ifShow: () => isDraft(record),
							onClick: handleEdit.bind(null, record),
						},
						{
							icon: 'ant-design:cloud-upload-outlined',
							tooltip: '发布',
							auth: AiPetFirmwareAuth.Release,
							ifShow: () => isDraft(record),
							onClick: handleRelease.bind(null, record),
						},
						{
							icon: IconEnum.DELETE,
							tooltip: '删除',
							auth: AiPetFirmwareAuth.Delete,
							color: 'error',
							ifShow: () => isDraft(record),
							onClick: handleDelete.bind(null, record),
						},
            {
              icon: 'ant-design:pushpin-outlined',
              tooltip: '推送设置',
              auth: AiPetFirmwareAuth.RELEASEPUSH,
              ifShow: () => record.status === AiPetFirmwareStatusEnum.RELEASED,
              onClick: handleReleasePush.bind(null, record),
            }
					]"
				/>
			</template>
		</BasicTable>
		<Info @register="firmwareRegisterModal" @success="handleSuccess" />
		<Details @register="detailRegisterDrawer" @success="handleSuccess" />
	</div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { deleteAiPetFirmwareApi, listAiPetFirmwareApi, releaseAiPetFirmwareApi, setAiPetFirmwareReleasePushApi } from '@/api/ota/aiPetFirmware.api'
import { AiPetFirmwareAuth } from '@/auth/ota'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { useDrawer } from '@/components/Drawer'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums'
import { useMessage } from '@/hooks/web/useMessage'
import { AiPetFirmwareIM, AiPetFirmwareStatusEnum } from '@/model/ota'
import { columns, normalizeFirmwareStatusByLatestUpdateTime, searchFormSchema } from './data'
import Info from './info.vue'
import Details from './details.vue'

const { createConfirm, createMessage } = useMessage()
const [firmwareRegisterModal, { openModal: openFirmwareModal }] = useModal()
const [detailRegisterDrawer, { openDrawer: openDetailDrawer }] = useDrawer()

/** 缓存表格勾选结果，供批量删除使用 */
const state = reactive<{
	ids: string[]
	idNames: string
	records: AiPetFirmwareIM[]
}>({
	ids: [],
	idNames: '',
	records: [],
})

/** AI 宠物固件 OTA 列表表格配置 */
const [registerTable, { reload }] = useTable({
	title: 'AI 宠物固件 OTA 列表',
	api: listAiPetFirmwareApi,
	striped: false,
	useSearchForm: true,
	rowKey: 'id',
	bordered: true,
	showIndexColumn: true,
	columns,
	fetchSetting: {
		listField: 'records',
		totalField: 'total',
	},
	afterFetch: (records: AiPetFirmwareIM[]) => normalizeFirmwareStatusByLatestUpdateTime(records),
	indexColumnProps: {
		fixed: 'left',
	},
	formConfig: {
		labelWidth: 120,
		schemas: searchFormSchema,
	},
	showTableSetting: true,
	tableSetting: {
		fullScreen: true,
	},
	actionColumn: {
		width: 260,
		title: '操作',
		dataIndex: 'action',
		slots: { customRender: 'action' },
	},
	rowSelection: {
		/** 同步已选主版本 ID、名称和完整记录 */
		onChange: (selectedRowKeys, selectRows) => {
			const records = selectRows as AiPetFirmwareIM[]
			state.ids = selectedRowKeys as string[]
			state.records = records
			state.idNames = records.map((item) => item.versionName).join(',')
		},
	},
})

/** 仅草稿状态允许更新、发布和删除 */
function isDraft(record: AiPetFirmwareIM) {
	return record.status === AiPetFirmwareStatusEnum.DRAFT
}

/** 打开详情抽屉 */
function handleView(record: AiPetFirmwareIM) {
	openDetailDrawer(true, { record })
}

/** 打开新增弹窗 */
function handleCreate() {
	openFirmwareModal(true, {
		isUpdate: false,
	})
}

/** 打开更新弹窗，并传入当前主版本记录 */
function handleEdit(record: AiPetFirmwareIM) {
	openFirmwareModal(true, {
		record,
		isUpdate: true,
	})
}

/** 发布草稿版本，发布成功后刷新列表 */
function handleRelease(record: AiPetFirmwareIM) {
	createConfirm({
		iconType: 'warning',
		title: '提示',
		content: `是否确定发布 ${record.versionName}?`,
		onOk: async () => {
			await releaseAiPetFirmwareApi(record.id as string)
			createMessage.success(`发布 ${record.versionName} 成功`)
			reload()
		},
	})
}

/** 发布版本推送设置，发布成功后刷新列表 */
function handleReleasePush(record: AiPetFirmwareIM) {
  const forceUpgrade = record.forceUpgrade == '0'? false : true
  const content = forceUpgrade
    ? `当前版本 ${record.versionName} 已设置为强制升级，是否取消强制升级?`
    : `当前版本 ${record.versionName} 未设置为强制升级，是否设置为强制升级?`
  const action = forceUpgrade ? `取消${record.versionName}强制升级` : `设置${record.versionName}为强制升级`
  createConfirm({
    iconType: 'warning',
    title: '提示',
    content: content,
    onOk: async () => {
      await setAiPetFirmwareReleasePushApi(record.id as string, forceUpgrade ? '0' : '1')
      createMessage.success(action)
      reload()
    },
  })
}

/** 删除单条或批量删除草稿版本 */
function handleDelete(record?: AiPetFirmwareIM) {
	const records = record?.id ? [record] : state.records
	if (records.length === 0) {
		createMessage.warning('请选择要操作的数据')
		return
	}

	const notDraftRecords = records.filter((item) => !isDraft(item))
	if (notDraftRecords.length > 0) {
		createMessage.warning('非草稿状态的 OTA 版本不能删除')
		return
	}

	const ids = records.map((item) => item.id).filter(Boolean) as string[]
	const names = records.map((item) => item.versionName).join(',')
	createConfirm({
		iconType: 'warning',
		title: '提示',
		content: `是否确定删除 ${names}?`,
		onOk: async () => {
			await Promise.all(ids.map((id) => deleteAiPetFirmwareApi(id)))
			createMessage.success(`删除 ${names} 成功`)
			reload()
		},
	})
}

/** 子弹窗/抽屉操作成功后刷新主列表 */
function handleSuccess() {
	reload()
}
</script>
