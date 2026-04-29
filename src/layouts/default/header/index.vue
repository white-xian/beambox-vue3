<template>
  <Layout.Header :class="getHeaderClass">
    <div :class="`${prefixCls}__navbar`">
      <div :class="`${prefixCls}__left`">
        <AppLogo
          v-if="getShowHeaderLogo || getIsMobile"
          :class="`${prefixCls}__logo`"
          :theme="getHeaderTheme"
          :style="getLogoWidth"
        />

        <LayoutTrigger
          v-if="((getShowContent && getShowHeaderTrigger && !getSplit && !getIsMixSidebar) || getIsMobile)"
          :class="`${prefixCls}__trigger`"
          :theme="getHeaderTheme"
          :sider="false"
        />

        <LayoutBreadcrumb
          v-if="getShowContent && getShowBread"
          :class="`${prefixCls}__breadcrumb`"
          :theme="getHeaderTheme"
        />
      </div>

      <div v-if="getShowTopMenu && !getIsMobile" :class="`${prefixCls}__menu`">
        <LayoutMenu
          :isHorizontal="true"
          :theme="getHeaderTheme"
          :splitType="getSplitType"
          :menuMode="getMenuMode"
        />
      </div>

      <div :class="`${prefixCls}__right`">
        <AppSearch v-if="getShowSearch" :class="`${prefixCls}__action-item`" />
        <ErrorAction v-if="getUseErrorHandle" :class="`${prefixCls}__action-item`" />
        <Notify v-if="getShowNotice" :class="`${prefixCls}__action-item`" />
        <FullScreen v-if="getShowFullScreen" :class="`${prefixCls}__action-item`" />
        <UserDropDown :theme="getHeaderTheme" />
        <SettingDrawer v-if="getShowSetting" :class="`${prefixCls}__action-item`" />
      </div>
    </div>
  </Layout.Header>
</template>

<script setup>
import { Layout } from 'ant-design-vue'
import { computed, unref } from 'vue'
import { AppLogo, AppSearch } from '@/components/Application'
import { MenuModeEnum, MenuSplitTyeEnum, SettingButtonPositionEnum } from '@/enums'
import { useHeaderSetting } from '@/hooks/setting/useHeaderSetting'
import { useMenuSetting } from '@/hooks/setting/useMenuSetting'
import { useRootSetting } from '@/hooks/setting/useRootSetting'
import { useAppInject } from '@/hooks/web/useAppInject'
import { useDesign } from '@/hooks/web/useDesign'
import { createAsyncComponent } from '@/utils/factory/createAsyncComponent'
import LayoutMenu from '../menu/index.vue'
import LayoutTrigger from '../trigger/index.vue'
import { ErrorAction, FullScreen, LayoutBreadcrumb, Notify, UserDropDown } from './components'

const SettingDrawer = createAsyncComponent(() => import('@/layouts/default/setting/index.vue'), {
  loading: true,
})

defineOptions({ name: 'LayoutHeader' })

const props = defineProps({
  fixed: Boolean,
})

const { prefixCls } = useDesign('layout-header')
const {
  getShowTopMenu,
  getShowHeaderTrigger,
  getSplit,
  getIsMixMode,
  getMenuWidth,
  getIsMixSidebar,
} = useMenuSetting()
const { getUseErrorHandle, getShowSettingButton, getSettingButtonPosition } = useRootSetting()
const {
  getHeaderTheme,
  getShowFullScreen,
  getShowNotice,
  getShowContent,
  getShowBread,
  getShowHeaderLogo,
  getShowHeader,
  getShowSearch,
} = useHeaderSetting()
const { getIsMobile } = useAppInject()

const getHeaderClass = computed(() => {
  const theme = unref(getHeaderTheme)
  return [
    prefixCls,
    {
      [`${prefixCls}--fixed`]: props.fixed,
      [`${prefixCls}--mobile`]: unref(getIsMobile),
      [`${prefixCls}--${theme}`]: theme,
    },
  ]
})

const getShowSetting = computed(() => {
  if (!unref(getShowSettingButton)) {
    return false
  }

  const settingButtonPosition = unref(getSettingButtonPosition)
  if (settingButtonPosition === SettingButtonPositionEnum.AUTO) {
    return unref(getShowHeader)
  }

  return settingButtonPosition === SettingButtonPositionEnum.HEADER
})

const getLogoWidth = computed(() => {
  if (!unref(getIsMixMode) || unref(getIsMobile)) {
    return {}
  }

  const width = unref(getMenuWidth) < 180 ? 180 : unref(getMenuWidth)
  return { width: `${width}px` }
})

const getSplitType = computed(() => {
  return unref(getSplit) ? MenuSplitTyeEnum.TOP : MenuSplitTyeEnum.NONE
})

const getMenuMode = computed(() => {
  return unref(getSplit) ? MenuModeEnum.HORIZONTAL : null
})
</script>

<style lang="less">
@import url('./index.less');
</style>
