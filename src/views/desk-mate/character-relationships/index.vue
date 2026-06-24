<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button :preIcon="IconEnum.ADD" v-auth="deskMateCharacterRelationshipsAuth.ADD" type="primary" @click="handleCreate"> 新增 </a-button>
        <a-button :preIcon="IconEnum.DELETE" v-auth="deskMateCharacterRelationshipsAuth.Delete" type="primary" color="error" @click="handleDelete()"> 删除 </a-button>
      </template>
      <template #action="{ record }">
        <TableAction
          :actions="[
            {
              icon: IconEnum.VIEW,
              tooltip: '查看',
              auth: deskMateCharacterRelationshipsAuth.SINGLE,
              onClick: handleView.bind(null, record),
            },
            {
              icon: IconEnum.EDIT,
              tooltip: '编辑',
              auth: deskMateCharacterRelationshipsAuth.Update,
              onClick: handleEdit.bind(null, record),
            },
            {
              icon: IconEnum.DELETE,
              tooltip: '删除',
              auth: deskMateCharacterRelationshipsAuth.Delete,
              color: 'error',
              onClick: handleDelete.bind(null, record),
            },
          ]"
        />
      </template>
    </BasicTable>
    <Info @register="characterRelationRegisterModal" @success="handleSuccess" />
    <Details @register="detailRegisterDrawer" />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { deleteCharacterRelationshipsApi, listCharacterRelationshipsApi } from '@/api/desk-mate/characterRelationships.api';
import { deskMateCharacterRelationshipsAuth } from '@/auth/desk-mate';
import { BasicTable, TableAction, useTable } from '@/components/Table';
import { useDrawer } from '@/components/Drawer';
import { useModal } from '@/components/Modal';
import { IconEnum } from '@/enums';
import { useMessage } from '@/hooks/web/useMessage';
import { CharacterRelationshipsLM } from '@/model/desk-mate';
import { columns, searchFormSchema } from './data';
import Info from './info.vue';
import Details from './details.vue';

const { createConfirm, createMessage } = useMessage();
const [characterRelationRegisterModal, { openModal: openCharacterRelationModal }] = useModal();
const [detailRegisterDrawer, { openDrawer: openDetailDrawer }] = useDrawer();

const state = reactive<{
  ids: string[];
  idNames: string;
  records: CharacterRelationshipsLM[];
}>({
  ids: [],
  idNames: '',
  records: [],
});

const [registerTable, { reload }] = useTable({
  title: '人物关系',
  api: listCharacterRelationshipsApi,
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
      const records = selectRows as CharacterRelationshipsLM[];
      state.ids = selectedRowKeys as string[];
      state.records = records;
      state.idNames = records.map((item) => `${item.name} ↔ ${item.relatedName}`).join(',');
      // console.log('selectedRowKeys', selectedRowKeys, 'selectRows', selectRows);
    },
  },
});

function handleView(record: CharacterRelationshipsLM) {
  openDetailDrawer(true, { record });
}

function handleCreate() {
  openCharacterRelationModal(true, { isUpdate: false });
}

function handleEdit(record: CharacterRelationshipsLM) {
  openCharacterRelationModal(true, { record, isUpdate: true });
}

function handleDelete(record?: CharacterRelationshipsLM) {
  const records = record?.id ? [record] : state.records;
  if (records.length === 0) {
    createMessage.warning('请选择要操作的数据');
    return;
  }
  const names = records.map((item) => `${item.name} ↔ ${item.relatedName}`).join(',');
  createConfirm({
    iconType: 'warning',
    title: '提示',
    content: `是否确定删除人物关系: ${names}?`,
    onOk: async () => {
      for (const item of records) {
        if (item.id) {
          await deleteCharacterRelationshipsApi(item.id);
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
