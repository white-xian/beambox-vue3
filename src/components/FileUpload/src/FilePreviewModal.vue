<!-- @format -->

<template>
	<Modal :open="open" :title="title" :footer="null" :width="modalWidth" :destroy-on-close="true" centered wrap-class-name="file-preview-modal" @cancel="handleClose">
		<div class="file-preview">
			<!-- 图片预览 -->
			<template v-if="file && (file.fileType === 'image' || file.fileType === 'gif')">
				<div class="file-preview__image-wrap">
					<img :src="file.url || file.thumbUrl" :alt="file.name" class="file-preview__image" :class="{ 'file-preview__image--gif-mono': file.fileType === 'gif' && gifMonoEffect }" :style="gifMonoStyle" />
				</div>
			</template>
			<!-- GIF 双栏对比模式 -->
			<template v-if="file && file.fileType === 'gif' && gifMonoEffect">
				<div class="file-preview__gif-compare">
					<div class="file-preview__gif-col">
						<div class="file-preview__gif-label">原始效果</div>
						<img :src="file.url || file.thumbUrl" :alt="file.name" class="file-preview__image" />
					</div>
					<div class="file-preview__gif-col">
						<div class="file-preview__gif-label">黑白动图特效</div>
						<img :src="file.url || file.thumbUrl" :alt="file.name" class="file-preview__image file-preview__image--gif-mono" :style="gifMonoStyle" />
					</div>
				</div>
			</template>
			<!-- 视频预览 -->
			<template v-else-if="file && file.fileType === 'video'">
				<div class="file-preview__video-wrap">
					<video controls autoplay class="file-preview__video">
						<source :src="file.url" :type="file.type || 'video/mp4'" />
						您的浏览器不支持视频播放
					</video>
				</div>
			</template>
			<!-- 音频预览 -->
			<template v-else-if="file && file.fileType === 'audio'">
				<div class="file-preview__audio-wrap">
					<div class="file-preview__audio-icon">
						<AudioOutlined />
					</div>
					<audio controls class="file-preview__audio">
						<source :src="file.url" />
						您的浏览器不支持音频播放
					</audio>
					<div class="file-preview__audio-name">{{ file.name }}</div>
				</div>
			</template>
			<!-- 其他文件类型：提供下载 -->
			<template v-else-if="file">
				<div class="file-preview__other">
					<component :is="fileIconComp" class="file-preview__other-icon" />
					<div class="file-preview__other-name">{{ file.name }}</div>
					<div v-if="file.size" class="file-preview__other-size">{{ formatFileSize(file.size) }}</div>
					<a-button type="primary" @click="handleDownload">
						<DownloadOutlined />
						下载文件
					</a-button>
				</div>
			</template>
			<!-- 空状态 -->
			<div v-else class="file-preview__empty">
				<InboxOutlined class="file-preview__empty-icon" />
				<span>暂无文件可预览</span>
			</div>
		</div>
		<!-- 底部信息栏 -->
		<template v-if="file" #footer>
			<div class="file-preview__footer">
				<span class="file-preview__footer-name">{{ file.name }}</span>
				<span v-if="file.size" class="file-preview__footer-size">{{ formatFileSize(file.size) }}</span>
				<a-button size="small" @click="handleDownload">
					<DownloadOutlined />
					下载
				</a-button>
			</div>
		</template>
	</Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Modal } from 'ant-design-vue'
import { AudioOutlined, DownloadOutlined, InboxOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FilePptOutlined, FileTextOutlined, FileZipOutlined, FileUnknownOutlined } from '@ant-design/icons-vue'
import type { FileUploadItem } from './types'
import { FileTypeEnum } from './types'
import { formatFileSize } from './helper'

defineOptions({ name: 'FilePreviewModal' })

const props = defineProps<{
	open: boolean
	file: FileUploadItem | null
	gifMonoEffect?: boolean
	gifMonoBg?: string
}>()

const emit = defineEmits(['update:open', 'close'])

const title = computed(() => {
	if (!props.file) return '文件预览'
	return props.file.name || '文件预览'
})

const modalWidth = computed(() => {
	if (!props.file) return 520
	if (props.file.fileType === FileTypeEnum.GIF && props.gifMonoEffect) return 900
	if (props.file.fileType === FileTypeEnum.VIDEO) return 800
	return 720
})

const gifMonoStyle = computed(() => {
	if (!props.gifMonoEffect) return {}
	return {
		mixBlendMode: 'difference',
		background: props.gifMonoBg || 'transparent',
	} as Record<string, string>
})

const fileIconComp = computed(() => {
	if (!props.file) return FileUnknownOutlined
	const ext = (props.file.name || '').split('.').pop()?.toLowerCase()
	if (ext === 'pdf') return FilePdfOutlined
	if (ext === 'doc' || ext === 'docx') return FileWordOutlined
	if (ext === 'xls' || ext === 'xlsx') return FileExcelOutlined
	if (ext === 'ppt' || ext === 'pptx') return FilePptOutlined
	if (ext === 'zip' || ext === 'rar' || ext === '7z') return FileZipOutlined
	if (ext === 'txt' || ext === 'md' || ext === 'json') return FileTextOutlined
	return FileUnknownOutlined
})

function handleClose() {
	emit('update:open', false)
	emit('close')
}

function handleDownload() {
	if (!props.file?.url) return
	const a = document.createElement('a')
	a.href = props.file.url
	a.download = props.file.name || ''
	a.target = '_blank'
	a.click()
}
</script>

<style lang="scss" scoped>
.file-preview {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 200px;
	max-height: 70vh;
	overflow: auto;

	/* ===== 图片预览 ===== */
	&__image-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		max-width: 100%;
		max-height: 70vh;
	}

	&__image {
		max-width: 100%;
		max-height: 70vh;
		object-fit: contain;
		border-radius: 4px;

		&--gif-mono {
			filter: grayscale(1) contrast(2);
		}
	}

	/* ===== GIF 对比 ===== */
	&__gif-compare {
		display: flex;
		gap: 24px;
		width: 100%;
	}

	&__gif-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	&__gif-label {
		font-size: 13px;
		color: #909399;
		font-weight: 500;
	}

	/* ===== 视频预览 ===== */
	&__video-wrap {
		width: 100%;
	}

	&__video {
		width: 100%;
		max-height: 65vh;
		border-radius: 4px;
		background: #000;
	}

	/* ===== 音频预览 ===== */
	&__audio-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: 24px;
	}

	&__audio-icon {
		font-size: 64px;
		color: #409eff;
	}

	&__audio {
		width: 100%;
		max-width: 400px;
	}

	&__audio-name {
		font-size: 14px;
		color: #606266;
		text-align: center;
		word-break: break-all;
	}

	/* ===== 其他文件 ===== */
	&__other {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 32px;
	}

	&__other-icon {
		font-size: 64px;
		color: #8c939d;
	}

	&__other-name {
		font-size: 14px;
		color: #303133;
		text-align: center;
		word-break: break-all;
		max-width: 300px;
	}

	&__other-size {
		font-size: 12px;
		color: #c0c4cc;
	}

	/* ===== 空状态 ===== */
	&__empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 48px;
		color: #c0c4cc;
		font-size: 14px;
	}

	&__empty-icon {
		font-size: 48px;
	}
}

/* ===== 底部信息栏 ===== */
.file-preview__footer {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 12px;
	width: 100%;

	&-name {
		flex: 1;
		font-size: 13px;
		color: #303133;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	&-size {
		font-size: 12px;
		color: #c0c4cc;
	}
}
</style>

<style lang="scss">
.file-preview-modal {
	.ant-modal-body {
		padding: 16px;
	}

	.ant-modal-footer {
		padding: 8px 16px;
		border-top: 1px solid #f0f0f0;
	}
}

html[data-theme='dark'] {
	.file-preview-modal {
		.ant-modal-footer {
			border-top-color: #303030;
		}
	}

	.file-preview {
		&__gif-label {
			color: #8b949e;
		}

		&__audio-name,
		&__other-name {
			color: #e6edf3;
		}

		&__other-size {
			color: #484f58;
		}

		&__other-icon {
			color: #6e7681;
		}
	}

	.file-preview__footer {
		&-name {
			color: #e6edf3;
		}

		&-size {
			color: #484f58;
		}
	}
}
</style>
