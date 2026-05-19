<template>
  <div :class="prefixCls" :style="{ width: containerWidth }">
    <ImgUpload
      :fullscreen="fullscreen"
      @uploading="handleImageUploading"
      @done="handleDone"
      v-if="showImageUpload"
      v-show="editorRef"
      :disabled="disabled"
    />
    <textarea
      :id="tinymceId"
      ref="elRef"
      :style="{ visibility: 'hidden' }"
      v-if="!initOptions.inline"
    ></textarea>
    <slot v-else></slot>
  </div>
</template>

<script lang="ts" setup>
  import type { Editor, RawEditorSettings } from 'tinymce';
  import tinymce from 'tinymce/tinymce';
  import 'tinymce/themes/silver';
  import 'tinymce/icons/default/icons';
  import 'tinymce/plugins/advlist';
  import 'tinymce/plugins/anchor';
  import 'tinymce/plugins/autolink';
  import 'tinymce/plugins/autosave';
  import 'tinymce/plugins/code';
  import 'tinymce/plugins/codesample';
  import 'tinymce/plugins/directionality';
  import 'tinymce/plugins/fullscreen';
  import 'tinymce/plugins/hr';
  import 'tinymce/plugins/insertdatetime';
  import 'tinymce/plugins/link';
  import 'tinymce/plugins/lists';
  import 'tinymce/plugins/media';
  import 'tinymce/plugins/nonbreaking';
  import 'tinymce/plugins/noneditable';
  import 'tinymce/plugins/pagebreak';
  import 'tinymce/plugins/paste';
  import 'tinymce/plugins/preview';
  import 'tinymce/plugins/print';
  import 'tinymce/plugins/save';
  import 'tinymce/plugins/searchreplace';
  import 'tinymce/plugins/spellchecker';
  import 'tinymce/plugins/tabfocus';
  // import 'tinymce/plugins/table';
  import 'tinymce/plugins/template';
  import 'tinymce/plugins/textpattern';
  import 'tinymce/plugins/visualblocks';
  import 'tinymce/plugins/visualchars';
  import 'tinymce/plugins/wordcount';

  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onDeactivated,
    PropType,
    ref,
    unref,
    useAttrs,
    watch,
  } from 'vue';
  import ImgUpload from './ImgUpload.vue';
  import { plugins as defaultPlugins, toolbar as defaultToolbar, appPlugins, appToolbar } from './tinymce';
  import { buildShortUUID } from '@/utils/core/IdUtil';
  import { bindHandlers } from './helper';
  import { onMountedOrActivated } from '@xueyi/hooks';
  import { useDesign } from '@/hooks/web/useDesign';
  import { isNumber } from '@/utils/core/ObjectUtil';
  import { useAppStore } from '@/store/modules/app';

  defineOptions({ name: 'Tinymce', inheritAttrs: false });

  const props = defineProps({
    options: {
      type: Object as PropType<Partial<RawEditorSettings>>,
      default: () => ({}),
    },
    value: {
      type: String,
    },

    toolbar: {
      type: Array as PropType<string[]>,
      default: defaultToolbar,
    },
    plugins: {
      type: Array as PropType<string[]>,
      default: defaultPlugins,
    },
    modelValue: {
      type: String,
    },
    height: {
      type: [Number, String] as PropType<string | number>,
      required: false,
      default: 400,
    },
    width: {
      type: [Number, String] as PropType<string | number>,
      required: false,
      default: 'auto',
    },
    showImageUpload: {
      type: Boolean,
      default: true,
    },
    /** 内容类型：'pc' 为 PC Web 完整编辑器，'app' 为移动端 App 精简模式 */
    contentType: {
      type: String as PropType<'pc' | 'app'>,
      default: 'pc',
    },
  });

  const emit = defineEmits(['change', 'update:modelValue', 'inited', 'init-error']);

  const attrs = useAttrs();
  const editorRef = ref<Editor | null>(null);
  const fullscreen = ref(false);
  const tinymceId = ref<string>(buildShortUUID('tiny-vue'));
  const elRef = ref<HTMLElement | null>(null);
  /** 主题切换时暂存内容，避免依赖父组件 v-model 回传时序 */
  const savedContent = ref('');

  const { prefixCls } = useDesign('tinymce-container');

  const appStore = useAppStore();

  const containerWidth = computed(() => {
    const width = props.width;
    if (isNumber(width)) {
      return `${width}px`;
    }
    return width;
  });

  const skinName = computed(() => {
    return appStore.getDarkMode === 'light' ? 'oxide' : 'oxide-dark';
  });

  const langName = 'zh_CN';

  const initOptions = computed((): RawEditorSettings => {
    const { height, options, toolbar, plugins, contentType } = props;
    const publicPath = import.meta.env.VITE_PUBLIC_PATH || '/';
    const isApp = contentType === 'app';

    /** App 端内容样式：与输出 style 标签保持一致，编辑器内所见即所得 */
    const appContentStyle = `
      body { font-family: -apple-system, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', 'PingFang SC', 'Noto Sans SC', sans-serif; font-size: 16px; line-height: 1.6; color: #333; padding: 8px; -webkit-text-size-adjust: 100%; }
      p { margin: 0 0 8px 0; }
      blockquote { margin: 8px 0; padding: 4px 12px; border-left: 3px solid #ccc; color: #666; }
      ul, ol { padding-left: 1.5em; margin: 4px 0; }
      img { max-width: 100%; height: auto; }
    `;

    /** App 端字号格式 */
    const appFontsizeFormats = '12px 14px 16px 18px 20px 24px';

    const baseOptions: RawEditorSettings = {
      selector: `#${unref(tinymceId)}`,
      height,
      toolbar: isApp ? appToolbar : toolbar,
      menubar: isApp ? false : 'file edit insert view format table',
      plugins: isApp ? appPlugins : plugins,
      language_url: publicPath + 'resource/tinymce/langs/' + langName + '.js',
      language: langName,
      branding: false,
      default_link_target: '_blank',
      link_title: false,
      object_resizing: false,
      auto_focus: true,
      skin: skinName.value,
      skin_url: publicPath + 'resource/tinymce/skins/ui/' + skinName.value,
      content_css: publicPath + 'resource/tinymce/skins/ui/' + skinName.value + '/content.min.css',
      ...(isApp ? { content_style: appContentStyle, fontsize_formats: appFontsizeFormats } : {}),
      ...options,
      setup: (editor: Editor) => {
        editorRef.value = editor;
        editor.on('init', (e) => initSetup(e));
      },
    };

    return baseOptions;
  });

  const disabled = computed(() => {
    const { options } = props;
    const getdDisabled = options && Reflect.get(options, 'readonly');
    const editor = unref(editorRef);
    if (editor) {
      editor.setMode(getdDisabled ? 'readonly' : 'design');
    }
    return getdDisabled ?? false;
  });

  watch(
    () => attrs.disabled,
    () => {
      const editor = unref(editorRef);
      if (!editor) {
        return;
      }
      editor.setMode(attrs.disabled ? 'readonly' : 'design');
    },
  );

  /** 主题切换时重建编辑器以更换皮肤 */
  watch(skinName, () => {
    const editor = unref(editorRef);
    if (!editor) return;
    // 1. 保存内容到本地 ref（避免依赖父组件 v-model 回传的时序问题）
    savedContent.value = editor.getContent();
    emit('update:modelValue', savedContent.value);
    emit('change', savedContent.value);
    // 2. 销毁编辑器
    editor.destroy();
    editorRef.value = null;
    // 3. 生成新的元素 id，避免 TinyMCE 在同一个 DOM 上复用时出现清理不彻底的问题
    tinymceId.value = buildShortUUID('tiny-vue');
    nextTick(() => {
      setTimeout(() => initEditor(), 100);
    });
  });

  onMountedOrActivated(() => {
    if (!initOptions.value.inline) {
      tinymceId.value = buildShortUUID('tiny-vue');
    }
    nextTick(() => {
      setTimeout(() => {
        initEditor();
      }, 30);
    });
  });

  onBeforeUnmount(() => {
    destory();
  });

  onDeactivated(() => {
    destory();
  });

  function destory() {
    if (tinymce !== null) {
      tinymce?.remove?.(unref(initOptions).selector!);
    }
  }

  function initEditor() {
    const el = unref(elRef);
    if (el) {
      el.style.visibility = '';
    }
    tinymce
      .init(unref(initOptions))
      .then((editor) => {
        emit('inited', editor);
      })
      .catch((err) => {
        emit('init-error', err);
      });
  }

  function initSetup(e) {
    const editor = unref(editorRef);
    if (!editor) {
      return;
    }
    const rawValue = props.modelValue || props.value || savedContent.value || '';
    const value = props.contentType === 'app' ? unwrapForApp(rawValue) : rawValue;

    editor.setContent(value);
    bindModelHandlers(editor);
    bindHandlers(e, attrs, unref(editorRef));
  }

  /** 加载内容时剥离注入的 <style> 和包裹 div，避免重复嵌套 */
  function unwrapForApp(html: string) {
    if (!html) return '';
    let result = html;
    // 剥离注入的 <style> 标签
    result = result.replace(/^<style>[^<]*<\/style>/, '');
    // 循环剥离可能嵌套的包裹 div（旧版或多次编辑产生的）
    const wrapStart = /^\s*<div\s+style="font-size:\s*1[246]p[tx];[^"]*">/;
    const wrapEnd = /<\/div>\s*$/;
    while (wrapStart.test(result) && wrapEnd.test(result)) {
      result = result.replace(wrapStart, '').replace(wrapEnd, '');
    }
    return result.trim();
  }

  function setValue(editor: Record<string, any>, val?: string, prevVal?: string) {
    if (!editor) return;
    // 兼容 resetFields 后 val 为 undefined 的场景，统一转为空字符串
    const strVal = typeof val === 'string' ? val : '';
    const cleanVal = props.contentType === 'app' ? unwrapForApp(strVal) : strVal;
    const currentContent = editor.getContent({ format: attrs.outputFormat });
    if (
      strVal !== prevVal &&
      cleanVal !== currentContent
    ) {
      editor.setContent(cleanVal);
    }
  }

  function bindModelHandlers(editor: any) {
    const modelEvents = attrs.modelEvents ? attrs.modelEvents : null;
    const normalizedEvents = Array.isArray(modelEvents) ? modelEvents.join(' ') : modelEvents;

    /** App 端将默认样式注入为 <style> 标签，iOS/Android/PC WebView 均原生支持 */
    const wrapForApp = (html: string) =>
      `<style>body{font-size:16px;font-family:-apple-system,system-ui,'Segoe UI',Roboto,'Helvetica Neue','PingFang SC','Noto Sans SC',sans-serif;line-height:1.6;color:#333}p{margin:0 0 8px 0}blockquote{margin:8px 0;padding:4px 12px;border-left:3px solid #ccc;color:#666}ul,ol{padding-left:1.5em;margin:4px 0}img{max-width:100%;height:auto}</style>${html}`;

    const getContent = () => {
      const raw = editor.getContent({ format: attrs.outputFormat });
      return props.contentType === 'app' ? wrapForApp(raw) : raw;
    };

    watch(
      () => props.modelValue,
      (val, prevVal) => {
        setValue(editor, val, prevVal);
      },
    );

    watch(
      () => props.value,
      (val, prevVal) => {
        setValue(editor, val, prevVal);
      },
      {
        immediate: true,
      },
    );

    editor.on(normalizedEvents ? normalizedEvents : 'change keyup undo redo', () => {
      const content = getContent();
      emit('update:modelValue', content);
      emit('change', content);
    });

    editor.on('FullscreenStateChanged', (e) => {
      fullscreen.value = e.state;
    });
  }

  function handleImageUploading(name: string) {
    const editor = unref(editorRef);
    if (!editor) {
      return;
    }
    editor.execCommand('mceInsertContent', false, getUploadingImgName(name));
    const content = editor?.getContent() ?? '';
    setValue(editor, content);
  }

  function handleDone(name: string, url: string) {
    const editor = unref(editorRef);
    if (!editor) {
      return;
    }
    const content = editor?.getContent() ?? '';
    const val = content?.replace(getUploadingImgName(name), `<img src="${url}"/>`) ?? '';
    setValue(editor, val);
  }

  function getUploadingImgName(name: string) {
    return `[uploading:${name}]`;
  }
</script>

<style lang="less">
  @prefix-cls: ~'@{namespace}-tinymce-container';

  .@{prefix-cls} {
    position: relative;
    line-height: normal;

    textarea {
      visibility: hidden;
      z-index: -1;
    }
  }
</style>
