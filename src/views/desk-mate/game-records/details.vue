<template>
  <BasicDrawer v-bind="$attrs" :title="getTitle" @register="registerDrawer" width="60%" showFooter :showOkBtn="false">
    <Description @register="registerDescription" class="mt-4" />
  </BasicDrawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Description, useDescription } from '@/components/Description';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
import { DescItemSizeEnum } from '@/enums';
import { GameRecordsLM } from '@/model/deskMate';
import { detailSchema } from './data';

const getTitle = ref('游戏记录详情');

const [registerDescription, { setDescProps }] = useDescription({
  title: '游戏记录详情',
  schema: detailSchema,
  column: DescItemSizeEnum.DEFAULT,
});

const [registerDrawer, { setDrawerProps }] = useDrawerInner((data) => {
  setDrawerProps({ loading: true, confirmLoading: false });
  const record = data.record as GameRecordsLM;
  setDescProps({ data: record });
  getTitle.value = `游戏记录详情: ${record.gameName}`;
  setDrawerProps({ loading: false });
});
</script>
