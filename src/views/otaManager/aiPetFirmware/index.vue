<template>
	<div>
		<BasicTable @register="registerTable">
			<template #toolbar>
				<a-button :preIcon="IconEnum.ADD" v-auth="AiPetFirmwareAuth.ADD" type="primary" @click="handleCreate"> 新增 </a-button>
				<a-button :preIcon="IconEnum.DELETE" v-auth="AiPetFirmwareAuth.Delete" type="primary" color="error" @click="handleDelete()"> 删除 </a-button>
			</template>
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
import { deleteAiPetFirmwareApi, listAiPetFirmwareApi, releaseAiPetFirmwareApi } from '@/api/ota/aiPetFirmware.api'
import { AiPetFirmwareAuth } from '@/auth/ota'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { useDrawer } from '@/components/Drawer'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums'
import { useMessage } from '@/hooks/web/useMessage'
import { AiPetFirmwareIM, AiPetFirmwareStatusEnum } from '@/model/ota'
import { columns, searchFormSchema } from './data'
import Info from './info.vue'
import Details from './details.vue'

const { createConfirm, createMessage } = useMessage()
const [firmwareRegisterModal, { openModal: openFirmwareModal }] = useModal()
const [detailRegisterDrawer, { openDrawer: openDetailDrawer }] = useDrawer()

const state = reactive<{
	ids: string[]
	idNames: string
	records: AiPetFirmwareIM[]
}>({
	ids: [],
	idNames: '',
	records: [],
})

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
		onChange: (selectedRowKeys, selectRows) => {
			const records = selectRows as AiPetFirmwareIM[]
			state.ids = selectedRowKeys as string[]
			state.records = records
			state.idNames = records.map((item) => item.versionName).join(',')
		},
	},
})

function isDraft(record: AiPetFirmwareIM) {
	return record.status !== AiPetFirmwareStatusEnum.RELEASED
}

function handleView(record: AiPetFirmwareIM) {
	openDetailDrawer(true, { record })
}

function handleCreate() {
	openFirmwareModal(true, {
		isUpdate: false,
	})
}

function handleEdit(record: AiPetFirmwareIM) {
	openFirmwareModal(true, {
		record,
		isUpdate: true,
	})
}

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

function handleDelete(record?: AiPetFirmwareIM) {
	const records = record?.id ? [record] : state.records
	if (records.length === 0) {
		createMessage.warning('请选择要操作的数据')
		return
	}

	const releasedRecords = records.filter((item) => !isDraft(item))
	if (releasedRecords.length > 0) {
		createMessage.warning('已发布的 OTA 版本不能删除')
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

function handleSuccess() {
	reload()
}
</script>
