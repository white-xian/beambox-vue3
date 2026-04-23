<template>
	<template v-if="getShow">
		<LoginFormTitle class="enter-x" />
		<div class="enter-x min-w-64 min-h-64">
			<QrCode :value="qrCodeUrl" class="enter-x flex justify-center xl:justify-start" :width="280" />
			<Divider class="enter-x">扫码后点击"确认"，即可完成登录</Divider>
			<Button size="large" block class="mt-4 enter-x" @click="handleBackLogin"> 返回 </Button>
		</div>
	</template>
</template>

<script setup>
import { computed, unref } from 'vue'
import LoginFormTitle from './LoginFormTitle.vue'
import { Button, Divider } from 'ant-design-vue'
import { QrCode } from '@/components/Qrcode'
import { LoginStateEnum, useLoginState } from './useLogin'

const qrCodeUrl = 'https://vvbin.cn/next/login'
const { handleBackLogin, getLoginState } = useLoginState()

const getShow = computed(() => unref(getLoginState) === LoginStateEnum.QR_CODE)
</script>
