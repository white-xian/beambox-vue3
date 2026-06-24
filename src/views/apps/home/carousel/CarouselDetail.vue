<template>
  <BasicDrawer v-bind="$attrs" :title="getTitle" @register="registerDrawer" width="45%" showFooter :showOkBtn="false">
    <Description @register="registerDescription" class="mt-4" />
  </BasicDrawer>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { Description, useDescription } from '@/components/Description'
  import { BasicDrawer, useDrawerInner } from '@/components/Drawer'
  import { DescItemSizeEnum } from '@/enums'
  import { CarouselIM } from '@/model/apps/home'
  import { detailSchema } from './carousel.data'

  const getTitle = ref('轮播图详情')

  const [registerDescription, { setDescProps }] = useDescription({
    title: '轮播图详情',
    schema: detailSchema,
    column: DescItemSizeEnum.DEFAULT,
  })

  const [registerDrawer, { setDrawerProps }] = useDrawerInner((data) => {
    setDrawerProps({ loading: true, confirmLoading: false })
    const record = data.record as CarouselIM
    setDescProps({ data: record })
    getTitle.value = '轮播图详情'
    setDrawerProps({ loading: false })
  })
</script>
