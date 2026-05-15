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
import { CharacterRelationshipsLM } from '@/model/deskMate';
import { detailSchema } from './data';

const getTitle = ref('人物关系详情');

const [registerDescription, { setDescProps }] = useDescription({
  title: '人物关系详情',
  schema: detailSchema,
  column: DescItemSizeEnum.DEFAULT,
});

const [registerDrawer, { setDrawerProps }] = useDrawerInner((data) => {
  setDrawerProps({ loading: true, confirmLoading: false });
  const record = data.record as CharacterRelationshipsLM;
  setDescProps({ data: record });
  getTitle.value = `人物关系详情: ${record.name} ↔ ${record.relatedName}`;
  setDrawerProps({ loading: false });
});
</script>
