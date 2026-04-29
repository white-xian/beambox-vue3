import type { BasicColumn, BasicTableProps, TableRowSelection } from '../types/table';
import { computed, ComputedRef, nextTick, Ref, ref, unref, watch } from 'vue';
import { getViewportOffset } from '@/utils/dom/DomUtil';
import { isBoolean } from '@/utils/core/ObjectUtil';
import { onMountedOrActivated, useWindowSizeFn } from '@xueyi/hooks';
import { useModalContext } from '@/components/Modal';
import { promiseTimeout, useDebounceFn } from '@vueuse/core';

import {
  footerHeight as layoutFooterHeight,
  layoutMultipleHeaderPlaceholderTime,
} from '@/settings/designSetting';

import { useRootSetting } from '@/hooks/setting/useRootSetting';

const { getShowFooter, getFullContent } = useRootSetting();

export function useTableScroll(
  propsRef: ComputedRef<BasicTableProps>,
  tableElRef: Ref<ComponentRef>,
  columnsRef: ComputedRef<BasicColumn[]>,
  rowSelectionRef: ComputedRef<TableRowSelection | null>,
  getDataSourceRef: ComputedRef<Recordable[]>,
  wrapRef: Ref<HTMLElement | null>,
  formRef: Ref<ComponentRef>,
) {
  const tableHeightRef: Ref<Nullable<number | string>> = ref(167);
  const modalFn = useModalContext();

  // Greater than animation time 280
  const debounceRedoHeight = useDebounceFn(redoHeight, 100);

  const getCanResize = computed(() => {
    const { canResize, scroll } = unref(propsRef);
    return canResize && !(scroll || {}).y;
  });

  watch(
    () => [unref(getCanResize), unref(getDataSourceRef)?.length, unref(getShowFooter)],
    () => {
      debounceRedoHeight();
    },
    {
      flush: 'post',
    },
  );

  watch(
    () => [unref(getFullContent)],
    async () => {
      // 等待动画结束后200毫秒
      await promiseTimeout(layoutMultipleHeaderPlaceholderTime * 1000 + 200);
      debounceRedoHeight();
    },
    {
      flush: 'post',
    },
  );

  function redoHeight() {
    nextTick(() => {
      calcTableHeight();
    });
  }

  function setHeight(height: number) {
    tableHeightRef.value = height;
    //  Solve the problem of modal adaptive height calculation when the form is placed in the modal
    modalFn?.redoModalHeight?.();
  }

  // No need to repeat queries
  let paginationEl: HTMLElement | null;
  let footerEl: HTMLElement | null;
  let bodyEl: HTMLElement | null;

  function toPx(value?: string) {
    const parsedValue = Number.parseFloat(value || '0');
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  function syncNativeScrollbarGutter(bodyEl: HTMLElement, tableEl: Element) {
    const gutterWidth = Math.max(bodyEl.offsetWidth - bodyEl.clientWidth, 0);
    const currentValue = getComputedStyle(tableEl).getPropertyValue('--nn-scrollbar-gutter');
    const currentWidth = Number.parseFloat(currentValue || '0');
    const sizeValue = getComputedStyle(tableEl).getPropertyValue('--nn-scrollbar-size');
    const fallbackWidth = Number.parseFloat(sizeValue || '0');
    const effectiveWidth =
      gutterWidth > 0 || !Number.isFinite(fallbackWidth) || fallbackWidth <= 0
        ? gutterWidth
        : fallbackWidth;

    if (Number.isFinite(currentWidth) && Math.abs(currentWidth - effectiveWidth) < 0.5) return;

    (tableEl as HTMLElement).style.setProperty('--nn-scrollbar-gutter', `${effectiveWidth}px`);
  }

  function getTableWrapperBottomPadding(tableEl: Element) {
    const tableWrapperEl = tableEl.parentElement as HTMLElement | null;
    if (!tableWrapperEl) return 0;
    // 表格外层 padding 可能被页面样式覆盖，这里读取真实值，避免样式和高度计算两边各改一份。
    return toPx(getComputedStyle(tableWrapperEl).paddingBottom);
  }

  function handleScrollBar(bodyEl: HTMLElement, tableEl: Element) {
    const hasScrollBarY = bodyEl.scrollHeight > bodyEl.clientHeight;
    const hasScrollBarX = bodyEl.scrollWidth > bodyEl.clientWidth;

    if (hasScrollBarY) {
      tableEl.classList.contains('hide-scrollbar-y') &&
        tableEl.classList.remove('hide-scrollbar-y');
    } else {
      !tableEl.classList.contains('hide-scrollbar-y') && tableEl.classList.add('hide-scrollbar-y');
    }

    if (hasScrollBarX) {
      tableEl.classList.contains('hide-scrollbar-x') &&
        tableEl.classList.remove('hide-scrollbar-x');
    } else {
      !tableEl.classList.contains('hide-scrollbar-x') && tableEl.classList.add('hide-scrollbar-x');
    }
  }

  /**
   * 计算分页器高度
   * @param tableEl table element
   * @returns number
   */
  function caclPaginationHeight(tableEl: Element): number {
    const { pagination } = unref(propsRef);

    let paginationHeight = 0;
    if (!isBoolean(pagination)) {
      // 从 Dom 获取
      if (!paginationEl) {
        // 分页已经由 AntD Pagination 改成 Element Pagination，DOM 类名同步换成当前封装的分页容器。
        paginationEl = tableEl.parentElement?.querySelector('.xueyi-basic-table__pagination') as HTMLElement;
      }
      if (paginationEl) {
        // 分页 margin-top
        const paginationElMarginTop =
          parseInt(getComputedStyle(paginationEl)?.marginTop) || 10 + 24;
        // 分页高度
        const offsetHeight = paginationEl.offsetHeight;
        paginationHeight = offsetHeight + paginationElMarginTop;
      } else {
        // 找不到分页组件，缺省给予默认分页 margin-top + 高度
        paginationHeight = 10 + 24;
      }
    } else {
      // 不显示分页，pagination 为 false 的时候
      paginationHeight = 0;
    }
    return paginationHeight;
  }

  function caclFooterHeight(tableEl: Element): number {
    const { pagination } = unref(propsRef);
    let footerHeight = 0;
    if (!isBoolean(pagination)) {
      if (!footerEl) {
        // Element 表格 footer 的 DOM 类名与 AntD 不同，这里用于计算 summary/footer 占用高度。
        footerEl = tableEl.querySelector('.el-table__footer-wrapper') as HTMLElement;
      } else {
        const offsetHeight = footerEl.offsetHeight;
        footerHeight += offsetHeight || 0;
      }
    }
    return footerHeight;
  }

  function calcHeaderHeight(headEl: Element): number {
    let headerHeight = 0;
    if (headEl) {
      headerHeight = (headEl as HTMLElement).offsetHeight;
    }
    return headerHeight;
  }

  /**
   * 计算从表头一直到body底部的总高度
   * @param tableEl table element
   * @param headEl table 页头 element
   * @returns number
   */
  function calcBottomAndPaddingHeight(headEl: Element) {
    const { isCanResizeParent } = unref(propsRef);
    const wrapEl = unref(wrapRef);
    if (wrapEl && isCanResizeParent) {
      // 父容器固定高度时，直接算“表头顶部到父容器底部”的真实距离，表单/header 高度变化会自动体现在这里。
      const wrapRect = wrapEl.getBoundingClientRect();
      const headRect = headEl.getBoundingClientRect();
      return Math.max(wrapRect.bottom - headRect.top, 0);
    }

    // 普通页面按视口底部计算，“表头顶部到浏览器底部”的距离。
    return getViewportOffset(headEl).bottomIncludeBody;
  }

  /**
   * 计算 table 在 modal 内 modal 所占用的高度
   * @param tableEl table element
   * @returns number
   */
  function calcModalHeight(tableEl: Element) {
    // 找一下 table 是否在 modal 内，获得 modal、wrap、footer，并考虑 fullscreen 的情况
    let modalEl: Nullable<HTMLElement> = null;
    let modalWrapEl: Nullable<HTMLElement> = null;
    let modalFooterEl: Nullable<HTMLElement> = null;
    let modalElIterator: HTMLElement = tableEl.parentElement!;
    let modalIsFullscreen = false;
    while (modalElIterator !== document.body) {
      if (!modalElIterator) break;
      if (modalElIterator.classList.contains('ant-modal')) {
        modalEl = modalElIterator;
        modalWrapEl = modalEl.parentElement;
        modalFooterEl = modalElIterator.querySelector('.ant-modal-content>.ant-modal-footer');
        modalIsFullscreen = modalWrapEl?.classList.contains('fullscreen-modal') ?? false;
        break;
      }
      modalElIterator = modalElIterator.parentElement!;
    }

    if (modalEl) {
      // table 在 modal 内

      // modal top
      const { top: modalTop = 0 } = modalEl ? getViewportOffset(modalEl) : {};

      // 来自于 .ant-modal，非全屏为 24，全屏为 0
      const modalBottom = modalIsFullscreen ? 0 : 24;

      //  modal footer 高度
      const modalFooterHeight = modalFooterEl?.offsetHeight ?? 0;

      // modal footer 边距，来自于 .ant-modal .ant-modal-footer
      const modalFooterMarginTop = modalFooterEl
        ? modalIsFullscreen
          ? 0
          : parseInt(getComputedStyle(modalFooterEl).marginTop)
        : 0;

      // 来自于 .ant-modal .ant-modal-body > .scrollbar
      const modalScrollBarHeight = 14;

      return (
        (modalTop > modalBottom ? modalTop : modalBottom) +
        modalFooterHeight +
        modalFooterMarginTop +
        modalScrollBarHeight
      );
    }

    // table 不住 modal 内
    return 0;
  }

  /**
   * 根据样式返回一些间距高度
   * @returns number
   */
  function getMarginPaddingHeight(tableEl: Element) {
    const { isCanResizeParent } = unref(propsRef);
    const tableWrapperPaddingBottom = getTableWrapperBottomPadding(tableEl);

    if (unref(wrapRef) && isCanResizeParent) {
      // 父容器高度已经固定，只需要扣掉表格 wrapper 的底部 padding。
      return tableWrapperPaddingBottom;
    }
    return (
      tableWrapperPaddingBottom + 16 // 普通页面保留内容区底部安全间距，避免贴底或 1px 溢出。
    );
  }

  async function calcTableHeight() {
    const { resizeHeightOffset, maxHeight } = unref(propsRef);

    const table = unref(tableElRef);
    if (!table) return;

    const tableEl: Element = table.$el;
    if (!tableEl) return;

    if (!bodyEl) {
      // Element Plus 的真实滚动容器在 el-scrollbar__wrap 上，回退到 body-wrapper 兼容不同版本 DOM。
      bodyEl = tableEl.querySelector('.el-table__body-wrapper .el-scrollbar__wrap, .el-table__body-wrapper');
      if (!bodyEl) return;
    }

    handleScrollBar(bodyEl, tableEl);
    syncNativeScrollbarGutter(bodyEl, tableEl);

    bodyEl!.style.height = 'unset';

    if (!unref(getCanResize)) return;

    await nextTick();
    // Add a delay to get the correct bottomIncludeBody paginationHeight footerHeight headerHeight

    const headEl = tableEl.querySelector('.el-table__header-wrapper');

    if (!headEl) return;

    const paginationHeight = caclPaginationHeight(tableEl);
    const footerHeight = caclFooterHeight(tableEl);
    const headerHeight = calcHeaderHeight(headEl);
    const bottomIncludeBody = calcBottomAndPaddingHeight(headEl);

    const modalHeight = calcModalHeight(tableEl);

    const marginPaddingHeight = getMarginPaddingHeight(tableEl);

    // Math.floor 宁愿小1px，也不溢出
    let height = Math.floor(
      bottomIncludeBody -
        (resizeHeightOffset || 0) -
        paginationHeight -
        footerHeight -
        headerHeight -
        // 弹窗（如果有）相关高度
        modalHeight -
        // 页面 footer 高度（非弹窗的时候）
        (getShowFooter.value && modalHeight <= 0 ? layoutFooterHeight : 0) -
        // 样式间距高度
        marginPaddingHeight -
        // 预留非整数高度溢出（如实际高度为100.5，offsetHeight 的值为101）
        1,
    );

    height = (height > maxHeight! ? (maxHeight as number) : height) ?? height;
    setHeight(height);

    bodyEl!.style.height = `${height}px`;
    syncNativeScrollbarGutter(bodyEl, tableEl);
    table?.doLayout?.();
  }

  useWindowSizeFn(calcTableHeight, { wait: 280 });
  onMountedOrActivated(() => {
    calcTableHeight();
    nextTick(() => {
      debounceRedoHeight();
    });
  });

  const getScrollX = computed(() => {
    let width = 0;
    if (unref(rowSelectionRef)) {
      width += 60;
    }

    // TODO props ?? 0;
    const NORMAL_WIDTH = 150;

    const columns = unref(columnsRef).filter((item) => !item.defaultHidden);
    columns.forEach((item) => {
      width += Number.parseFloat(item.width as string) || 0;
    });
    const unsetWidthColumns = columns.filter(
      (item) => !Reflect.has(item, 'width') && item.ifShow !== false,
    );

    const len = unsetWidthColumns.length;
    if (len !== 0) {
      width += len * NORMAL_WIDTH;
    }

    const table = unref(tableElRef);
    const tableWidth = table?.$el?.offsetWidth ?? 0;
    return tableWidth > width ? '100%' : width;
  });

  const getScrollRef = computed(() => {
    const tableHeight = unref(tableHeightRef);
    const { canResize, scroll } = unref(propsRef);
    return {
      x: unref(getScrollX),
      y: canResize ? tableHeight : null,
      scrollToFirstRowOnChange: false,
      ...scroll,
    } as BasicTableProps['scroll'];
  });

  return { getScrollRef, redoHeight };
}
