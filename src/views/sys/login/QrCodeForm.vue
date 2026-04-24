<template>
	<template v-if="getShow">
		<LoginFormTitle />
		<div class="qr-code-form enter-x">
			<QrCode :value="qrCodeUrl" class="enter-x qr-code-image" :width="240" />
			<el-divider class="enter-x">{{ TEXT.qrTips }}</el-divider>
			<el-button class="login-secondary-button mt-4 enter-x" @click="handleBackLogin">{{ TEXT.back }}</el-button>
		</div>
	</template>
</template>

<script setup>
import { computed, unref } from 'vue'
import LoginFormTitle from './LoginFormTitle.vue'
import { QrCode } from '@/components/Qrcode'
import { LoginStateEnum, useLoginState } from './useLogin'

const TEXT = {
	qrTips: '\u626b\u7801\u786e\u8ba4\u540e\u5373\u53ef\u5b8c\u6210\u767b\u5f55',
	back: '\u8fd4\u56de',
}

const qrCodeUrl = 'https://vvbin.cn/next/login'
const { handleBackLogin, getLoginState } = useLoginState()
const getShow = computed(() => unref(getLoginState) === LoginStateEnum.QR_CODE)
</script>

<style lang="less" scoped>
.qr-code-form {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 320px;
}

.qr-code-image {
	display: flex;
	justify-content: center;
	width: 100%;
}

.login-secondary-button {
	width: 100%;
	height: 44px;
	border-radius: 8px;
}
</style>
