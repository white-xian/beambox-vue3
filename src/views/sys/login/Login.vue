<template>
	<div :class="prefixCls" class="relative w-full h-full px-4">
		<div class="flex items-center absolute right-4 top-4">
			<AppDarkModeToggle class="enter-x mr-2" v-if="!sessionTimeout" />
		</div>

		<span class="-enter-x xl:hidden">
			<AppLogo :alwaysShowTitle="true" />
		</span>

		<div class="container relative h-full py-2 mx-auto sm:px-10">
			<div class="flex h-full">
				<div class="hidden min-h-full pl-4 mr-4 xl:flex xl:flex-col xl:w-6/12">
					<AppLogo class="-enter-x login-logo" />
					<div class="my-auto">
						<img :alt="title" src="../../../assets/svg/login-box-bg.svg" class="w-1/2 -mt-16 -enter-x" />
						<div class="mt-10 font-medium text-white -enter-x">
							<span class="inline-block mt-4 text-3xl"> BEAMBOX 的信息管理系统</span>
						</div>
						<div class="mt-5 font-normal text-white dark:text-gray-500 -enter-x">输入您的个人详细信息开始使用！</div>
					</div>
				</div>
				<div class="flex w-full h-full py-5 xl:h-auto xl:py-0 xl:my-0 xl:w-6/12">
					<div :class="`${prefixCls}-form`" class="relative w-full px-5 py-8 mx-auto my-auto rounded-md shadow-md xl:ml-16 xl:bg-transparent sm:px-8 xl:p-4 xl:shadow-none sm:w-3/4 lg:w-2/4 xl:w-auto enter-x">
						<LoginForm />
						<ForgetPasswordForm />
						<RegisterForm />
						<MobileForm />
						<QrCodeForm />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed } from 'vue'
import { AppDarkModeToggle, AppLogo } from '@/components/Application'
import LoginForm from './LoginForm.vue'
import ForgetPasswordForm from './ForgetPasswordForm.vue'
import RegisterForm from './RegisterForm.vue'
import MobileForm from './MobileForm.vue'
import QrCodeForm from './QrCodeForm.vue'
import { useGlobSetting } from '@/hooks/setting'
import { useDesign } from '@/hooks/web/useDesign'

defineProps({
	sessionTimeout: {
		type: Boolean,
	},
})

const globSetting = useGlobSetting()
const { prefixCls } = useDesign('login')
const title = computed(() => globSetting?.title ?? '')
</script>

<style lang="less">
@prefix-cls: ~'@{namespace}-login';
@logo-prefix-cls: ~'@{namespace}-app-logo';
@countdown-prefix-cls: ~'@{namespace}-countdown-input';
@dark-bg: #293146;

html[data-theme='dark'] {
	.@{prefix-cls} {
		background-color: @dark-bg;

		&::before {
			background-image: url(@/assets/svg/login-bg-dark.svg);
		}

		.ant-input,
		.ant-input-password {
			background-color: #232a3b;
		}

		.ant-btn:not(.ant-btn-link):not(.ant-btn-primary) {
			border: 1px solid #4a5569;
		}

		&-form {
			background: transparent !important;
		}

		.app-iconify {
			color: #fff;
		}
	}

	.ant-divider-inner-text {
		color: @text-color-secondary;
	}
}

.@{prefix-cls} {
	min-height: 100%;
	overflow: hidden;

	/* stylelint-disable-next-line media-query-no-invalid */
	@media (max-width: @screen-lg-max) {
		background-color: #293146;

		.@{prefix-cls}-form {
			background-color: #fff;
		}
	}

	&::before {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		margin-left: -48%;
		background-image: url(@/assets/svg/login-bg.svg);
		background-position: 100%;
		background-repeat: no-repeat;
		background-size: auto 100%;
		content: '';
		/* stylelint-disable-next-line media-query-no-invalid */
		@media (max-width: @screen-lg-max) {
			display: none;
		}
	}

	.@{logo-prefix-cls} {
		position: absolute;
		top: 12px;
		height: 30px;

		&__title {
			margin-left: 16px !important;
			font-size: 18px;
			line-height: 1;
			color: #fff;
			transform: translateY(4px);
		}

		img {
			width: 155px;
			height: 38px;
			object-fit: contain;
			display: block;
			flex-shrink: 0;
		}
	}

	.container {
		.@{logo-prefix-cls} {
			--login-logo-image-offset-y: 0;
			--login-logo-title-offset-y: 5px;

			display: flex;
			align-items: center;
			width: auto;
			height: 80px;
			padding-left: 0;
			line-height: 1;

			&__title {
				margin-left: 16px !important;
				font-size: 24px;
				line-height: 1;
				color: #fff;
				transform: translateY(var(--login-logo-title-offset-y));
			}

			img {
				width: 195px;
				height: 38px;
				object-fit: contain;
				display: block;
				flex-shrink: 0;
				transform: translateY(var(--login-logo-image-offset-y));
			}
		}
	}

	&-sign-in-way {
		.anticon {
			font-size: 22px;
			color: #888;
			cursor: pointer;

			&:hover {
				color: @primary-color;
			}
		}
	}

	&-form {
		width: 100%;
		max-width: 440px;
	}

	.ant-input,
	.ant-input-affix-wrapper,
	.ant-input-group-wrapper {
		width: 100%;
		max-width: 100%;
	}
}
</style>
