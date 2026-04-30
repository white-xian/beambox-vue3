import 'uno.css';
import '@/design/index.less';
import '@/components/VxeTable/src/css/index.scss';
import 'ant-design-vue/dist/reset.css';
import 'element-plus/dist/index.css';
import 'virtual:svg-icons-register';

import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';

import { registerGlobComp } from '@/components/registerGlobComp';
import { setupGlobDirectives } from '@/directives';
import { setupErrorHandle } from '@/logics/error-handle';
import { initAppConfigStore } from '@/logics/initAppConfig';
import { router, setupRouter } from '@/router';
import { setupRouterGuard } from '@/router/guard';
import { setupStore } from '@/store';

import App from './App.vue';

function syncTableScrollbarCssVars() {
  if (typeof document === 'undefined') return () => {};

  const root = document.documentElement;
  if (!root) return () => {};

  function getLiveTableScrollbarGutter() {
    const wraps = Array.from(
      document.querySelectorAll('.xueyi-basic-table .el-table__body-wrapper .el-scrollbar__wrap')
    );

    return wraps.reduce((max, wrap) => {
      const gutterX = wrap.offsetWidth - wrap.clientWidth;
      const gutterY = wrap.offsetHeight - wrap.clientHeight;
      return Math.max(max, gutterX, gutterY, 0);
    }, 0);
  }

  function measureTableScrollbarGutter() {
    if (!document.body) return null;

    const scope = document.createElement('div');
    const bodyWrapper = document.createElement('div');
    const scrollWrap = document.createElement('div');
    scope.className = 'xueyi-basic-table';
    bodyWrapper.className = 'el-table__body-wrapper';
    scrollWrap.className = 'el-scrollbar__wrap';
    scope.style.visibility = 'hidden';
    scope.style.position = 'absolute';
    scope.style.top = '-9999px';
    scope.style.left = '-9999px';
    scope.style.width = '100px';
    scope.style.height = '100px';
    bodyWrapper.style.width = '100px';
    bodyWrapper.style.height = '100px';
    scrollWrap.style.overflow = 'scroll';
    scrollWrap.style.width = '100px';
    scrollWrap.style.height = '100px';

    bodyWrapper.appendChild(scrollWrap);
    scope.appendChild(bodyWrapper);
    document.body.appendChild(scope);

    const gutterX = scrollWrap.offsetWidth - scrollWrap.clientWidth;
    const gutterY = scrollWrap.offsetHeight - scrollWrap.clientHeight;
    const gutter = Math.max(gutterX, gutterY, 0);
    scope.parentNode && scope.parentNode.removeChild(scope);
    return gutter;
  }

  function applyVars() {
    const gutter = getLiveTableScrollbarGutter() || measureTableScrollbarGutter();
    const fallback = 16;
    const effectiveGutter = gutter !== null && gutter > 0 ? gutter : fallback;
    root.style.setProperty('--nn-measured-scrollbar-size', `${effectiveGutter}px`);
    root.style.setProperty('--nn-measured-scrollbar-gutter', `${effectiveGutter}px`);
  }

  if (document.body) {
    applyVars();
  } else {
    document.addEventListener('DOMContentLoaded', applyVars, { once: true });
  }

  window.addEventListener('resize', applyVars);
  return applyVars;
}

const refreshTableScrollbarCssVars = syncTableScrollbarCssVars();

async function bootstrap() {
  const app = createApp(App);

  app.use(ElementPlus, { locale: zhCn });
  setupStore(app);
  initAppConfigStore();
  registerGlobComp(app);
  setupRouter(app);
  setupRouterGuard(router);
  setupGlobDirectives(app);
  setupErrorHandle(app);

  app.mount('#app');
  requestAnimationFrame(refreshTableScrollbarCssVars);
}

bootstrap();
