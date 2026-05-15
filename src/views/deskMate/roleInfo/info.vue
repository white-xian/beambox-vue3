<template>
  <BasicModal v-bind="$attrs" :title="getTitle" @register="registerModal" width="850px" :minHeight="300" :canFullscreen="true" :maskClosable="false" :centered="true" @ok="handleSubmit">
    <BasicForm @register="registerForm">
      <template #uploadSlot="{ model, field, schema }">
        <SingleFileUpload
          v-model:value="model[field]"
          list-type="picture-card"
          :max-size="schema.maxSize || 10"
          :max-size-unit="schema.maxSizeUnit || 'MB'"
          :show-help-text="false"
          :show-delete="true"
          upload-text="上传图片"
        />
      </template>
    </BasicForm>
  </BasicModal>
</template>

<script setup lang="ts">
import { computed, ref, unref } from 'vue';
import { BasicModal, useModalInner } from '@/components/Modal';
import { BasicForm, useForm } from '@/components/Form';
import { useMessage } from '@/hooks/web/useMessage';
import { SingleFileUpload } from '@/components/FileUpload';
import { addRoleInfoApi, updateRoleInfoApi } from '@/api/deskMate/roleInfo.api';
import { RoleInfoIM } from '@/model/deskMate';
import { formSchema } from './data';

const emit = defineEmits(['success', 'register']);
const { createMessage } = useMessage();
const isUpdate = ref(false);
const recordId = ref<string | undefined>();

const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
  labelWidth: 100,
  schemas: formSchema,
  showActionButtonGroup: false,
});

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  await resetFields();
  setModalProps({ loading: true, confirmLoading: false });
  isUpdate.value = !!data?.isUpdate;
  recordId.value = undefined;

  if (unref(isUpdate) && data?.record) {
    const record = data.record as RoleInfoIM;
    recordId.value = record.id;
    // features 后端存储为、分割的字符串，前端标签选择器需要数组
    const formData = {
      ...record,
      features: record.features ? record.features.split('、') : [],
    };
    await setFieldsValue(formData);
  }

  setModalProps({ loading: false });
});

const getTitle = computed(() => (unref(isUpdate) ? '编辑桌搭子角色' : '新增桌搭子角色'));

async function handleSubmit() {
  const values = await validate();
  if (!values) return;

  try {
    setModalProps({ confirmLoading: true });
    // features 标签数组 → 、分割字符串
    const payload = {
      ...values,
      features: Array.isArray(values.features) ? values.features.join('、') : values.features,
    } as RoleInfoIM;
    if (unref(isUpdate)) {
      payload.id = recordId.value;
      await updateRoleInfoApi(payload);
      createMessage.success('更新角色成功');
    } else {
      await addRoleInfoApi(payload);
      createMessage.success('新增角色成功');
    }
    closeModal();
    emit('success');
  } finally {
    setModalProps({ confirmLoading: false });
  }
}
</script>
