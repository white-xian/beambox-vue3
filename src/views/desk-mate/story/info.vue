<template>
  <BasicModal v-bind="$attrs" :title="getTitle" @register="registerModal" width="800px" :minHeight="300" :canFullscreen="true" :maskClosable="false" :centered="true" @ok="handleSubmit">
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
import { addStoryApi, updateStoryApi } from '@/api/desk-mate/story.api';
import { StoryIM } from '@/model/desk-mate';
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
    const record = data.record as StoryIM;
    record.unlockLevel = String(record.unlockLevel);
    recordId.value = record.id;
    await setFieldsValue({ ...record });
  }

  setModalProps({ loading: false });
});

const getTitle = computed(() => (unref(isUpdate) ? '编辑角色故事' : '新增角色故事'));

async function handleSubmit() {
  const values = await validate();
  if (!values) return;

  try {
    setModalProps({ confirmLoading: true });
    const payload = { ...values } as StoryIM;
    if (unref(isUpdate)) {
      payload.id = recordId.value;
      await updateStoryApi(payload);
      createMessage.success('更新故事成功');
    } else {
      await addStoryApi(payload);
      createMessage.success('新增故事成功');
    }
    closeModal();
    emit('success');
  } finally {
    setModalProps({ confirmLoading: false });
  }
}
</script>
