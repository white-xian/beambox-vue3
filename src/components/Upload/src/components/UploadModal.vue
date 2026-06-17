<template>
  <BasicModal
    width="800px"
    title="上传"
    okText="保存"
    v-bind="$attrs"
    @register="register"
    @ok="handleOk"
    :closeFunc="handleCloseFunc"
    :maskClosable="false"
    :keyboard="false"
    class="upload-modal"
    :okButtonProps="getOkButtonProps"
  >
    <template #centerFooter>
      <a-button
        @click="handleStartUpload"
        color="success"
        :disabled="!getIsSelectFile"
        :loading="isUploadingRef"
      >
        {{ getUploadBtnText }}
      </a-button>
    </template>

    <div class="upload-modal-toolbar">
      <Alert :message="getHelpText" type="info" banner class="upload-modal-toolbar__text" />

      <Upload
        :accept="getStringAccept"
        :multiple="multiple"
        :before-upload="beforeUpload"
        :show-upload-list="false"
        class="upload-modal-toolbar__btn"
      >
        <a-button type="primary">
          选择文件
        </a-button>
      </Upload>
    </div>
    <FileList
      v-model:dataSource="fileListRef"
      :columns="columns"
      :actionColumn="actionColumn"
      :openDrag="fileListOpenDrag"
      :dragOptions="fileListDragOptions"
    />
  </BasicModal>
</template>

<script lang="ts" setup>
  import { computed, PropType, ref, toRefs, unref } from 'vue';
  import { Alert, Upload, Modal } from 'ant-design-vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  // hooks
  import { useUploadType } from '../hooks/useUpload';
  import { useMessage } from '@/hooks/web/useMessage';
  //   types
  import { FileItem, UploadResultStatus } from '../types/typing';
  import { basicProps, handleFnKey } from '../props';
  import { createActionColumn, createTableColumns } from './data';
  // utils
  import { checkImgType, getBase64WithFile } from '../helper';
  import { buildUUID } from '@/utils/core/IdUtil';
  import { isFunction } from '@/utils/core/ObjectUtil';
  import { warn } from '@/utils/log/LogUtil';
  import FileList from './FileList.vue';
  import { ResultEnum } from '@/enums';
  import { get } from 'lodash-es';

  const props = defineProps({
    ...basicProps,
    previewFileList: {
      type: Array as PropType<string[] | any[]>,
      default: () => [],
    },
  });

  const emit = defineEmits(['change', 'register', 'delete']);

  const columns = createTableColumns();
  const actionColumn = createActionColumn(handleRemove);

  // 是否正在上传
  const isUploadingRef = ref(false);
  const fileListRef = ref<FileItem[]>([]);
  const { accept, helpText, maxNumber, maxSize } = toRefs(props);
  const [register, { closeModal }] = useModalInner();

  const { getStringAccept, getHelpText } = useUploadType({
    acceptRef: accept,
    helpTextRef: helpText,
    maxNumberRef: maxNumber,
    maxSizeRef: maxSize,
  });

  const { createMessage } = useMessage();

  const getIsSelectFile = computed(() => {
    return (
      fileListRef.value.length > 0 &&
      !fileListRef.value.every((item) => item.status === UploadResultStatus.SUCCESS)
    );
  });

  const getOkButtonProps = computed(() => {
    const someSuccess = fileListRef.value.some(
      (item) => item.status === UploadResultStatus.SUCCESS,
    );
    return {
      disabled: isUploadingRef.value || fileListRef.value.length === 0 || !someSuccess,
    };
  });

  const getUploadBtnText = computed(() => {
    const someError = fileListRef.value.some((item) => item.status === UploadResultStatus.ERROR);
    return isUploadingRef.value
      ? "上传中"
      : someError
        ? "重新上传失败文件"
        : "开始上传";
  });

  // 上传前校验
  function beforeUpload(file: File) {
    const { size, name } = file;
    const { maxSize } = props;
    // 设置最大值，则判断
    if (maxSize && file.size / 1024 / 1024 >= maxSize) {
      createMessage.error(`只能上传不超过${maxSize}MB的文件!`);
      return false;
    }

    const commonItem = {
      uuid: buildUUID(),
      file,
      size,
      name,
      percent: 0,
      type: name.split('.').pop(),
    };
    // 生成图片缩略图
    if (checkImgType(file)) {
      // beforeUpload，如果异步会调用自带上传方法
      // file.thumbUrl = await getBase64(file);
      getBase64WithFile(file).then(({ result: thumbUrl }) => {
        fileListRef.value = [
          ...unref(fileListRef),
          {
            thumbUrl,
            ...commonItem,
          },
        ];
      });
    } else {
      fileListRef.value = [...unref(fileListRef), commonItem];
    }
    return false;
  }

  // 删除
  function handleRemove(obj: Record<handleFnKey, any>) {
    let { record = {}, uidKey = 'uid' } = obj;
    const index = fileListRef.value.findIndex((item) => item[uidKey] === record[uidKey]);
    if (index !== -1) {
      const removed = fileListRef.value.splice(index, 1);
      emit('delete', removed[0][uidKey]);
    }
  }

  async function uploadApiByItem(item: FileItem) {
    const { api } = props;
    if (!api || !isFunction(api)) {
      return warn('upload api must exist and be a function');
    }
    try {
      item.status = UploadResultStatus.UPLOADING;
      const ret = await props.api?.(
        {
          data: {
            ...(props.uploadParams || {}),
          },
          file: item.file,
          name: props.name,
          filename: props.filename,
        },
        function onUploadProgress(progressEvent: ProgressEvent) {
          const complete = ((progressEvent.loaded / progressEvent.total) * 100) | 0;
          item.percent = complete;
        },
      );
      const { data } = ret;
      if (data?.code === ResultEnum.SUCCESS) {
        item.status = UploadResultStatus.SUCCESS;
        item.percent = 100;
        item.response = data;
        if (props.resultField) {
          // 适配预览组件而进行封装
          item.response = {
            code: 0,
            message: 'upload Success!',
            url: get(ret, props.resultField),
          };
        }
        createMessage.success('导入成功！');
        return {
          success: true,
          error: null,
        };
      } else {
        item.status = UploadResultStatus.ERROR;
        createMessage.error(data?.msg);
        return {
          success: false,
          error: data?.msg,
        };
      }
    } catch (e) {
      item.status = UploadResultStatus.ERROR;
      return {
        success: false,
        error: e,
      };
    }
  }

  // 点击开始上传
  async function handleStartUpload() {
    const { maxNumber } = props;
    if ((fileListRef.value?.length || 0) + (props.previewFileList?.length || 0) > maxNumber) {
      return createMessage.warning(`最多只能上传${maxNumber}个文件`);
    }
    try {
      isUploadingRef.value = true;
      // 只上传不是成功状态的
      const uploadFileList =
        fileListRef.value.filter((item) => item.status !== UploadResultStatus.SUCCESS) || [];
      const data = await Promise.all(
        uploadFileList.map((item) => {
          return uploadApiByItem(item);
        }),
      );
      isUploadingRef.value = false;
      // 生产环境:抛出错误
      const errorList = data.filter((item: any) => !item.success);
      if (errorList.length > 0) throw errorList;
    } catch (e) {
      isUploadingRef.value = false;
      throw e;
    }
  }

  //   点击保存
  function handleOk() {
    const { maxNumber } = props;

    if (fileListRef.value.length > maxNumber) {
      return createMessage.warning(`最多只能上传${maxNumber}个文件`);
    }
    if (isUploadingRef.value) {
      return createMessage.warning("请等待文件上传后，保存!");
    }
    const fileList: string[] = [];

    for (const item of fileListRef.value) {
      const { status, response } = item;
      if (status === UploadResultStatus.SUCCESS && response) {
        fileList.push(response.url);
      }
    }
    // 存在一个上传成功的即可保存
    if (fileList.length <= 0) {
      return createMessage.warning("没有上传成功的文件，无法保存!");
    }
    fileListRef.value = [];
    closeModal();
    emit('change', fileList);
  }

  // 点击关闭：则所有操作不保存，包括上传的
  async function handleCloseFunc() {
    const hasUploading = isUploadingRef.value
    const hasSuccess = fileListRef.value.some((item) => item.status === UploadResultStatus.SUCCESS)

    // 无任何有效数据 → 直接关闭
    if (!hasUploading && !hasSuccess) {
      fileListRef.value = []
      return true
    }

    // 有数据 → 弹确认框防止误操作
    const parts: string[] = []
    if (hasUploading) parts.push('有文件正在上传')
    if (hasSuccess) parts.push('有已上传成功的文件尚未保存')
    const content = parts.join('，') + '，关闭弹窗将丢失这些内容。'

    try {
      await new Promise<void>((resolve, reject) => {
        Modal.confirm({
          centered: true,
          title: '确认取消',
          content,
          okText: '确定关闭',
          okType: 'danger',
          cancelText: '继续操作',
          onOk: () => resolve(),
          onCancel: () => reject(),
        })
      })
    } catch {
      return false
    }
    fileListRef.value = []
    isUploadingRef.value = false
    return true
  }
</script>

<style lang="less">
  .upload-modal {
    .ant-upload-list {
      display: none;
    }

    .ant-table-wrapper .ant-spin-nested-loading {
      padding: 0;
    }

    &-toolbar {
      display: flex;
      align-items: center;
      margin-bottom: 8px;

      &__btn {
        flex: 1;
        margin-left: 8px;
        text-align: right;
      }
    }
  }
</style>
