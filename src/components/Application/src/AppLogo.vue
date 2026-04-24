<template>
	<div class="anticon" :class="getAppLogoClass" @click="goHome">
		<img :src="getLogoSrc" :alt="title" :class="`${prefixCls}__img`" :style="getLogoImgStyle" />
		<div class="ml-2 truncate md:opacity-100" :class="getTitleClass" v-show="showTitle">
			{{ title }}
		</div>
	</div>
</template>
<script setup>
import { computed, unref } from 'vue'
import { useGlobSetting } from '@/hooks/setting'
import { useGo } from '@/hooks/web/usePage'
import { useMenuSetting } from '@/hooks/setting/useMenuSetting'
import { useDesign } from '@/hooks/web/useDesign'
import { PageEnum } from '@/enums'
import { useUserStore } from '@/store/modules/user'
import faviconLogo from '@/assets/images/favicon.png'

const props = defineProps({
	/**
	 * The theme of the current parent component
	 */
	theme: { type: String, validator: (v) => ['light', 'dark'].includes(v) },
	/**
	 * Whether to show title
	 */
	showTitle: { type: Boolean, default: true },
	/**
	 * The title is also displayed when the menu is collapsed
	 */
	alwaysShowTitle: { type: Boolean },
	/**
	 * Custom logo image source
	 */
	imgSrc: { type: String, default: '' },
	/**
	 * Custom logo image style
	 */
	imgStyle: { type: Object, default: undefined },
})

const { prefixCls } = useDesign('app-logo')
const { getCollapsedShowTitle } = useMenuSetting()
const userStore = useUserStore()
const { title } = useGlobSetting()
const go = useGo()

const getAppLogoClass = computed(() => [prefixCls, props.theme, { 'collapsed-show-title': unref(getCollapsedShowTitle) }])

const getLogoSrc = computed(() => props.imgSrc || (props.showTitle ? '/logo.png' : faviconLogo))

const getLogoImgStyle = computed(() => {
	if (props.imgStyle) {
		return props.imgStyle
	}

	if (props.imgSrc) {
		return undefined
	}

	return props.showTitle
		? {
				width: '195px',
				height: '100%',
			}
		: {
				width: '155px',
				height: '100%',
			}
})

const getTitleClass = computed(() => [
	`${prefixCls}__title`,
	{
		'xs:opacity-0': !props.alwaysShowTitle,
	},
])

function goHome() {
	go(userStore.getUserInfo.homePath || PageEnum.BASE_HOME)
}
</script>
<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-app-logo';

.@{prefix-cls} {
	display: flex;
	align-items: center;
	padding-left: 7px;
	transition: all 0.2s ease;
	cursor: pointer;

	&__img {
		display: block;
		flex-shrink: 0;
		object-fit: contain;
	}

	&.light {
		border-bottom: 1px solid @border-color-base;
	}

	&.collapsed-show-title {
		padding-left: 20px;
	}

	&.light &__title {
		color: @primary-color;
	}

	&.dark &__title {
		color: @white;
	}

	&__title {
		transition: all 0.5s;
		font-size: 16px;
		font-weight: 700;
		line-height: normal;
	}
}
</style>
