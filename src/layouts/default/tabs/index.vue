<template>
  <div :class="getWrapClass">
    <div ref="scrollRef" :class="`${prefixCls}__scroll`">
      <div :class="`${prefixCls}__nav`">
        <div
          v-for="item in getTabsState"
          :key="getTabKey(item)"
          :data-tab-key="encodeTabKey(getTabKey(item))"
          :class="getTabItemClass(item)"
          @click="handleChange(getTabKey(item))"
        >
          <TabContent :tabItem="item" />
          <button
            v-if="!item.meta?.affix"
            type="button"
            :class="`${prefixCls}__close`"
            @click.stop="handleEdit(getTabKey(item))"
          >
            <Icon icon="ep:close" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="getShowRedo || getShowQuick" :class="`${prefixCls}__extra`">
      <SettingButton v-if="(getShowFold && getIsUnFold) || !getShowHeader" />
      <TabRedo v-if="getShowRedo" />
      <TabContent v-if="getShowQuick" isExtra :tabItem="$route" />
      <FoldButton v-if="getShowFold" />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, unref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMouse } from '@vueuse/core'
import Icon from '@/components/Icon/Icon.vue'
import FoldButton from './components/FoldButton.vue'
import SettingButton from './components/SettingButton.vue'
import TabContent from './components/TabContent.vue'
import TabRedo from './components/TabRedo.vue'
import { useDesign } from '@/hooks/web/useDesign'
import { useGo } from '@/hooks/web/usePage'
import { useHeaderSetting } from '@/hooks/setting/useHeaderSetting'
import { useMenuSetting } from '@/hooks/setting/useMenuSetting'
import { useMultipleTabSetting } from '@/hooks/setting/useMultipleTabSetting'
import { listenerRouteChange } from '@/logics/mitt/routeChange'
import { REDIRECT_NAME } from '@/router/constant'
import { multipleTabHeight } from '@/settings/designSetting'
import { useMultipleTabStore } from '@/store/modules/multipleTab'
import { useUserStore } from '@/store/modules/user'
import { initAffixTabs, useTabsDrag } from './useMultipleTabs'

defineOptions({ name: 'MultipleTabs' })

const affixTextList = initAffixTabs()
const activeKeyRef = ref('')
const scrollRef = ref()

useTabsDrag(affixTextList)

const tabStore = useMultipleTabStore()
const userStore = useUserStore()
const router = useRouter()
const go = useGo()
const { prefixCls } = useDesign('multiple-tabs')
const { getShowQuick, getShowRedo, getShowFold } = useMultipleTabSetting()
const { getShowMenu } = useMenuSetting()
const { getShowHeader } = useHeaderSetting()
const { y: mouseY } = useMouse()

const getTabsState = computed(() => {
  return tabStore.getTabList.filter((item) => !item.meta?.hideTab)
})

const unClose = computed(() => unref(getTabsState).length === 1)
const getIsUnFold = computed(() => !unref(getShowMenu) && !unref(getShowHeader))

const getWrapClass = computed(() => {
  return [
    prefixCls,
    {
      [`${prefixCls}--hide-close`]: unref(unClose),
      [`${prefixCls}--hover`]: unref(mouseY) < multipleTabHeight,
    },
  ]
})

listenerRouteChange((route) => {
  const { name } = route
  if (name === REDIRECT_NAME || !route || !userStore.getToken) {
    return
  }

  const { path, fullPath, meta = {} } = route
  const { currentActiveMenu, hideTab } = meta
  const isHide = !hideTab ? null : currentActiveMenu
  const currentKey = isHide || fullPath || path

  if (activeKeyRef.value !== currentKey) {
    activeKeyRef.value = currentKey
  }

  if (isHide) {
    const findParentRoute = router.getRoutes().find((item) => item.path === currentActiveMenu)
    if (findParentRoute) {
      tabStore.addTab(findParentRoute)
    }
  } else {
    tabStore.addTab(route)
  }

  nextTick(() => {
    scrollActiveTab()
  })
})

watch(activeKeyRef, () => {
  nextTick(() => {
    scrollActiveTab()
  })
})

function getTabKey(tab) {
  return tab.query ? tab.fullPath : tab.path
}

function encodeTabKey(key) {
  return encodeURIComponent(key || '')
}

function getTabItemClass(item) {
  return [
    `${prefixCls}__item`,
    {
      [`${prefixCls}__item--active`]: activeKeyRef.value === getTabKey(item),
    },
  ]
}

function handleChange(activeKey) {
  activeKeyRef.value = activeKey
  go(activeKey, false)
}

function handleEdit(targetKey) {
  if (unref(unClose)) {
    return
  }

  tabStore.closeTabByKey(targetKey, router)
}

function scrollActiveTab() {
  const currentKey = activeKeyRef.value
  if (!currentKey || !scrollRef.value) {
    return
  }

  const target = scrollRef.value.querySelector(`[data-tab-key="${encodeTabKey(currentKey)}"]`)
  target?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center',
  })
}
</script>

<style lang="less">
@import url('./index.less');
</style>
