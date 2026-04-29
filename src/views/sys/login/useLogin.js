import { computed, ref, unref } from 'vue'

const TEXT = {
  accountRequired: '\u8bf7\u8f93\u5165\u5458\u5de5\u8d26\u53f7',
  passwordRequired: '\u8bf7\u8f93\u5165\u5bc6\u7801',
  codeRequired: '\u8bf7\u8f93\u5165\u9a8c\u8bc1\u7801',
  smsRequired: '\u8bf7\u8f93\u5165\u77ed\u4fe1\u9a8c\u8bc1\u7801',
  mobileRequired: '\u8bf7\u8f93\u5165\u624b\u673a\u53f7',
  policyRequired: '\u52fe\u9009\u540c\u610f\u540e\u624d\u80fd\u7ee7\u7eed',
  confirmPasswordRequired: '\u8bf7\u518d\u6b21\u8f93\u5165\u5bc6\u7801',
  confirmPasswordMismatch: '\u4e24\u6b21\u8f93\u5165\u7684\u5bc6\u7801\u4e0d\u4e00\u81f4',
}

export const LoginStateEnum = Object.freeze({
  LOGIN: 0,
  REGISTER: 1,
  RESET_PASSWORD: 2,
  MOBILE: 3,
  QR_CODE: 4,
})

const currentState = ref(LoginStateEnum.LOGIN)

export function useLoginState() {
  function setLoginState(state) {
    currentState.value = state
  }

  const getLoginState = computed(() => currentState.value)

  function handleBackLogin() {
    setLoginState(LoginStateEnum.LOGIN)
  }

  return { setLoginState, getLoginState, handleBackLogin }
}

export function useFormValid(formRef, formData) {
  const validate = computed(() => {
    const form = unref(formRef)
    return form?.validate ?? (async () => true)
  })

  async function validForm() {
    const form = unref(formRef)
    if (!form) return false

    try {
      const result = await form.validate()
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        return result
      }
      return formData || result
    } catch {
      return false
    }
  }

  return { validate, validForm }
}

export function useFormRules(formData = {}) {
  const getUserNameFormRule = computed(() => createRule(TEXT.accountRequired))
  const getPasswordFormRule = computed(() => createRule(TEXT.passwordRequired))
  const getCodeFormRule = computed(() => createRule(TEXT.codeRequired))
  const getSmsFormRule = computed(() => createRule(TEXT.smsRequired))
  const getMobileFormRule = computed(() => createRule(TEXT.mobileRequired))

  const validatePolicy = async (_rule, value) => {
    if (!value) {
      return Promise.reject(TEXT.policyRequired)
    }
    return Promise.resolve()
  }

  const validateConfirmPassword = (password) => {
    return async (_rule, value) => {
      if (!value) {
        return Promise.reject(TEXT.confirmPasswordRequired)
      }
      if (value !== password) {
        return Promise.reject(TEXT.confirmPasswordMismatch)
      }
      return Promise.resolve()
    }
  }

  const getFormRules = computed(() => {
    const userNameRule = unref(getUserNameFormRule)
    const passwordRule = unref(getPasswordFormRule)
    const codeRule = unref(getCodeFormRule)
    const smsRule = unref(getSmsFormRule)
    const mobileRule = unref(getMobileFormRule)

    switch (unref(currentState)) {
      case LoginStateEnum.REGISTER:
        return {
          userName: userNameRule,
          mobile: mobileRule,
          sms: smsRule,
          password: passwordRule,
          confirmPassword: [{ validator: validateConfirmPassword(formData.password), trigger: 'blur' }],
          policy: [{ validator: validatePolicy, trigger: 'change' }],
        }

      case LoginStateEnum.RESET_PASSWORD:
        return {
          userName: userNameRule,
          mobile: mobileRule,
          sms: smsRule,
        }

      case LoginStateEnum.MOBILE:
        return {
          mobile: mobileRule,
          sms: smsRule,
        }

      default:
        return {
          userName: userNameRule,
          password: passwordRule,
          code: codeRule,
        }
    }
  })

  return { getFormRules }
}

function createRule(message) {
  return [
    {
      required: true,
      message,
      trigger: 'blur',
    },
  ]
}
