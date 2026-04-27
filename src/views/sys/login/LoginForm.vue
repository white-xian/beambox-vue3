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
			<button type="button" class="login-link-button" @click="setLoginState(LoginStateEnum.RESET_PASSWORD)">
				{{ TEXT.forgetPassword }}
			</button>
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
	accountLabel: '\u8d26\u53f7',
	accountPlaceholder: '\u8bf7\u8f93\u5165\u5458\u5de5\u8d26\u53f7',
	passwordLabel: '\u5bc6\u7801',
	passwordPlaceholder: '\u8bf7\u8f93\u5165\u5bc6\u7801',
	codeLabel: '\u9a8c\u8bc1\u7801',
	codePlaceholder: '\u8bf7\u8f93\u5165\u9a8c\u8bc1\u7801',
	rememberMe: '\u8bb0\u4f4f\u6211',
	forgetPassword: '\u5fd8\u8bb0\u5bc6\u7801\uff1f',
	login: '\u767b\u5f55',
	loginSuccess: '\u767b\u5f55\u6210\u529f',
	welcomeBack: '\u6b22\u8fce\u56de\u6765',
	errorTip: '\u9519\u8bef\u63d0\u793a',
	networkError: '\u7f51\u7edc\u5f02\u5e38\uff0c\u8bf7\u68c0\u67e5\u60a8\u7684\u7f51\u7edc\u8fde\u63a5\u662f\u5426\u6b63\u5e38',
	codeLoadErrorShort: '\u9a8c\u8bc1\u7801\u52a0\u8f7d\u5931\u8d25',
	codeRetryTip: '\u70b9\u51fb\u91cd\u8bd5',
	codeLoadError: '\u9a8c\u8bc1\u7801\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u70b9\u51fb\u9a8c\u8bc1\u7801\u533a\u57df\u91cd\u8bd5',
	codeRefreshError: '\u9a8c\u8bc1\u7801\u5237\u65b0\u5931\u8d25\uff0c\u8bf7\u70b9\u51fb\u9a8c\u8bc1\u7801\u533a\u57df\u91cd\u8bd5',
}

const userStore = useUserStore()
const { createMessage } = useMessage()
const { setLoginState, getLoginState } = useLoginState()
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
	const responseMessage = error?.response?.data?.msg || error?.response?.data?.message || error?.response?.data?.error?.message
	if (typeof responseMessage === 'string' && responseMessage.trim() && !isAsciiOnlyMessage(responseMessage.trim())) {
		return responseMessage.trim()
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

.login-field-label {
	margin-bottom: 10px;
	color: #4a4a4a;
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
	flex: 0 0 145px;
	align-items: center;
	justify-content: center;
	width: 145px;
	height: 40px;
	overflow: hidden;
	transition:
		border-color 0.2s ease,
		background-color 0.2s ease,
		box-shadow 0.2s ease;
	border: 1px solid #d5d9e5;
	border-radius: 4px;
	background: #fff;
	cursor: pointer;

	&:hover {
		border-color: #7065ff;
		box-shadow: 0 6px 18px rgb(112 101 255 / 12%);
	}
}

.login-code-box.is-loading {
	color: #7065ff;
	cursor: not-allowed;

	&:hover {
		border-color: #d5d9e5;
		box-shadow: none;
	}
}

.login-code-box.is-error {
	border-color: #f0b6b6;
	background: #fff7f7;

	&:hover {
		border-color: #e46a6a;
		background: #fff1f1;
		box-shadow: 0 0 0 2px rgb(228 106 106 / 10%);
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
	color: #d85c4a;
	line-height: 1.2;
	text-align: center;
	user-select: none;

	span {
		font-size: 12px;
		font-weight: 500;
		line-height: 16px;
	}

	small {
		color: #a56a5f;
		font-size: 11px;
		line-height: 14px;
	}
}

.login-code-placeholder {
	width: 100%;
	height: 100%;
	background: linear-gradient(135deg, #eef1ff, #f8f9ff);
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
	box-shadow: 0 0 0 1px #d8dceb inset;
}

:deep(.el-input__wrapper:hover),
:deep(.el-input__wrapper.is-focus) {
	box-shadow: 0 0 0 1px #7065ff inset;
}

:deep(.el-checkbox__label) {
	color: #6f7482;
	font-size: 12px;
}

:deep(.el-button.login-submit:hover),
:deep(.el-button.login-submit:focus) {
	background: linear-gradient(90deg, #5a55e8 0%, #6658fa 100%);
}
</style>
