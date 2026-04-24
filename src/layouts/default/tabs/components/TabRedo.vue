<template>
  <span :class="`${prefixCls}__extra-redo`" @click="handleRedo">
    <Icon icon="ep:refresh-right" :class="{ 'is-spinning': loading }" />
  </span>
</template>

<script setup>
import { ref } from 'vue'
import Icon from '@/components/Icon/Icon.vue'
import { useDesign } from '@/hooks/web/useDesign'
import { useTabs } from '@/hooks/web/useTabs'

defineOptions({ name: 'TabRedo' })

const loading = ref(false)
const { prefixCls } = useDesign('multiple-tabs-content')
const { refreshPage } = useTabs()

async function handleRedo() {
  loading.value = true
  await refreshPage()
  setTimeout(() => {
    loading.value = false
  }, 1200)
}
</script>

<style lang="less" scoped>
.is-spinning {
  animation: tab-redo-spin 0.8s linear infinite;
}

@keyframes tab-redo-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
