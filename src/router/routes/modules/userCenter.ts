import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const userCenter: AppRouteModule = {
  path: '/userCenter',
  name: 'UserCenter',
  component: LAYOUT,
  redirect: '/userCenter/index',
  meta: {
    hideChildrenInMenu: true,
    icon: 'simple-icons:aboutdotme',
    title: "个人中心",
    orderNo: 100000,
    hideMenu: true,
  },
  children: [
    {
      path: 'index',
      name: 'AboutPage',
      component: () => import('@/views/sys/userCenter/index.vue'),
      meta: {
        title: "个人中心",
        icon: 'simple-icons:aboutdotme',
        hideMenu: true,
      },
    },
  ],
};

export default userCenter;
