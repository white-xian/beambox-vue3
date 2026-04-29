<template>
	<template v-if="getShow">
		<LoginFormTitle />
		<el-form ref="formRef" class="login-form enter-x" :model="formData" :rules="getFormRules" label-position="top">
			<el-form-item prop="userName" class="enter-x">
				<div class="login-field-label">{{ TEXT.accountLabel }}</div>
				<el-input v-model="formData.userName" size="large" :placeholder="TEXT.accountPlaceholder" clearable />
			</el-form-item>

			<el-form-item prop="mobile" class="enter-x">
				<div class="login-field-label">{{ TEXT.mobileLabel }}</div>
				<el-input v-model="formData.mobile" size="large" :placeholder="TEXT.mobilePlaceholder" clearable />
			</el-form-item>

			<el-form-item prop="sms" class="enter-x">
				<div class="login-field-label">{{ TEXT.smsLabel }}</div>
				<el-input v-model="formData.sms" size="large" :placeholder="TEXT.smsPlaceholder">
					<template #append>
						<button type="button" class="login-inline-button" :disabled="smsCountdown > 0" @click="handleSendCode">
							{{ smsCountdown > 0 ? `${smsCountdown}s` : TEXT.sendCode }}
						</button>
					</template>
				</el-input>
			</el-form-item>

			<el-form-item prop="password" class="enter-x">
				<div class="login-field-label">{{ TEXT.passwordLabel }}</div>
				<el-input v-model="formData.password" size="large" type="password" :placeholder="TEXT.passwordPlaceholder" show-password />
			</el-form-item>

			<el-form-item prop="confirmPassword" class="enter-x">
				<div class="login-field-label">{{ TEXT.confirmPasswordLabel }}</div>
				<el-input v-model="formData.confirmPassword" size="large" type="password" :placeholder="TEXT.confirmPasswordPlaceholder" show-password />
			</el-form-item>

			<el-form-item prop="policy" class="enter-x">
				<el-checkbox v-model="formData.policy">{{ TEXT.policy }}</el-checkbox>
			</el-form-item>

			<el-button class="login-submit enter-x" type="primary" :loading="loading" @click="handleRegister">
				{{ TEXT.register }}
			</el-button>
			<el-button class="login-secondary-button mt-4 enter-x" @click="handleBackLogin">{{ TEXT.back }}</el-button>
		</el-form>
	</template>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, unref } from 'vue'
import LoginFormTitle from './LoginFormTitle.vue'
import { LoginStateEnum, useFormRules, useFormValid, useLoginState } from './useLogin'

const TEXT = {
	accountLabel: '\u8d26\u53f7',
	accountPlaceholder: '\u8bf7\u8f93\u5165\u5458\u5de5\u8d26\u53f7',
	mobileLabel: '\u624b\u673a\u53f7',
	mobilePlaceholder: '\u8bf7\u8f93\u5165\u624b\u673a\u53f7',
	smsLabel: '\u77ed\u4fe1\u9a8c\u8bc1\u7801',
	smsPlaceholder: '\u8bf7\u8f93\u5165\u77ed\u4fe1\u9a8c\u8bc1\u7801',
	sendCode: '\u83b7\u53d6\u9a8c\u8bc1\u7801',
	passwordLabel: '\u5bc6\u7801',
	passwordPlaceholder: '\u8bf7\u8f93\u5165\u5bc6\u7801',
	confirmPasswordLabel: '\u786e\u8ba4\u5bc6\u7801',
	confirmPasswordPlaceholder: '\u8bf7\u518d\u6b21\u8f93\u5165\u5bc6\u7801',
	policy: '\u6211\u5df2\u9605\u8bfb\u5e76\u540c\u610f\u5e73\u53f0\u670d\u52a1\u534f\u8bae',
	register: '\u6ce8\u518c',
	back: '\u8fd4\u56de',
}

const { handleBackLogin, getLoginState } = useLoginState()
const formRef = ref()
const loading = ref(false)
const smsCountdown = ref(0)
let smsTimer = null

const formData = reactive({
	userName: '',
	password: '',
	confirmPassword: '',
	mobile: '',
	sms: '',
	policy: false,
})

const { getFormRules } = useFormRules(formData)
const { validForm } = useFormValid(formRef, formData)
const getShow = computed(() => unref(getLoginState) === LoginStateEnum.REGISTER)

async function handleRegister() {
	const data = await validForm()
	if (!data) return
	console.log(data)
}

function handleSendCode() {
	if (smsCountdown.value > 0) return

	smsCountdown.value = 60
	smsTimer = window.setInterval(() => {
		smsCountdown.value -= 1
		if (smsCountdown.value <= 0) {
			window.clearInterval(smsTimer)
			smsTimer = null
		}
	}, 1000)
}

onBeforeUnmount(() => {
	if (smsTimer) {
		window.clearInterval(smsTimer)
	}
})
</script>

<style lang="less" scoped>
.login-form {
	width: 100%;
}

.login-field-label {
	margin-bottom: 10px;
	font-size: 14px;
	line-height: 20px;
	color: #4a4a4a;
}

.login-inline-button {
	padding: 0;
	border: none;
	background: transparent;
	color: #6f5fff;
	cursor: pointer;
}

.login-submit,
.login-secondary-button {
	width: 100%;
	height: 44px;
	border-radius: 8px;
}

.login-submit {
	border: none;
	background: linear-gradient(90deg, #5e59f3 0%, #6f5fff 100%);
	box-shadow: 0 16px 28px rgba(100, 92, 255, 0.26);
	font-size: 16px;
	font-weight: 500;
}

:deep(.el-form-item) {
	margin-bottom: 22px;
}

:deep(.el-form-item__content) {
	display: block;
}

:deep(.el-input__wrapper) {
	min-height: 40px;
	padding: 0 14px;
	border-radius: 6px;
	box-shadow: 0 0 0 1px #d8dceb inset;
}

:deep(.el-input__wrapper:hover),
:deep(.el-input__wrapper.is-focus) {
	box-shadow: 0 0 0 1px #7065ff inset;
}

:deep(.el-input-group__append) {
	border-left: none;
	background: #fff;
}

:deep(.el-checkbox__label) {
	font-size: 12px;
	color: #6f7482;
}
</style>
