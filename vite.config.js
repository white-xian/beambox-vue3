import { resolve } from 'node:path'

import { defineApplicationConfig } from '@xueyi/vite-config'
import { defineConfig, loadEnv, mergeConfig } from 'vite'

const baseConfig = defineApplicationConfig()

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const rewriteProxy = (prefix) => (path) => path.replace(new RegExp(`^${escapeRegExp(prefix)}`), '')

export default defineConfig(async (configEnv) => {
	const root = process.cwd()
	const env = loadEnv(configEnv.mode, root, '')

	const port = Number(process.env.port || process.env.npm_config_port || env.VITE_PORT || 5477)
	const baseApi = env.VITE_APP_BASE_API || '/dev-api'
	const proxyTarget = env.VITE_APP_PROXY_TARGET

	const resolvedBaseConfig = typeof baseConfig === 'function' ? await baseConfig(configEnv) : baseConfig

	return mergeConfig(resolvedBaseConfig, {
		build: {
			outDir: 'dist',
			assetsDir: 'static',
			sourcemap: false,
		},
		css: {
			preprocessorOptions: {
				sass: {
					api: 'modern-compiler',
					style: 'expanded',
				},
				scss: {
					api: 'modern-compiler',
					style: 'expanded',
				},
			},
		},
		optimizeDeps: {
			include: ['echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers', 'qrcode', '@iconify/iconify', 'ant-design-vue/es/locale/zh_CN', 'ant-design-vue/es/locale/en_US'],
		},
		resolve: {
			alias: {
				'@': resolve(root, 'src'),
			},
		},
		server: {
			host: '0.0.0.0',
			port,
			open: true,
			proxy: {
				// 业务接口代理
				[baseApi]: {
					target: proxyTarget,
					changeOrigin: true,
					ws: true,
					rewrite: rewriteProxy(baseApi),
					timeout: 0, // 上传大文件时不限制代理超时
					proxyTimeout: 0,
				},
				// 对象存储代理，避免开发环境跨域
				'/proxy-bucket': {
					target: 'https://nnfamily-community-bucket.eos-dongguan-7.cmecloud.cn',
					changeOrigin: true,
					secure: true,
					rewrite: rewriteProxy('/proxy-bucket'),
				},
				// Swagger/OpenAPI 文档代理
				'^/v3/api-docs/(.*)': {
					target: proxyTarget,
					changeOrigin: true,
				},
			},
			warmup: {
				clientFiles: ['./index.html', './src/{views,components}/*'],
			},
		},
	})
})
