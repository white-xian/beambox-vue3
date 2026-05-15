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
import { addGameRecordsApi, updateGameRecordsApi } from '@/api/deskMate/gameRecords.api';
import { GameRecordsIM } from '@/model/deskMate';
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
    const record = data.record as GameRecordsIM;
    recordId.value = record.id;
    record.unlockLevel = String(record.unlockLevel);
    await setFieldsValue({ ...record });
  }

  setModalProps({ loading: false });
});

const getTitle = computed(() => (unref(isUpdate) ? '编辑游戏记录' : '新增游戏记录'));

async function handleSubmit() {
  const values = await validate();
  if (!values) return;

  try {
    setModalProps({ confirmLoading: true });
    const payload = { ...values } as GameRecordsIM;
    if (unref(isUpdate)) {
      payload.id = recordId.value;
      await updateGameRecordsApi(payload);
      createMessage.success('更新游戏记录成功');
    } else {
      await addGameRecordsApi(payload);
      createMessage.success('新增游戏记录成功');
    }
    closeModal();
    emit('success');
  } finally {
    setModalProps({ confirmLoading: false });
  }
}
</script>
