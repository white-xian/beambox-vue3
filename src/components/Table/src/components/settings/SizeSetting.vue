<template>
  <Tooltip placement="top">
    <template #title>
      <span>密度</span>
    </template>

    <Dropdown placement="bottom" :trigger="['click']" :getPopupContainer="getPopupContainer">
      <ColumnHeightOutlined />
      <template #overlay>
        <Menu @click="handleTitleClick" selectable v-model:selectedKeys="selectedKeysRef">
          <Menu.Item key="large">
            <span>宽松</span>
          </Menu.Item>
          <Menu.Item key="default">
            <span>默认</span>
          </Menu.Item>
          <Menu.Item key="small">
            <span>紧凑</span>
          </Menu.Item>
        </Menu>
      </template>
    </Dropdown>
  </Tooltip>
</template>

<script lang="ts" setup>
  import type { SizeType } from '../../types/table';
  import { onMounted, ref, useAttrs } from 'vue';
  import { Dropdown, Menu, type MenuProps, Tooltip } from 'ant-design-vue';
  import { ColumnHeightOutlined } from '@ant-design/icons-vue';
  import { useTableContext } from '../../hooks/useTableContext';
  import { isFunction } from '@/utils/core/ObjectUtil';
  import { getPopupContainer as getParentContainer } from '@/utils';

  import { useTableSettingStore } from '@/store/modules/tableSetting';

  const tableSettingStore = useTableSettingStore();

  defineOptions({ name: 'SizeSetting' });

  const attrs = useAttrs();
  const table = useTableContext();

  const getPopupContainer = () => {
    return isFunction(attrs.getPopupContainer) ? attrs.getPopupContainer() : getParentContainer();
  };

  const selectedKeysRef = ref<SizeType[]>([table.getSize()]);

  const handleTitleClick: MenuProps['onClick'] = ({ key }) => {
    selectedKeysRef.value = [key as SizeType];

    tableSettingStore.setTableSize(key as SizeType);

    table.setProps({
      size: key as SizeType,
    });
  };

  onMounted(() => {
    selectedKeysRef.value = [tableSettingStore.getTableSize];
    table.setProps({
      size: selectedKeysRef.value[0],
    });
  });
</script>
