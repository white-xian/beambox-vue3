<template>
	<h2 class="login-form-title enter-x">
		{{ getFormTitle }}
	</h2>
</template>

<script setup>
import { computed, unref } from 'vue'
import { LoginStateEnum, useLoginState } from './useLogin'

const { getLoginState } = useLoginState()

const TITLE_MAP = {
	[LoginStateEnum.LOGIN]: '\u767b\u5f55',
	[LoginStateEnum.REGISTER]: '\u6ce8\u518c',
	[LoginStateEnum.RESET_PASSWORD]: '\u91cd\u7f6e\u5bc6\u7801',
	[LoginStateEnum.MOBILE]: '\u624b\u673a\u767b\u5f55',
	[LoginStateEnum.QR_CODE]: '\u626b\u7801\u767b\u5f55',
}

const getFormTitle = computed(() => TITLE_MAP[unref(getLoginState)])
</script>

<style lang="less" scoped>
.login-form-title {
	margin: 0 0 24px;
	text-align: center;
	font-size: 38px;
	line-height: 1.2;
	font-weight: 700;
	color: #1f2d3d;
}
</style>
