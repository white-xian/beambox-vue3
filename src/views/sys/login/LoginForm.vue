<template>
  <LoginFormTitle v-show="getShow" class="enter-x" />
  <Form class="p-4 enter-x" :model="formData" :rules="getFormRules" ref="formRef" v-show="getShow">
    <FormItem name="enterpriseName" class="enter-x" v-show="!hasDomainName">
      <Input
        size="large"
        v-model:value="formData.enterpriseName"
        placeholder="企业账号"
        class="fix-auto-fill"
      />
    </FormItem>
    <FormItem name="userName" class="enter-x">
      <Input
        size="large"
        v-model:value="formData.userName"
        placeholder="员工账号"
        class="fix-auto-fill"
      />
    </FormItem>
    <FormItem name="password" class="enter-x">
      <InputPassword
        size="large"
        visibilityToggle
        v-model:value="formData.password"
        placeholder="密码"
      />
    </FormItem>
    <ARow v-if="captchaData.captchaOnOff">
      <ACol :span="16">
        <FormItem name="code">
          <Input
            size="large"
            class="code-input"
            v-model:value="formData.code"
            placeholder="验证码"
          />
        </FormItem>
      </ACol>
      <ACol :span="8" :style="{ 'text-align': 'right' }">
        <Image
          class="code-image"
          height="40px"
          :preview="false"
          :src="captchaData.img"
          @click="handleCodeImage"
        />
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
          <!-- No logic, you need to deal with it yourself -->
          <Button type="link" size="small" @click="setLoginState(LoginStateEnum.RESET_PASSWORD)">
            忘记密码?
          </Button>
        </FormItem>
      </ACol>
    </ARow>

    <FormItem class="enter-x">
      <Button type="primary" size="large" block @click="handleLogin" :loading="loading">
        登录
      </Button>
      <!-- <Button size="large" class="mt-4 enter-x" block @click="handleRegister">
        注册
      </Button> -->
    </FormItem>
    <ARow class="enter-x" :gutter="[16, 16]">
      <ACol :md="8" :xs="24">
        <Button block @click="setLoginState(LoginStateEnum.MOBILE)"> 手机登录 </Button>
      </ACol>
      <ACol :md="8" :xs="24">
        <Button block @click="setLoginState(LoginStateEnum.QR_CODE)"> 二维码登录 </Button>
      </ACol>
      <ACol :md="8" :xs="24">
        <Button block @click="setLoginState(LoginStateEnum.REGISTER)"> 注册 </Button>
      </ACol>
    </ARow>

    <Divider class="enter-x">其他登录方式</Divider>

    <div class="flex justify-evenly enter-x" :class="`${prefixCls}-sign-in-way`">
      <GithubFilled />
      <WechatFilled />
      <AlipayCircleFilled />
      <GoogleCircleFilled />
      <TwitterCircleFilled />
    </div>
  </Form>
</template>

<script setup>
  import { computed, onMounted, reactive, ref, unref } from 'vue';
  import { Button, Checkbox, Col, Divider, Form, Image, Input, Row } from 'ant-design-vue';
  import {
    AlipayCircleFilled,
    GithubFilled,
    GoogleCircleFilled,
    TwitterCircleFilled,
    WechatFilled,
  } from '@ant-design/icons-vue';
  import LoginFormTitle from './LoginFormTitle.vue';
  import { onKeyStroke } from '@vueuse/core';
  import { useMessage } from '@/hooks/web/useMessage';
  import { useUserStore } from '@/store/modules/user';
  import { getEnterpriseNameByDomainName } from '@/api/sys/login.api';
  import { LoginStateEnum, useFormRules, useFormValid, useLoginState } from './useLogin';
  import { useDesign } from '@/hooks/web/useDesign';
  import {
    ENTERPRISE_NAME_SESSION_CACHE_KEY,
    PASSWORD_SESSION_CACHE_KEY,
    REMEMBER_ME_SESSION_CACHE_KEY,
    USER_NAME_SESSION_CACHE_KEY,
  } from '@/enums';

  const ACol = Col;
  const ARow = Row;
  const FormItem = Form.Item;
  const InputPassword = Input.Password;
  const { notification, createErrorModal } = useMessage();
  const { prefixCls } = useDesign('login');
  const userStore = useUserStore();

  const { setLoginState, getLoginState } = useLoginState();
  const { getFormRules } = useFormRules();

  const formRef = ref();
  const loading = ref(false);
  const hasDomainName = ref(false);
  const rememberMe = ref(localStorage.getItem(REMEMBER_ME_SESSION_CACHE_KEY) === 'true' || false);

  const formData = reactive({
    enterpriseName: localStorage.getItem(ENTERPRISE_NAME_SESSION_CACHE_KEY) || '',
    userName: localStorage.getItem(USER_NAME_SESSION_CACHE_KEY) || '',
    password: localStorage.getItem(PASSWORD_SESSION_CACHE_KEY) || '',
    code: '',
  });

  const captchaData = reactive({
    // 验证码开关
    captchaOnOff: true,
    img: '',
    uuid: '',
  });

  const { validForm } = useFormValid(formRef);

  onKeyStroke('Enter', handleLogin);

  const getShow = computed(() => unref(getLoginState) === LoginStateEnum.LOGIN);

  async function handleLogin() {
    const data = await validForm();
    if (!data) return;
    try {
      loading.value = true;
      const userInfo = await userStore.login({
        enterpriseName: data.enterpriseName,
        userName: data.userName,
        password: data.password,
        code: data.code,
        uuid: captchaData.uuid,
        mode: 'none', //不要默认的错误提示
      });
      if (userInfo) {
        notification.success({
          message: '登录成功',
          description: `${'欢迎回来'}: ${userInfo.user.nickName}`,
          duration: 3,
        });
      }
    } catch (error) {
      createErrorModal({
        title: '错误提示',
        content: error?.message || '网络异常，请检查您的网络连接是否正常!',
        getContainer: () => document.body.querySelector(`.${prefixCls}`) || document.body,
      });
      await handleCodeImage();
    } finally {
      if (rememberMe.value) {
        localStorage.setItem(ENTERPRISE_NAME_SESSION_CACHE_KEY, data.enterpriseName);
        localStorage.setItem(USER_NAME_SESSION_CACHE_KEY, data.userName);
        localStorage.setItem(PASSWORD_SESSION_CACHE_KEY, data.password);
        localStorage.setItem(REMEMBER_ME_SESSION_CACHE_KEY, rememberMe.value.toString());
      } else {
        localStorage.removeItem(ENTERPRISE_NAME_SESSION_CACHE_KEY);
        localStorage.removeItem(USER_NAME_SESSION_CACHE_KEY);
        localStorage.removeItem(PASSWORD_SESSION_CACHE_KEY);
        localStorage.removeItem(REMEMBER_ME_SESSION_CACHE_KEY);
      }
      formData.code = '';
      loading.value = false;
    }
  }

  // 获取域名对应企业名称
  async function handleDomainName() {
    const data = await getEnterpriseNameByDomainName();
    if (data?.name) {
      formData.enterpriseName = data.name;
      hasDomainName.value = true;
    }
  }

  // 处理登录验证码
  async function handleCodeImage() {
    const data = await userStore.getCodeImage();
    captchaData.captchaOnOff = data.captchaOnOff;
    captchaData.img = 'data:image/png;base64,' + data.img;
    captchaData.uuid = data.uuid;
  }

  onMounted(() => {
    // 初始执行一次验证码获取
    handleDomainName();
    handleCodeImage();
  });
</script>

<style lang="less" scoped>
  .code-input {
    display: inline-block;
    vertical-align: middle;
    min-width: 100% !important;
  }

  .code-image {
    display: inline-block;
    width: 115px;
    height: 40px !important;
    vertical-align: top;
    cursor: pointer;
  }
</style>
