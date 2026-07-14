import { resolve } from 'node:path';

import dayjs from 'dayjs';
import { readPackageJSON } from 'pkg-types';
import { defineConfig, loadEnv, mergeConfig, type UserConfig } from 'vite';

import { createPlugins } from '../plugins';
import { generateModifyVars } from '../utils/modifyVars';
import { commonConfig } from './common';

interface DefineOptions {
  overrides?: UserConfig;
  options?: {
    //
  };
}

function defineApplicationConfig(defineOptions: DefineOptions = {}) {
  const { overrides = {} } = defineOptions;

  return defineConfig(async ({ command, mode }) => {
    const root = process.cwd();
    const isBuild = command === 'build';
    const { VITE_PUBLIC_PATH, VITE_USE_MOCK, VITE_BUILD_COMPRESS, VITE_ENABLE_ANALYZE } = loadEnv(
      mode,
      root,
    );

    const defineData = await createDefineData(root);
    const plugins = await createPlugins({
      isBuild,
      root,
      enableAnalyze: VITE_ENABLE_ANALYZE === 'true',
      enableMock: VITE_USE_MOCK === 'true',
      compress: VITE_BUILD_COMPRESS,
    });

    const pathResolve = (pathname: string) => resolve(root, '.', pathname);
    const applicationConfig: UserConfig = {
      base: VITE_PUBLIC_PATH,
      resolve: {
        alias: [
          // @/xxxx => src/xxxx
          {
            find: /@\//,
            replacement: pathResolve('src') + '/',
          },
          // #/xxxx => types/xxxx
          {
            find: /#\//,
            replacement: pathResolve('types') + '/',
          },
        ],
      },
      define: defineData,
      build: {
        target: ['edge90', 'chrome90', 'firefox90', 'safari15'],
        cssTarget: 'chrome90',
        // 将 CSS 合并到对应 JS chunk，减少 CSS 文件碎片
        cssCodeSplit: false,
        rollupOptions: {
          output: {
            // 入口文件名
            entryFileNames: 'assets/entry/[name]-[hash].js',
            // 提升共享传递依赖，减少重复代码
            hoistTransitiveImports: true,
            // 使用 ES2015 语法输出（目标浏览器已支持），更小体积
            generatedCode: 'es2015',
            // 合并小于 20KB 的业务 chunk，进一步减少文件碎片
            experimentalMinChunkSize: 20000,
            // 使用函数式 manualChunks 将 node_modules 按库分组
            // 避免生成数百个微小 chunk 文件，减少磁盘 I/O 压力
            // 注意：返回 undefined 让 Rollup 自行处理未匹配模块，避免循环依赖
            manualChunks(id) {
              if (!id.includes('node_modules')) return;

              // ⚠️ 检查顺序很重要：@vueuse 必须在 @vue 之前
              // 因为 '@vueuse' 是 '@vue' 的子串，会误匹配
              if (id.includes('node_modules/@vueuse')) {
                return 'vueuse';
              }

              // Vue 生态核心
              // vue/ 匹配 vue 核心库，@vue/ 匹配 @vue/shared、@vue/runtime-core 等作用域包
              if (id.includes('node_modules/vue/') ||
                  id.includes('node_modules/@vue/') ||
                  id.includes('node_modules/pinia/') ||
                  id.includes('node_modules/vue-router/')) {
                return 'vue-ecosystem';
              }

              // Ant Design Vue
              if (id.includes('node_modules/ant-design-vue') ||
                  id.includes('node_modules/@ant-design/')) {
                return 'antd';
              }

              // Element Plus
              if (id.includes('node_modules/element-plus') ||
                  id.includes('node_modules/@element-plus/')) {
                return 'element-plus';
              }

              // ECharts + ZRender
              if (id.includes('node_modules/echarts/') ||
                  id.includes('node_modules/zrender/')) {
                return 'echarts';
              }

              // CodeMirror（将全部语言模式合并）
              if (id.includes('node_modules/codemirror/')) {
                return 'codemirror';
              }

              // ExcelJS
              if (id.includes('node_modules/exceljs/')) {
                return 'exceljs';
              }

              // LogicFlow 流程图
              if (id.includes('node_modules/@logicflow/')) {
                return 'logicflow';
              }

              // Lodash
              if (id.includes('node_modules/lodash-es/')) {
                return 'lodash';
              }

              // 其余中小型通用依赖合并
              if (id.includes('node_modules/@iconify/') ||
                  id.includes('node_modules/@zxcvbn-ts/') ||
                  id.includes('node_modules/crypto-js/') ||
                  id.includes('node_modules/dayjs/') ||
                  id.includes('node_modules/axios/') ||
                  id.includes('node_modules/qs/') ||
                  id.includes('node_modules/sortablejs/') ||
                  id.includes('node_modules/html2canvas/') ||
                  id.includes('node_modules/cropperjs/') ||
                  id.includes('node_modules/qrcode/') ||
                  id.includes('node_modules/nprogress/') ||
                  id.includes('node_modules/showdown/') ||
                  id.includes('node_modules/print-js/') ||
                  id.includes('node_modules/path-to-regexp/') ||
                  id.includes('node_modules/resize-observer-polyfill/') ||
                  id.includes('node_modules/xlsx/') ||
                  id.includes('node_modules/xe-utils/') ||
                  id.includes('node_modules/vue-draggable-plus/') ||
                  id.includes('node_modules/vue-json-pretty/')) {
                return 'vendor-common';
              }

              // VxeTable 系列
              if (id.includes('node_modules/vxe-pc-ui/') ||
                  id.includes('node_modules/vxe-table/')) {
                return 'vxe-table';
              }

              // 不返回兜底 chunk，交给 Rollup 自动处理，避免循环依赖
            },
          },
        },
      },
      css: {
        preprocessorOptions: {
          less: {
            modifyVars: generateModifyVars(),
            javascriptEnabled: true,
          },
        },
      },
      plugins,
    };

    const mergedConfig = mergeConfig(commonConfig(mode), applicationConfig);

    return mergeConfig(mergedConfig, overrides);
  });
}

async function createDefineData(root: string) {
  try {
    const pkgJson = await readPackageJSON(root);
    const { dependencies, devDependencies, name, version } = pkgJson;

    const __APP_INFO__ = {
      pkg: { dependencies, devDependencies, name, version },
      lastBuildTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };
    return {
      __APP_INFO__: JSON.stringify(__APP_INFO__),
    };
  } catch (error) {
    return {};
  }
}

export { defineApplicationConfig };
