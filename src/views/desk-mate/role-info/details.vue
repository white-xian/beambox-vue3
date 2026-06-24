<template>
  <BasicDrawer v-bind="$attrs"  :title="getTitle" @register="registerDrawer" width="60%" showFooter :showOkBtn="false">
    <Description @register="registerDescription" class="mt-4" />
  </BasicDrawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Description, useDescription } from '@/components/Description';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
import { DescItemSizeEnum } from '@/enums';
import { RoleInfoIM } from '@/model/desk-mate';
import { detailSchema } from './data';

const getTitle = ref('桌搭子角色详情');

const [registerDescription, { setDescProps }] = useDescription({
  title: '桌搭子角色详情',
  schema: detailSchema,
  column: DescItemSizeEnum.DEFAULT,
});

const [registerDrawer, { setDrawerProps }] = useDrawerInner((data) => {
  setDrawerProps({ loading: true, confirmLoading: false });
  const record = data.record as RoleInfoIM;
  setDescProps({ data: record });
  getTitle.value = `桌搭子角色详情: ${record.name}`;
  setDrawerProps({ loading: false });
});
</script>
