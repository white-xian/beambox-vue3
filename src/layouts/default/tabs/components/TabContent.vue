<template>
  <Dropdown
    :dropMenuList="getDropMenuList"
    :trigger="getTrigger"
    placement="bottomLeft"
    overlayClassName="multiple-tabs__dropdown"
    @menu-event="handleMenuEvent"
  >
    <div v-if="getIsTabs" :class="`${prefixCls}__info`" @contextmenu="handleContext">
      <span class="ml-1">{{ getTitle }}</span>
    </div>
    <span v-else :class="`${prefixCls}__extra-quick`" @click="handleContext">
      <Icon icon="ion:chevron-down" />
    </span>
  </Dropdown>
</template>

<script setup>
import { computed, unref } from 'vue'
import { Dropdown } from '@/components/Dropdown'
import Icon from '@/components/Icon/Icon.vue'
import { useDesign } from '@/hooks/web/useDesign'
import { useTabDropdown } from '../useTabDropdown'

defineOptions({ name: 'TabContent' })

const props = defineProps({
  tabItem: {
    type: Object,
    default: null,
  },
  isExtra: Boolean,
})

const { prefixCls } = useDesign('multiple-tabs-content')

const getTitle = computed(() => {
  const { tabItem: { meta } = {} } = props
  return meta?.title
})

const getIsTabs = computed(() => !props.isExtra)
const getTrigger = computed(() => (unref(getIsTabs) ? ['contextmenu'] : ['click']))
const { getDropMenuList, handleMenuEvent, handleContextMenu } = useTabDropdown(props, getIsTabs)

function handleContext(event) {
  if (props.tabItem) {
    handleContextMenu(props.tabItem)(event)
  }
}
</script>
