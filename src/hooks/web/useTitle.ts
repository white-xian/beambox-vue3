import { unref, watch } from 'vue';
import { useTitle as usePageTitle } from '@vueuse/core';
import { useGlobSetting } from '@/hooks/setting';
import { useRouter } from 'vue-router';
import { REDIRECT_NAME } from '@/router/constant';

/**
 * Listening to page changes and dynamically changing site titles
 */
export function useTitle() {
  const { title } = useGlobSetting();
  const { currentRoute } = useRouter();

  const pageTitle = usePageTitle();

  watch(
    () => currentRoute.value.path,
    () => {
      const route = unref(currentRoute);

      if (route.name === REDIRECT_NAME) {
        return;
      }

      const pageName = route?.meta?.title as string | undefined;
      pageTitle.value = pageName ? ` ${pageName} - ${title} ` : `${title}`;
    },
    { immediate: true },
  );
}
