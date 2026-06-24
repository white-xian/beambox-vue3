<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button
          :preIcon="IconEnum.ADD"
          v-auth="CarouselAuth.ADD"
          @click="handleCreate"
          type="primary"
        >
          新增
        </a-button>
        <a-button
          :preIcon="IconEnum.DELETE"
          v-auth="CarouselAuth.DEL"
          @click="handleDelete"
          type="primary"
          color="error"
        >
          删除
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'imageUrl'">
          <img
            v-if="record.imageUrl"
            :src="record.imageUrl"
            class="w-15 h-9 object-cover rounded cursor-pointer"
            @click="handlePreview(record.imageUrl)"
          />
          <span v-else>-</span>
        </template>
        <template v-else-if="column.dataIndex === 'action'">
          <TableAction
            :actions="[
              {
                icon: IconEnum.VIEW,
                tooltip: '查看',
                auth: CarouselAuth.SINGLE,
                onClick: handleView.bind(null, record),
              },
              {
                icon: IconEnum.EDIT,
                tooltip: '编辑',
                auth: CarouselAuth.EDIT,
                onClick: handleEdit.bind(null, record),
              },
              {
                icon: IconEnum.DELETE,
                tooltip: '删除',
                auth: CarouselAuth.DEL,
                color: 'error',
                onClick: handleDelete.bind(null, record),
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <CarouselModal @register="registerModal" @success="handleSuccess" />
    <CarouselDetail @register="registerDetail" />
  </div>
</template>

<script setup lang="ts">
  import { reactive } from 'vue'
  import { delCarouselApi, listCarouselApi } from '@/api/apps/home/carousel.api'
  import { CarouselAuth } from '@/auth/apps/home'
  import { useModal } from '@/components/Modal'
  import { useDrawer } from '@/components/Drawer'
  import { useMessage } from '@/hooks/web/useMessage'
  import { IconEnum } from '@/enums'
  import { BasicTable, TableAction, useTable } from '@/components/Table'
  import { columns, searchFormSchema } from './carousel.data'
  import CarouselModal from './CarouselModal.vue'
  import CarouselDetail from './CarouselDetail.vue'

  const { createMessage, createConfirm } = useMessage()
  const [registerModal, { openModal }] = useModal()
  const [registerDetail, { openDrawer: openDetail }] = useDrawer()

  const state = reactive<{
    ids: string[]
    idNames: string
  }>({
    ids: [],
    idNames: '',
  })

  const [registerTable, { reload }] = useTable({
    title: '轮播图列表',
    api: listCarouselApi,
    striped: false,
    useSearchForm: true,
    rowKey: 'carouselId',
    bordered: true,
    showIndexColumn: true,
    columns,
    fetchSetting: {
      listField: 'data',
      totalField: 'total',
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
      width: 160,
      title: '操作',
      dataIndex: 'action',
      slots: { customRender: 'action' },
    },
    rowSelection: {
      onChange: (selectedRowKeys, selectRows) => {
        state.ids = selectedRowKeys as string[]
        state.idNames = selectRows
          .map((item) => item.title)
          .join(',')
      },
    },
  })

  /** 预览图片 */
  function handlePreview(url: string) {
    window.open(url, '_blank')
  }

  /** 查看按钮 */
  function handleView(record: Recordable) {
    openDetail(true, { record })
  }

  /** 新增按钮 */
  function handleCreate() {
    openModal(true, {
      isUpdate: false,
    })
  }

  /** 修改按钮 */
  function handleEdit(record: Recordable) {
    openModal(true, {
      record,
      isUpdate: true,
    })
  }

  /** 删除按钮 */
  function handleDelete(record?: Recordable) {
    const delIds: string[] = record?.carouselId
      ? [record.carouselId]
      : (state.ids as string[])
    const delNames = record?.title || state.idNames
    if (!record && state.ids.length === 0) {
      createMessage.warning('请选择要操作的数据！')
    } else {
      createConfirm({
        iconType: 'warning',
        title: '提示',
        content: '是否确定要删除「' + delNames + '」？',
        onOk: () =>
          Promise.all(delIds.map((id) => delCarouselApi(id))).then(() => {
            createMessage.success('删除「' + delNames + '」成功！')
            reload()
          }),
      })
    }
  }

  function handleSuccess() {
    reload()
  }
</script>

<style scoped>
.w-15 {
  width: 60px;
}
.h-9 {
  height: 36px;
}
</style>
