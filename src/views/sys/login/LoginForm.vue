<template>
	<LoginFormTitle v-show="getShow" />
	<el-form v-show="getShow" ref="formRef" class="login-form enter-x" :model="formData" :rules="getFormRules" label-position="top">
		<el-form-item prop="userName" class="enter-x">
			<div class="login-field-label">{{ TEXT.accountLabel }}</div>
			<el-input v-model="formData.userName" size="large" :placeholder="TEXT.accountPlaceholder" clearable />
		</el-form-item>

		<el-form-item prop="password" class="enter-x">
			<div class="login-field-label">{{ TEXT.passwordLabel }}</div>
			<el-input v-model="formData.password" size="large" type="password" :placeholder="TEXT.passwordPlaceholder" show-password />
		</el-form-item>

		<el-form-item v-if="captchaData.captchaOnOff" prop="code" class="enter-x">
			<div class="login-field-label">{{ TEXT.codeLabel }}</div>
			<div class="login-captcha-row">
				<el-input v-model="formData.code" size="large" :placeholder="TEXT.codePlaceholder" />
				<div class="login-code-box" :class="{ 'is-loading': captchaLoading, 'is-error': captchaLoadFailed }" @click="handleCodeImage({ isRefresh: true })">
					<Icon v-if="captchaLoading" icon="line-md:loading-loop" />
					<img v-else-if="captchaData.img" class="code-image" :src="captchaData.img" :alt="TEXT.codeLabel" />
					<div v-else-if="captchaLoadFailed" class="code-error" :title="TEXT.codeLoadError">
						<span>{{ TEXT.codeLoadErrorShort }}</span>
						<small>{{ TEXT.codeRetryTip }}</small>
					</div>
					<div v-else class="login-code-placeholder"></div>
				</div>
			</div>
		</el-form-item>

		<div class="login-options enter-x">
			<el-checkbox v-model="rememberMe">{{ TEXT.rememberMe }}</el-checkbox>
			<!-- <button type="button" class="login-link-button" @click="setLoginState(LoginStateEnum.RESET_PASSWORD)">
				{{ TEXT.forgetPassword }}
			</button> -->
		</div>

		<el-button class="login-submit enter-x" type="primary" :loading="loading" @click="handleLogin">
			{{ TEXT.login }}
		</el-button>
	</el-form>
</template>

<script setup>
import { computed, onMounted, reactive, ref, unref } from 'vue'
import { ElNotification } from 'element-plus'
import { onKeyStroke } from '@vueuse/core'
import Icon from '@/components/Icon/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'
import LoginFormTitle from './LoginFormTitle.vue'
import { useUserStore } from '@/store/modules/user'
import { LoginStateEnum, useFormRules, useFormValid, useLoginState } from './useLogin'
import { ENTERPRISE_NAME_SESSION_CACHE_KEY, PASSWORD_SESSION_CACHE_KEY, REMEMBER_ME_SESSION_CACHE_KEY, USER_NAME_SESSION_CACHE_KEY } from '@/enums'

const TEXT = {
  accountLabel: '账号',
  accountPlaceholder: '请输入员工账号',
  passwordLabel: '密码',
  passwordPlaceholder: '请输入密码',
  codeLabel: '验证码',
  codePlaceholder: '请输入验证码',
  rememberMe: '记住我',
  forgetPassword: '忘记密码？',
  login: '登录',
  loginSuccess: '登录成功',
  welcomeBack: '欢迎回来',
  errorTip: '错误提示',
  networkError: '网络异常，请检查您的网络连接是否正常',
  codeLoadErrorShort: '验证码加载失败',
  codeRetryTip: '点击重试',
  codeLoadError: '验证码加载失败，请点击验证码区域重试',
  codeRefreshError: '验证码刷新失败，请点击验证码区域重试',
}

const userStore = useUserStore()
const { createMessage } = useMessage()
// const { setLoginState, getLoginState } = useLoginState()
const { getLoginState } = useLoginState()
const { getFormRules } = useFormRules()

const formRef = ref()
const loading = ref(false)
const captchaLoading = ref(false)
const captchaLoadFailed = ref(false)
const rememberMe = ref(localStorage.getItem(REMEMBER_ME_SESSION_CACHE_KEY) === 'true')
const lastGetCodeAt = ref(0)

const formData = reactive({
	userName: localStorage.getItem(USER_NAME_SESSION_CACHE_KEY) || '',
	password: localStorage.getItem(PASSWORD_SESSION_CACHE_KEY) || '',
	code: '',
})

const captchaData = reactive({
	captchaOnOff: true,
	img: '',
	uuid: '',
})

const { validForm } = useFormValid(formRef, formData)
const getShow = computed(() => unref(getLoginState) === LoginStateEnum.LOGIN)

onKeyStroke('Enter', handleLogin)

async function handleLogin() {
	const data = await validForm()
	if (!data) return

	try {
		loading.value = true
		const userInfo = await userStore.login({
			enterpriseName: 'administrator',
			userName: data.userName,
			password: data.password,
			code: data.code,
			uuid: captchaData.uuid,
			mode: 'none',
		})

		if (userInfo) {
			ElNotification({
				title: TEXT.loginSuccess,
				message: `${TEXT.welcomeBack}\uff1a${userInfo.user.nickName}`,
				type: 'success',
				duration: 3000,
			})
		}
	} catch (error) {
		createMessage.error({
			content: resolveDisplayErrorMessage(error, TEXT.networkError),
			key: 'login_error_message',
		})
		await handleCodeImage({ showError: false })
	} finally {
		if (rememberMe.value) {
			localStorage.setItem(USER_NAME_SESSION_CACHE_KEY, data.userName)
			localStorage.setItem(PASSWORD_SESSION_CACHE_KEY, data.password)
			localStorage.setItem(REMEMBER_ME_SESSION_CACHE_KEY, rememberMe.value.toString())
		} else {
			localStorage.removeItem(ENTERPRISE_NAME_SESSION_CACHE_KEY)
			localStorage.removeItem(USER_NAME_SESSION_CACHE_KEY)
			localStorage.removeItem(PASSWORD_SESSION_CACHE_KEY)
			localStorage.removeItem(REMEMBER_ME_SESSION_CACHE_KEY)
		}

		formData.code = ''
		loading.value = false
	}
}

async function handleCodeImage({ showError = true, isRefresh = false } = {}) {
	const now = Date.now()
	if (captchaLoading.value) return
	if (now - lastGetCodeAt.value < 300) return

	lastGetCodeAt.value = now
	captchaLoading.value = true
	captchaLoadFailed.value = false
	captchaData.img = ''

	try {
		const data = await userStore.getCodeImage()
		captchaData.captchaOnOff = data.captchaOnOff
		captchaData.img = data.img ? `data:image/png;base64,${data.img}` : ''
		captchaData.uuid = data.uuid
		captchaLoadFailed.value = false
	} catch (error) {
		captchaData.img = ''
		captchaData.uuid = ''
		captchaLoadFailed.value = true
		if (showError) {
			createMessage.error(resolveCaptchaErrorMessage(error, isRefresh ? TEXT.codeRefreshError : TEXT.codeLoadError))
		}
	} finally {
		captchaLoading.value = false
	}
}

function resolveCaptchaErrorMessage(error, fallbackMessage) {
	return resolveDisplayErrorMessage(error, fallbackMessage)
}

function isAsciiOnlyMessage(message) {
	return Array.from(message).every((char) => char.charCodeAt(0) <= 127)
}

function resolveDisplayErrorMessage(error, fallbackMessage) {
	const responseMessages = [error?.response?.data?.msg, error?.response?.data?.message, error?.response?.data?.error?.message, error?.message]
	for (const responseMessage of responseMessages) {
		if (typeof responseMessage === 'string' && responseMessage.trim() && !isAsciiOnlyMessage(responseMessage.trim())) {
			return responseMessage.trim()
		}
	}

	return fallbackMessage
}

onMounted(() => {
	handleCodeImage()
})
</script>

<style lang="less" scoped>
.login-form {
	width: 100%;
}

:global(html[data-theme='dark']) {
	--login-field-label-color: @text-color-base;
	--login-input-bg-color: #232a3b;
	--login-input-text-color: @text-color-base;
	--login-input-placeholder-color: #7f8aa3;
	--login-input-border-color: #4a5569;
	--login-input-active-border-color: #7065ff;
	--login-checkbox-label-color: #a9b3c7;
	--login-code-bg-color: #232a3b;
	--login-code-border-color: #4a5569;
	--login-code-hover-border-color: #7065ff;
	--login-code-hover-shadow: 0 6px 18px rgb(112 101 255 / 16%);
	--login-code-placeholder-bg: linear-gradient(135deg, #273149, #1f2638);
	--login-code-error-border-color: #7d3f45;
	--login-code-error-bg-color: rgb(133 50 58 / 16%);
	--login-code-error-hover-border-color: #d86f76;
	--login-code-error-hover-bg-color: rgb(133 50 58 / 24%);
	--login-code-error-hover-shadow: 0 0 0 2px rgb(216 111 118 / 14%);
	--login-code-error-text-color: #ff9c92;
	--login-code-error-tip-color: #d39088;
}

.login-field-label {
	margin-bottom: 10px;
	color: var(--login-field-label-color, #4a4a4a);
	font-size: 14px;
	line-height: 20px;
}

.login-captcha-row {
	display: flex;
	align-items: center;
	gap: 14px;
}

.login-options {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 2px 0 28px;
}

.login-link-button {
	padding: 0;
	border: none;
	background: transparent;
	color: #6f5fff;
	font-size: 13px;
	cursor: pointer;
}

.login-submit {
	width: 100%;
	height: 44px;
	border: none;
	border-radius: 8px;
	background: linear-gradient(90deg, #5e59f3 0%, #6f5fff 100%);
	box-shadow: 0 16px 28px rgb(100 92 255 / 26%);
	font-size: 16px;
	font-weight: 500;
}

.code-image {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: contain;
}

.login-code-box {
	display: flex;
	position: relative;
	flex: 0 0 104px;
	align-items: center;
	justify-content: center;
	width: 104px;
	height: 40px;
	overflow: hidden;
	transition:
		border-color 0.2s ease,
		background-color 0.2s ease,
		box-shadow 0.2s ease;
	border: 1px solid var(--login-code-border-color, #d5d9e5);
	border-radius: 4px;
	background: var(--login-code-bg-color, #fff);
	cursor: pointer;

	&:hover {
		// border-color: var(--login-code-hover-border-color, #7065ff);
    transition: scale(1.5);
		box-shadow: var(--login-code-hover-shadow, 0 6px 18px rgb(112 101 255 / 12%));
	}
}

.login-code-box.is-loading {
	color: var(--login-input-active-border-color, #7065ff);
	cursor: not-allowed;

	&:hover {
		border-color: var(--login-code-border-color, #d5d9e5);
		box-shadow: none;
	}
}

.login-code-box.is-error {
	border-color: var(--login-code-error-border-color, #f0b6b6);
	background: var(--login-code-error-bg-color, #fff7f7);

	&:hover {
		border-color: var(--login-code-error-hover-border-color, #e46a6a);
		background: var(--login-code-error-hover-bg-color, #fff1f1);
		box-shadow: var(--login-code-error-hover-shadow, 0 0 0 2px rgb(228 106 106 / 10%));
	}
}

.code-error {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	gap: 2px;
	color: var(--login-code-error-text-color, #d85c4a);
	line-height: 1.2;
	text-align: center;
	user-select: none;

	span {
		font-size: 12px;
		font-weight: 500;
		line-height: 16px;
	}

	small {
		color: var(--login-code-error-tip-color, #a56a5f);
		font-size: 11px;
		line-height: 14px;
	}
}

.login-code-placeholder {
	width: 100%;
	height: 100%;
	background: var(--login-code-placeholder-bg, linear-gradient(135deg, #eef1ff, #f8f9ff));
}

:deep(.el-form-item) {
	margin-bottom: 24px;
}

:deep(.el-form-item__content) {
	display: block;
}

:deep(.el-input__wrapper) {
	min-height: 40px;
	padding: 0 14px;
	border-radius: 6px;
	background-color: var(--login-input-bg-color, #fff);
	box-shadow: 0 0 0 1px var(--login-input-border-color, #d8dceb) inset;
}

:deep(.el-input__inner) {
	color: var(--login-input-text-color, #303133);
}

:deep(.el-input__inner::placeholder) {
	color: var(--login-input-placeholder-color, #a8abb2);
}

:deep(.el-input__icon) {
	color: var(--login-input-placeholder-color, #a8abb2);
}

:deep(.el-input__wrapper:hover),
:deep(.el-input__wrapper.is-focus) {
	box-shadow: 0 0 0 1px var(--login-input-active-border-color, #7065ff) inset;
}

:deep(.el-checkbox__label) {
	color: var(--login-checkbox-label-color, #6f7482);
	font-size: 12px;
}

:deep(.el-button.login-submit:hover),
:deep(.el-button.login-submit:focus) {
	background: linear-gradient(90deg, #5a55e8 0%, #6658fa 100%);
}

</style>
