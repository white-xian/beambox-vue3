<template>
  <div :class="[prefixCls, `${prefixCls}--${theme}`]">
    <el-breadcrumb separator="/">
      <transition-group name="breadcrumb">
        <el-breadcrumb-item v-for="(routeItem, index) in routes" :key="routeItem.path || routeItem.name">
          <span v-if="index === routes.length - 1" class="no-redirect">
            {{ getRouteTitle(routeItem) }}
          </span>
          <a v-else @click.prevent="handleClick(routeItem)">
            {{ getRouteTitle(routeItem) }}
          </a>
        </el-breadcrumb-item>
      </transition-group>
    </el-breadcrumb>
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useDesign } from '@/hooks/web/useDesign'
import { useGo } from '@/hooks/web/usePage'
import { filter } from '@/utils/helper/treeHelper'
import { isString } from '@/utils/core/ObjectUtil'
import { getMenus } from '@/router/menus'
import { REDIRECT_NAME } from '@/router/constant'
import { getAllParentPath } from '@/router/helper/menuHelper'

defineOptions({ name: 'LayoutBreadcrumb' })

defineProps({
  theme: {
    type: String,
    default: 'light',
  },
})

const routes = ref([])
const { currentRoute } = useRouter()
const { prefixCls } = useDesign('layout-breadcrumb')
const go = useGo()

watchEffect(async () => {
  if (currentRoute.value.name === REDIRECT_NAME) return

  const menus = await getMenus()
  const routeMatched = currentRoute.value.matched
  const currentMatched = routeMatched?.[routeMatched.length - 1]
  let path = currentRoute.value.path

  if (currentMatched?.meta?.currentActiveMenu) {
    path = currentMatched.meta.currentActiveMenu
  }

  const parent = getAllParentPath(menus, path)
  const filterMenus = menus.filter((item) => item.path === parent[0])
  const matched = getMatched(filterMenus, parent)

  if (!matched.length) {
    routes.value = []
    return
  }

  const breadcrumbList = filterItem(matched)

  if (currentRoute.value.meta?.currentActiveMenu && !currentRoute.value.meta?.hideBreadcrumb) {
    breadcrumbList.push({
      ...currentRoute.value,
      name: currentRoute.value.meta?.title || currentRoute.value.name,
    })
  }

  routes.value = breadcrumbList
})

function getMatched(menus, parentPaths) {
  const matched = []

  menus.forEach((item) => {
    if (parentPaths.includes(item.path)) {
      matched.push({
        ...item,
        name: item.meta?.title || item.name,
      })
    }

    if (item.children?.length) {
      matched.push(...getMatched(item.children, parentPaths))
    }
  })

  return matched
}

function filterItem(list) {
  return filter(list, (item) => {
    const { meta, name } = item
    if (!meta) {
      return !!name
    }

    const { title, hideBreadcrumb, hideMenu } = meta
    if (!title || hideBreadcrumb || hideMenu) {
      return false
    }

    return true
  }).filter((item) => !item.meta?.hideBreadcrumb)
}

function handleClick(route) {
  const { children, redirect, meta } = route

  if (children?.length && !redirect) {
    return
  }

  if (meta?.carryParam) {
    return
  }

  if (redirect && isString(redirect)) {
    go(redirect)
    return
  }

  let goPath = route.path || ''
  goPath = /^\//.test(goPath) ? goPath : `/${goPath}`
  go(goPath)
}

function getRouteTitle(route) {
  return route.meta?.title || route.name
}
</script>

<style lang="less">
@prefix-cls: ~'@{namespace}-layout-breadcrumb';

.@{prefix-cls} {
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 14px;

  .el-breadcrumb {
    line-height: @header-height;
  }

  .el-breadcrumb__inner,
  .el-breadcrumb__inner a {
    font-weight: 400;
  }

  .el-breadcrumb__separator {
    color: #c0c4cc;
  }

  .no-redirect {
    color: @breadcrumb-item-normal-color;
    cursor: text;
  }

  &--light {
    .el-breadcrumb__inner {
      color: #606266;
    }

    .el-breadcrumb__inner a {
      color: #606266;

      &:hover {
        color: #409eff;
      }
    }
  }

  &--dark {
    .el-breadcrumb__inner {
      color: rgb(255 255 255 / 80%);
    }

    .el-breadcrumb__inner a {
      color: rgb(255 255 255 / 80%);

      &:hover {
        color: @white;
      }
    }

    .no-redirect,
    .el-breadcrumb__separator {
      color: rgb(255 255 255 / 60%);
    }
  }
}
</style>
