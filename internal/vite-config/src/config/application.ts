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
            // 使用函数式 manualChunks 将 node_modules 按库分组
            // 避免生成数百个微小 chunk 文件，减少磁盘 I/O 压力
            manualChunks(id) {
              if (!id.includes('node_modules')) return;

              // Vue 生态核心
              if (id.includes('node_modules/vue') ||
                  id.includes('node_modules/@vue') ||
                  id.includes('node_modules/pinia') ||
                  id.includes('node_modules/vue-router')) {
                return 'vue-ecosystem';
              }

              // Ant Design Vue
              if (id.includes('node_modules/ant-design-vue') ||
                  id.includes('node_modules/@ant-design')) {
                return 'antd';
              }

              // Element Plus
              if (id.includes('node_modules/element-plus') ||
                  id.includes('node_modules/@element-plus')) {
                return 'element-plus';
              }

              // ECharts + ZRender（数据可视化核心）
              if (id.includes('node_modules/echarts') ||
                  id.includes('node_modules/zrender')) {
                return 'echarts';
              }

              // CodeMirror（将全部语言模式合并，避免 50+ 个独立文件）
              if (id.includes('node_modules/codemirror')) {
                return 'codemirror';
              }

              // ExcelJS（大体积独立库）
              if (id.includes('node_modules/exceljs')) {
                return 'exceljs';
              }

              // LogicFlow 流程图
              if (id.includes('node_modules/@logicflow')) {
                return 'logicflow';
              }

              // VueUse 工具集
              if (id.includes('node_modules/@vueuse')) {
                return 'vueuse';
              }

              // Lodash
              if (id.includes('node_modules/lodash-es')) {
                return 'lodash';
              }

              // 其余中小型通用依赖合并
              if (id.includes('node_modules/@iconify') ||
                  id.includes('node_modules/@zxcvbn-ts') ||
                  id.includes('node_modules/crypto-js') ||
                  id.includes('node_modules/dayjs') ||
                  id.includes('node_modules/axios') ||
                  id.includes('node_modules/qs') ||
                  id.includes('node_modules/sortablejs') ||
                  id.includes('node_modules/html2canvas') ||
                  id.includes('node_modules/cropperjs') ||
                  id.includes('node_modules/qrcode') ||
                  id.includes('node_modules/nprogress') ||
                  id.includes('node_modules/showdown') ||
                  id.includes('node_modules/print-js') ||
                  id.includes('node_modules/path-to-regexp') ||
                  id.includes('node_modules/resize-observer-polyfill')) {
                return 'vendor-common';
              }

              // 兜底：其余 node_modules
              return 'vendor';
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
