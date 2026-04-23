<template>
	<LoginFormTitle v-show="getShow" class="enter-x" />
	<Form class="p-4 enter-x" :model="formData" :rules="getFormRules" ref="formRef" v-show="getShow">
		<FormItem name="userName" class="enter-x">
			<Input size="large" v-model:value="formData.userName" placeholder="请输入员工账号" class="fix-auto-fill" />
		</FormItem>
		<FormItem name="password" class="enter-x">
			<InputPassword size="large" visibilityToggle v-model:value="formData.password" placeholder="请输入密码" />
		</FormItem>
		<ARow v-if="captchaData.captchaOnOff">
			<ACol :span="16">
				<FormItem name="code">
					<Input size="large" class="code-input" v-model:value="formData.code" placeholder="请输入验证码" />
				</FormItem>
			</ACol>
			<ACol :span="8" :style="{ 'text-align': 'right' }">
				<div class="login-code-box" :class="{ 'is-loading': captchaLoading }" @click="handleCodeImage">
					<Spin v-if="captchaLoading" size="small" />
					<img v-else-if="captchaData.img" class="code-image" :src="captchaData.img" alt="验证码" />
					<div v-else class="login-code-placeholder"></div>
				</div>
			</ACol>
		</ARow>

		<ARow class="enter-x">
			<ACol :span="12">
				<FormItem>
					<!-- No logic, you need to deal with it yourself -->
					<Checkbox v-model:checked="rememberMe" size="small"> 记住我 </Checkbox>
				</FormItem>
			</ACol>
			<ACol :span="12">
				<FormItem :style="{ 'text-align': 'right' }">
					<Button type="link" size="small" @click="setLoginState(LoginStateEnum.RESET_PASSWORD)"> 忘记密码? </Button>
				</FormItem>
			</ACol>
		</ARow>

		<FormItem class="enter-x">
			<Button type="primary" size="large" block @click="handleLogin" :loading="loading"> 登录 </Button>
		</FormItem>
	</Form>
</template>

<script setup>
import { computed, onMounted, reactive, ref, unref } from 'vue'
import { Button, Checkbox, Col, Form, Input, Row, Spin } from 'ant-design-vue'
import LoginFormTitle from './LoginFormTitle.vue'
import { onKeyStroke } from '@vueuse/core'
import { useMessage } from '@/hooks/web/useMessage'
import { useUserStore } from '@/store/modules/user'
import { LoginStateEnum, useFormRules, useFormValid, useLoginState } from './useLogin'
import { useDesign } from '@/hooks/web/useDesign'
import { ENTERPRISE_NAME_SESSION_CACHE_KEY, PASSWORD_SESSION_CACHE_KEY, REMEMBER_ME_SESSION_CACHE_KEY, USER_NAME_SESSION_CACHE_KEY } from '@/enums'

const ACol = Col
const ARow = Row
const FormItem = Form.Item
const InputPassword = Input.Password
const { notification, createErrorModal } = useMessage()
const { prefixCls } = useDesign('login')
const userStore = useUserStore()

const { setLoginState, getLoginState } = useLoginState()
const { getFormRules } = useFormRules()

const formRef = ref()
const loading = ref(false)
const captchaLoading = ref(false)
const rememberMe = ref(localStorage.getItem(REMEMBER_ME_SESSION_CACHE_KEY) === 'true' || false)
const lastGetCodeAt = ref(0)

const formData = reactive({
	userName: localStorage.getItem(USER_NAME_SESSION_CACHE_KEY) || '',
	password: localStorage.getItem(PASSWORD_SESSION_CACHE_KEY) || '',
	code: '',
})

const captchaData = reactive({
	// 验证码开关
	captchaOnOff: true,
	img: '',
	uuid: '',
})

const { validForm } = useFormValid(formRef)

onKeyStroke('Enter', handleLogin)

const getShow = computed(() => unref(getLoginState) === LoginStateEnum.LOGIN)

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
			mode: 'none', //不要默认的错误提示
		})
		if (userInfo) {
			notification.success({
				message: '登录成功',
				description: `${'欢迎回来'}: ${userInfo.user.nickName}`,
				duration: 3,
			})
		}
	} catch (error) {
		createErrorModal({
			title: '错误提示',
			content: error?.message || '网络异常，请检查您的网络连接是否正常!',
			getContainer: () => document.body.querySelector(`.${prefixCls}`) || document.body,
		})
		await handleCodeImage()
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

// 处理登录验证码
async function handleCodeImage() {
	const now = Date.now()
	if (captchaLoading.value) return
	if (now - lastGetCodeAt.value < 300) return
	lastGetCodeAt.value = now
	captchaLoading.value = true
	captchaData.img = ''
	try {
		const data = await userStore.getCodeImage()
		captchaData.captchaOnOff = data.captchaOnOff
		captchaData.img = data.img ? 'data:image/png;base64,' + data.img : ''
		captchaData.uuid = data.uuid
	} catch {
		captchaData.img = ''
		captchaData.uuid = ''
	} finally {
		captchaLoading.value = false
	}
}

onMounted(() => {
	// 初始执行一次验证码获取
	handleCodeImage()
})
</script>

<style lang="less" scoped>
.code-input {
	display: inline-block;
	vertical-align: middle;
	min-width: 100% !important;
}

.code-image {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.login-code-box {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 115px;
	height: 40px;
	overflow: hidden;
	border: 1px solid #d5d9e5;
	border-radius: 4px;
	background: #fff;
	cursor: pointer;
}

.login-code-box.is-loading {
	cursor: not-allowed;
}

.login-code-placeholder {
	width: 100%;
	height: 100%;
	background: linear-gradient(135deg, #eef1ff, #f8f9ff);
}
</style>
