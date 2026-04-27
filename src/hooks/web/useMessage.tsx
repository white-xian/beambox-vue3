import type { ModalFuncProps } from 'ant-design-vue/lib/modal/Modal';
import { Modal, notification } from 'ant-design-vue';
import { CheckCircleFilled, CloseCircleFilled, InfoCircleFilled } from '@ant-design/icons-vue';
import { ConfigProps, NotificationArgsProps } from 'ant-design-vue/lib/notification';
import type { MessageHandler, MessageOptions } from 'element-plus';
import { ElMessage } from 'element-plus';
import { isString } from '@/utils/core/ObjectUtil';

export interface NotifyApi {
  info(config: NotificationArgsProps): void;

  success(config: NotificationArgsProps): void;

  error(config: NotificationArgsProps): void;

  warn(config: NotificationArgsProps): void;

  warning(config: NotificationArgsProps): void;

  open(args: NotificationArgsProps): void;

  close(key: String): void;

  config(options: ConfigProps): void;

  destroy(): void;
}

export declare type NotificationPlacement = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
export declare type IconType = 'success' | 'info' | 'error' | 'warning';
type MessageType = 'success' | 'info' | 'error' | 'warning' | 'loading';
type MessageInput =
  | string
  | Error
  | (Partial<MessageOptions> & {
      content?: unknown;
      key?: string;
      type?: MessageType;
    });

export interface ModalOptionsEx extends Omit<ModalFuncProps, 'iconType'> {
  iconType: 'warning' | 'success' | 'error' | 'info';
}

export type ModalOptionsPartial = Partial<ModalOptionsEx> & Pick<ModalOptionsEx, 'content'>;

const messageInstances = new Map<string, MessageHandler>();

function resolveMessageContent(content: unknown) {
  if (content instanceof Error) {
    return content.message;
  }

  if (isString(content)) {
    return content;
  }

  if (content == null) {
    return '';
  }

  return String(content);
}

function normalizeMessageOptions(input: MessageInput, defaultType: MessageType = 'info') {
  const optionInput = (input && typeof input === 'object' ? input : {}) as Record<string, any>;
  const rawContent = optionInput.content ?? optionInput.message ?? input;
  const message = resolveMessageContent(rawContent);

  if (!message) {
    return null;
  }

  const rest = { ...optionInput };
  Reflect.deleteProperty(rest, 'content');
  Reflect.deleteProperty(rest, 'key');
  Reflect.deleteProperty(rest, 'message');
  Reflect.deleteProperty(rest, 'type');

  const resolvedType = (optionInput.type ?? defaultType) as MessageType;

  return {
    ...rest,
    key: isString(optionInput.key) ? optionInput.key : undefined,
    message,
    type: resolvedType === 'loading' ? 'info' : resolvedType,
    duration: rest.duration ?? (resolvedType === 'loading' ? 4000 : undefined),
  } as MessageOptions & { key?: string };
}

function closeMessageByKey(key?: string) {
  if (!key) {
    return;
  }

  const handler = messageInstances.get(key);
  handler?.close();
  messageInstances.delete(key);
}

function openMessage(input: MessageInput, defaultType: MessageType = 'info') {
  const options = normalizeMessageOptions(input, defaultType);
  if (!options) {
    return;
  }

  const { key, onClose, ...messageOptions } = options;
  if (key) {
    closeMessageByKey(key);
  }

  const handler = ElMessage({
    ...messageOptions,
    onClose: () => {
      if (key) {
        messageInstances.delete(key);
      }
      onClose?.();
    },
  });

  if (key) {
    messageInstances.set(key, handler);
  }

  return handler;
}

const createMessage = {
  open: (input: MessageInput) => openMessage(input),
  success: (input: MessageInput) => openMessage(input, 'success'),
  error: (input: MessageInput) => openMessage(input, 'error'),
  warning: (input: MessageInput) => openMessage(input, 'warning'),
  warn: (input: MessageInput) => openMessage(input, 'warning'),
  info: (input: MessageInput) => openMessage(input, 'info'),
  loading: (input: MessageInput) => openMessage(input, 'loading'),
  destroy: (key?: string) => {
    if (key) {
      closeMessageByKey(key);
      return;
    }

    ElMessage.closeAll();
    messageInstances.clear();
  },
  config: (_options?: unknown) => undefined,
};

function getIcon(iconType: string) {
  if (iconType === 'warning') {
    return <InfoCircleFilled class="modal-icon-warning" />;
  } else if (iconType === 'success') {
    return <CheckCircleFilled class="modal-icon-success" />;
  } else if (iconType === 'info') {
    return <InfoCircleFilled class="modal-icon-info" />;
  } else {
    return <CloseCircleFilled class="modal-icon-error" />;
  }
}

function renderContent({ content }: Pick<ModalOptionsEx, 'content'>) {
  if (isString(content)) {
    return <div innerHTML={`<div>${content as string}</div>`}></div>;
  } else {
    return content;
  }
}

/**
 * @description: Create confirmation box
 */
function createConfirm(options: ModalOptionsEx) {
  const iconType = options.iconType || 'warning';
  Reflect.deleteProperty(options, 'iconType');
  const opt: ModalFuncProps = {
    centered: true,
    icon: getIcon(iconType),
    ...options,
    content: renderContent(options),
  };
  return Modal.confirm(opt);
}

const getBaseOptions = () => {
  return {
    okText: '确认',
    centered: true,
  };
};

function createModalOptions(options: ModalOptionsPartial, icon: string): ModalOptionsPartial {
  return {
    ...getBaseOptions(),
    ...options,
    content: renderContent(options),
    icon: getIcon(icon),
  };
}

function createSuccessModal(options: ModalOptionsPartial) {
  return Modal.success(createModalOptions(options, 'success'));
}

function createErrorModal(options: ModalOptionsPartial) {
  return Modal.error(createModalOptions(options, 'error'));
}

function createInfoModal(options: ModalOptionsPartial) {
  return Modal.info(createModalOptions(options, 'info'));
}

function createWarningModal(options: ModalOptionsPartial) {
  return Modal.warning(createModalOptions(options, 'warning'));
}

notification.config({
  placement: 'topRight',
  duration: 3,
});

/**
 * @description: message
 */
export function useMessage() {
  return {
    createMessage,
    notification: notification as NotifyApi,
    createConfirm,
    createSuccessModal,
    createErrorModal,
    createInfoModal,
    createWarningModal,
  };
}
