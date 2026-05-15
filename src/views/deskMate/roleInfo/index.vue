<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button :preIcon="IconEnum.ADD" v-auth="deskMateRoleInfoAuth.ADD" type="primary" @click="handleCreate"> 新增 </a-button>
        <a-button :preIcon="IconEnum.DELETE" v-auth="deskMateRoleInfoAuth.Delete" type="primary" color="error" @click="handleDelete()"> 删除 </a-button>
      </template>
      <template #action="{ record }">
        <TableAction
          :actions="[
            {
              icon: IconEnum.VIEW,
              tooltip: '查看',
              auth: deskMateRoleInfoAuth.SINGLE,
              onClick: handleView.bind(null, record),
            },
            {
              icon: IconEnum.EDIT,
              tooltip: '编辑',
              auth: deskMateRoleInfoAuth.Update,
              onClick: handleEdit.bind(null, record),
            },
            {
              icon: IconEnum.DELETE,
              tooltip: '删除',
              auth: deskMateRoleInfoAuth.Delete,
              color: 'error',
              onClick: handleDelete.bind(null, record),
            },
          ]"
        />
      </template>
    </BasicTable>
    <Info @register="roleInfoRegisterModal" @success="handleSuccess" />
    <Details @register="detailRegisterDrawer" />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { deleteRoleInfoApi, listRoleInfoApi } from '@/api/deskMate/roleInfo.api';
import { deskMateRoleInfoAuth } from '@/auth/deskMate';
import { BasicTable, TableAction, useTable } from '@/components/Table';
import { useDrawer } from '@/components/Drawer';
import { useModal } from '@/components/Modal';
import { IconEnum } from '@/enums';
import { useMessage } from '@/hooks/web/useMessage';
import { RoleInfoIM } from '@/model/deskMate';
import { columns, searchFormSchema } from './data';
import Info from './info.vue';
import Details from './details.vue';

const { createConfirm, createMessage } = useMessage();
const [roleInfoRegisterModal, { openModal: openRoleInfoModal }] = useModal();
const [detailRegisterDrawer, { openDrawer: openDetailDrawer }] = useDrawer();

const state = reactive<{
  ids: string[];
  idNames: string;
  records: RoleInfoIM[];
}>({
  ids: [],
  idNames: '',
  records: [],
});

const [registerTable, { reload }] = useTable({
  title: '桌搭子角色基础信息',
  api: listRoleInfoApi,
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
      const records = selectRows as RoleInfoIM[];
      state.ids = selectedRowKeys as string[];
      state.records = records;
      state.idNames = records.map((item) => item.name).join(',');
    },
  },
});

function handleView(record: RoleInfoIM) {
  openDetailDrawer(true, { record });
}

function handleCreate() {
  openRoleInfoModal(true, { isUpdate: false });
}

function handleEdit(record: RoleInfoIM) {
  openRoleInfoModal(true, { record, isUpdate: true });
}

function handleDelete(record?: RoleInfoIM) {
  const records = record?.id ? [record] : state.records;
  if (records.length === 0) {
    createMessage.warning('请选择要操作的数据');
    return;
  }
  const names = records.map((item) => item.name).join(',');
  createConfirm({
    iconType: 'warning',
    title: '提示',
    content: `是否确定删除角色: ${names}?`,
    onOk: async () => {
      // 逐个删除
      for (const item of records) {
        if (item.id) {
          await deleteRoleInfoApi(item.id);
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
