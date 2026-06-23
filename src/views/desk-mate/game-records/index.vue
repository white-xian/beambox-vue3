<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button :preIcon="IconEnum.ADD" v-auth="deskMateGameRecordAuth.ADD" type="primary" @click="handleCreate"> 新增 </a-button>
        <a-button :preIcon="IconEnum.DELETE" v-auth="deskMateGameRecordAuth.Delete" type="primary" color="error" @click="handleDelete()"> 删除 </a-button>
      </template>
      <template #action="{ record }">
        <TableAction
          :actions="[
            {
              icon: IconEnum.VIEW,
              tooltip: '查看',
              auth: deskMateGameRecordAuth.SINGLE,
              onClick: handleView.bind(null, record),
            },
            {
              icon: IconEnum.EDIT,
              tooltip: '编辑',
              auth: deskMateGameRecordAuth.Update,
              onClick: handleEdit.bind(null, record),
            },
            {
              icon: IconEnum.DELETE,
              tooltip: '删除',
              auth: deskMateGameRecordAuth.Delete,
              color: 'error',
              onClick: handleDelete.bind(null, record),
            },
          ]"
        />
      </template>
    </BasicTable>
    <Info @register="gameRecordRegisterModal" @success="handleSuccess" />
    <Details @register="detailRegisterDrawer" />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { deleteGameRecordsApi, listGameRecordsApi } from '@/api/deskMate/gameRecords.api';
import { deskMateGameRecordAuth } from '@/auth/deskMate';
import { BasicTable, TableAction, useTable } from '@/components/Table';
import { useDrawer } from '@/components/Drawer';
import { useModal } from '@/components/Modal';
import { IconEnum } from '@/enums';
import { useMessage } from '@/hooks/web/useMessage';
import { GameRecordsLM } from '@/model/deskMate';
import { columns, searchFormSchema } from './data';
import Info from './info.vue';
import Details from './details.vue';

const { createConfirm, createMessage } = useMessage();
const [gameRecordRegisterModal, { openModal: openGameRecordModal }] = useModal();
const [detailRegisterDrawer, { openDrawer: openDetailDrawer }] = useDrawer();

const state = reactive<{
  ids: string[];
  idNames: string;
  records: GameRecordsLM[];
}>({
  ids: [],
  idNames: '',
  records: [],
});

const [registerTable, { reload }] = useTable({
  title: '游戏记录',
  api: listGameRecordsApi,
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
    width: 200,
    title: '操作',
    dataIndex: 'action',
    slots: { customRender: 'action' },
  },
  rowSelection: {
    onChange: (selectedRowKeys, selectRows) => {
      const records = selectRows as GameRecordsLM[];
      state.ids = selectedRowKeys as string[];
      state.records = records;
      state.idNames = records.map((item) => item.gameName).join(',');
    },
  },
});

function handleView(record: GameRecordsLM) {
  openDetailDrawer(true, { record });
}

function handleCreate() {
  openGameRecordModal(true, { isUpdate: false });
}

function handleEdit(record: GameRecordsLM) {
  openGameRecordModal(true, { record, isUpdate: true });
}

function handleDelete(record?: GameRecordsLM) {
  const records = record?.id ? [record] : state.records;
  if (records.length === 0) {
    createMessage.warning('请选择要操作的数据');
    return;
  }
  const names = records.map((item) => item.gameName).join(',');
  createConfirm({
    iconType: 'warning',
    title: '提示',
    content: `是否确定删除游戏记录: ${names}?`,
    onOk: async () => {
      for (const item of records) {
        if (item.id) {
          await deleteGameRecordsApi(item.id);
        }
      }
      createMessage.success(`删除 ${names} 成功`);
      reload();
    },
  });
}

function handleSuccess() {
  reload();
}
</script>
