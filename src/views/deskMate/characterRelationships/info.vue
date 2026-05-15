<template>
  <BasicModal v-bind="$attrs" :title="getTitle" @register="registerModal" width="700px" :minHeight="250" :canFullscreen="true" :maskClosable="false" :centered="true" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>

<script setup lang="ts">
import { computed, ref, unref } from 'vue';
import { BasicModal, useModalInner } from '@/components/Modal';
import { BasicForm, useForm } from '@/components/Form';
import { useMessage } from '@/hooks/web/useMessage';
import { addCharacterRelationshipsApi, updateCharacterRelationshipsApi } from '@/api/deskMate/characterRelationships.api';
import { CharacterRelationshipsIM } from '@/model/deskMate';
import { formSchema } from './data';

const emit = defineEmits(['success', 'register']);
const { createMessage } = useMessage();
const isUpdate = ref(false);
const recordId = ref<string | undefined>();

const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
  labelWidth: 120,
  schemas: formSchema,
  showActionButtonGroup: false,
});

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  await resetFields();
  setModalProps({ loading: true, confirmLoading: false });
  isUpdate.value = !!data?.isUpdate;
  recordId.value = undefined;

  if (unref(isUpdate) && data?.record) {
    const record = data.record as CharacterRelationshipsIM;
    recordId.value = record.id;
    await setFieldsValue({ ...record });
  }

  setModalProps({ loading: false });
});

const getTitle = computed(() => (unref(isUpdate) ? '编辑人物关系' : '新增人物关系'));

async function handleSubmit() {
  const values = await validate();
  if (!values) return;

  try {
    setModalProps({ confirmLoading: true });
    const payload = { ...values } as CharacterRelationshipsIM;
    if (unref(isUpdate)) {
      payload.id = recordId.value;
      await updateCharacterRelationshipsApi(payload);
      createMessage.success('更新人物关系成功');
    } else {
      await addCharacterRelationshipsApi(payload);
      createMessage.success('新增人物关系成功');
    }
    closeModal();
    emit('success');
  } finally {
    setModalProps({ confirmLoading: false });
  }
}
</script>
