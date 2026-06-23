<template>
	<BasicDrawer v-bind="$attrs" :title="getTitle" @register="registerDrawer" width="60%" showFooter :showOkBtn="false">
		<Description @register="registerDescription" class="mt-4" />
	</BasicDrawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Description, useDescription } from '@/components/Description'
import { BasicDrawer, useDrawerInner } from '@/components/Drawer'
import { DescItemSizeEnum } from '@/enums'
import { AppLogIM } from '@/model/app-system/app-log'
import { detailSchema } from './data'

const getTitle = ref('APP日志详情')

const [registerDescription, { setDescProps }] = useDescription({
	title: 'APP日志详情',
	schema: detailSchema,
	column: DescItemSizeEnum.DEFAULT,
})

const [registerDrawer, { setDrawerProps }] = useDrawerInner((data) => {
	setDrawerProps({ loading: true, confirmLoading: false })
	const record = data.record as AppLogIM
	setDescProps({ data: record })
	getTitle.value = `APP日志详情`
	setDrawerProps({ loading: false })
})
</script>
