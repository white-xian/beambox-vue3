<template>
	<div>
		<BasicTable @register="registerTable">
			<template #action="{ record }">
				<TableAction
					:actions="[
						{
							icon: IconEnum.VIEW,
							tooltip: '查看',
							auth: appLogAuth.SINGLE,
							onClick: handleView.bind(null, record),
						},
					]"
				/>
			</template>
		</BasicTable>
		<Details @register="detailRegisterDrawer" />
	</div>
</template>

<script setup lang="ts">
import { listAppLogApi } from '@/api/appSystem/appLog/appLog.api'
import { appLogAuth } from '@/auth/appSystem/appLog'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { useDrawer } from '@/components/Drawer'
import { IconEnum } from '@/enums'
import { AppLogIM } from '@/model/appSystem/appLog'
import { columns, searchFormSchema } from './data'
import Details from './details.vue'

const [detailRegisterDrawer, { openDrawer: openDetailDrawer }] = useDrawer()

const [registerTable] = useTable({
	title: 'APP日志',
	api: listAppLogApi,
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
		width: 100,
		title: '操作',
		dataIndex: 'action',
		slots: { customRender: 'action' },
	},
	rowSelection: {
		type: 'checkbox',
	},
})

function handleView(record: AppLogIM) {
	openDetailDrawer(true, { record })
}
</script>

<style scoped>
:deep(.range-picker-center .ant-picker-input > input) {
	text-align: center;
}
</style>
