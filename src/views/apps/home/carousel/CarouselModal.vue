<template>
  <BasicModal
    v-bind="$attrs"
    @register="registerModal"
    :title="getTitle"
    :width="700"
    @ok="handleSubmit"
  >
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>

<script setup lang="ts">
  import { computed, ref, unref } from 'vue'
  import { formSchema } from './carousel.data'
  import { useMessage } from '@/hooks/web/useMessage'
  import { addCarouselApi, editCarouselApi } from '@/api/apps/home/carousel.api'
  import { BasicModal, useModalInner } from '@/components/Modal'
  import { BasicForm, useForm } from '@/components/Form'
  import { CarouselIM } from '@/model/apps/home'

  const emit = defineEmits(['success', 'register'])
  const { createMessage } = useMessage()
  const isUpdate = ref(true)

  const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
    labelWidth: 100,
    schemas: formSchema,
    showActionButtonGroup: false,
  })

  const [registerModal, { setModalProps, closeModal }] = useModalInner((data) => {
    resetFields()
    setModalProps({ confirmLoading: false })
    isUpdate.value = !!data?.isUpdate

    if (unref(isUpdate)) {
      setFieldsValue({ ...data.record })
    }
  })

  /** 标题 */
  const getTitle = computed(() => (!unref(isUpdate) ? '新增轮播图' : '编辑轮播图'))

  /** 提交 */
  async function handleSubmit() {
    try {
      const values: CarouselIM = await validate()
      setModalProps({ confirmLoading: true })
      if (unref(isUpdate)) {
        await editCarouselApi(values)
        closeModal()
        createMessage.success('编辑轮播图成功！')
      } else {
        await addCarouselApi(values)
        closeModal()
        createMessage.success('新增轮播图成功！')
      }
      emit('success')
    } finally {
      setModalProps({ confirmLoading: false })
    }
  }
</script>
