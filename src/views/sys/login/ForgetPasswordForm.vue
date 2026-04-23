<template>
  <template v-if="getShow">
    <LoginFormTitle class="enter-x" />
    <Form class="p-4 enter-x" :model="formData" :rules="getFormRules" ref="formRef">
      <FormItem name="userName" class="enter-x">
        <Input
          size="large"
          v-model:value="formData.userName"
          placeholder="员工账号"
        />
      </FormItem>

      <FormItem name="mobile" class="enter-x">
        <Input size="large" v-model:value="formData.mobile" placeholder="手机号码" />
      </FormItem>
      <FormItem name="sms" class="enter-x">
        <CountdownInput
          size="large"
          v-model:value="formData.sms"
          placeholder="短信验证码"
        />
      </FormItem>

      <FormItem class="enter-x">
        <Button type="primary" size="large" block @click="handleReset" :loading="loading">
          重置
        </Button>
        <Button size="large" block class="mt-4" @click="handleBackLogin">
          返回
        </Button>
      </FormItem>
    </Form>
  </template>
</template>

<script lang="ts" setup>
  import { computed, reactive, ref, unref } from 'vue';
  import LoginFormTitle from './LoginFormTitle.vue';
  import { Button, Form, Input } from 'ant-design-vue';
  import { CountdownInput } from '@/components/CountDown';
  import { LoginStateEnum, useFormRules, useLoginState } from './useLogin';

  const FormItem = Form.Item;
  const { handleBackLogin, getLoginState } = useLoginState();
  const { getFormRules } = useFormRules();

  const formRef = ref();
  const loading = ref(false);

  const formData = reactive({
    userName: '',
    mobile: '',
    sms: '',
  });

  const getShow = computed(() => unref(getLoginState) === LoginStateEnum.RESET_PASSWORD);

  async function handleReset() {
    const form = unref(formRef);
    if (!form) return;
    await form.resetFields();
  }
</script>
