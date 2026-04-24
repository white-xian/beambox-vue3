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
}

bootstrap();
