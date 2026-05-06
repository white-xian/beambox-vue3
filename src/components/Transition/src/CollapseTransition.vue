<template>
  <transition mode="out-in" v-on="on">
    <slot></slot>
  </transition>
</template>

<script lang="ts" setup>
  import { addClass, removeClass } from '@/utils/dom/DomUtil';

  defineOptions({ name: 'CollapseTransition' });

  interface CollapseElement extends HTMLElement {
    _collapseResizeObserver?: ResizeObserver;
    _collapseMutationObserver?: MutationObserver;
    _collapseRafId?: number;
  }

  function cleanupObservers(el: CollapseElement) {
    el._collapseResizeObserver?.disconnect();
    el._collapseMutationObserver?.disconnect();

    if (el._collapseRafId) {
      cancelAnimationFrame(el._collapseRafId);
    }

    delete el._collapseResizeObserver;
    delete el._collapseMutationObserver;
    delete el._collapseRafId;
  }

  function syncEnterHeight(el: CollapseElement) {
    if (!el.classList.contains('collapse-transition')) return;

    if (el._collapseRafId) {
      cancelAnimationFrame(el._collapseRafId);
    }

    el._collapseRafId = requestAnimationFrame(() => {
      const height = el.scrollHeight;
      if (height) {
        el.style.height = `${height}px`;
      }
    });
  }

  function observeEnterHeight(el: CollapseElement) {
    cleanupObservers(el);

    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => syncEnterHeight(el));
      resizeObserver.observe(el);
      Array.from(el.children).forEach((child) => resizeObserver.observe(child));
      el._collapseResizeObserver = resizeObserver;
    }

    if (typeof MutationObserver !== 'undefined') {
      const mutationObserver = new MutationObserver(() => syncEnterHeight(el));
      mutationObserver.observe(el, {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true,
      });
      el._collapseMutationObserver = mutationObserver;
    }
  }

  const on = {
    beforeEnter(el: CollapseElement) {
      cleanupObservers(el);
      addClass(el, 'collapse-transition');

      el.dataset.oldPaddingTop = el.style.paddingTop;
      el.dataset.oldPaddingBottom = el.style.paddingBottom;

      el.style.height = '0';
      el.style.paddingTop = '0';
      el.style.paddingBottom = '0';
    },

    enter(el: CollapseElement) {
      el.dataset.oldOverflow = el.style.overflow;
      if (el.scrollHeight !== 0) {
        el.style.height = el.scrollHeight + 'px';
        el.style.paddingTop = el.dataset.oldPaddingTop ?? '';
        el.style.paddingBottom = el.dataset.oldPaddingBottom ?? '';
      } else {
        el.style.height = '';
        el.style.paddingTop = el.dataset.oldPaddingTop ?? '';
        el.style.paddingBottom = el.dataset.oldPaddingBottom ?? '';
      }

      el.style.overflow = 'hidden';
      observeEnterHeight(el);
    },

    afterEnter(el: CollapseElement) {
      cleanupObservers(el);
      removeClass(el, 'collapse-transition');
      el.style.height = '';
      el.style.overflow = el.dataset.oldOverflow ?? '';
    },

    beforeLeave(el: CollapseElement) {
      cleanupObservers(el);
      el.dataset.oldPaddingTop = el.style.paddingTop;
      el.dataset.oldPaddingBottom = el.style.paddingBottom;
      el.dataset.oldOverflow = el.style.overflow;

      el.style.height = el.scrollHeight + 'px';
      el.style.overflow = 'hidden';
    },

    leave(el: CollapseElement) {
      if (el.scrollHeight !== 0) {
        addClass(el, 'collapse-transition');
        el.style.height = '0';
        el.style.paddingTop = '0';
        el.style.paddingBottom = '0';
      }
    },

    afterLeave(el: CollapseElement) {
      cleanupObservers(el);
      removeClass(el, 'collapse-transition');
      el.style.height = '';
      el.style.overflow = el.dataset.oldOverflow ?? '';
      el.style.paddingTop = el.dataset.oldPaddingTop ?? '';
      el.style.paddingBottom = el.dataset.oldPaddingBottom ?? '';
    },
  };
</script>
