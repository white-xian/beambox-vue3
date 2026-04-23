<template>
  <BasicModal
    v-bind="$attrs"
    title="导出数据"
    @ok="handleOk"
    @register="registerModal"
  >
    <BasicForm
      :labelWidth="100"
      :schemas="schemas"
      :showActionButtonGroup="false"
      @register="registerForm"
    />
  </BasicModal>
</template>

<script lang="ts" setup>
  import type { ExportModalResult } from './typing';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { BasicForm, FormSchema, useForm } from '@/components/Form';

  const schemas: FormSchema[] = [
    {
      field: 'filename',
      component: 'Input',
      label: "文件名",
      rules: [{ required: true }],
    },
    {
      field: 'bookType',
      component: 'Select',
      label: "文件类型",
      defaultValue: 'xlsx',
      rules: [{ required: true }],
      componentProps: {
        options: [
          {
            label: 'xlsx',
            value: 'xlsx',
            key: 'xlsx',
          },
          {
            label: 'html',
            value: 'html',
            key: 'html',
          },
          {
            label: 'csv',
            value: 'csv',
            key: 'csv',
          },
          {
            label: 'txt',
            value: 'txt',
            key: 'txt',
          },
        ],
      },
    },
  ];

  const emit = defineEmits(['success', 'register']);

  const [registerForm, { validate }] = useForm();
  const [registerModal, { closeModal }] = useModalInner();

  const handleOk = async () => {
    const res = await validate<ExportModalResult>();
    const { filename, bookType } = res;
    emit('success', {
      filename: `${filename.split('.').shift()}.${bookType}`,
      bookType,
    });
    closeModal();
  };
</script>
