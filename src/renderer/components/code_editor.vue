<template>
  <div ref="editorContainer" class="code-editor-container h-full" :style="{ minHeight: minHeight }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef } from "vue";
import loader, { type Monaco } from "@monaco-editor/loader";
import type { editor } from "monaco-editor";
import { configureMonacoYaml } from "monaco-yaml";

interface Props {
  modelValue: string;
  language: "json" | "yaml";
  minHeight?: string;
  jsonSchema?: Record<string, unknown>;
}

const props = withDefaults(defineProps<Props>(), {
  minHeight: "560px",
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  focus: [];
  blur: [];
}>();

const editorContainer = ref<HTMLDivElement | null>(null);
const editorInstance = shallowRef<editor.IStandaloneCodeEditor | null>(null);
const monacoRef = shallowRef<Monaco | null>(null);

let isUpdatingModel = false;
let isYamlConfigured = false;

const setDiagnosticsOptions = (monaco: Monaco, language: "json" | "yaml") => {
  const schema = {
    uri: "mulmocast://schema.json",
    fileMatch: ["*"],
    schema: props.jsonSchema,
  };

  switch (language) {
    case "json":
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [schema],
      });
      break;
    case "yaml":
      // Only configure Monaco YAML once to prevent duplicate schema registrations
      if (!isYamlConfigured) {
        configureMonacoYaml(monaco, {
          schemas: [schema],
        });
        isYamlConfigured = true;
      }
      break;
  }
};

onMounted(async () => {
  const monaco = await loader.init();
  monacoRef.value = monaco;

  setDiagnosticsOptions(monaco, props.language);

  if (editorContainer.value) {
    editorInstance.value = monaco.editor.create(editorContainer.value as unknown as HTMLElement, {
      value: props.modelValue || "",
      language: props.language,
      theme: "vs-dark",
      minimap: {
        enabled: false,
      },
      fontSize: 13,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      lineHeight: 1.5,
      padding: {
        top: 15,
        bottom: 15,
      },
      wordWrap: "on",
      wrappingStrategy: "advanced",
      renderLineHighlight: "all",
      contextmenu: true,
      smoothScrolling: true,
      cursorBlinking: "blink",
      cursorSmoothCaretAnimation: "on",
      tabSize: 2,
      insertSpaces: true,
      formatOnPaste: true,
      scrollBeyondLastLine: false,
      quickSuggestions: {
        other: true,
        strings: true,
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnCommitCharacter: true,
      guides: {
        bracketPairs: true,
        indentation: true,
      },
    });

    editorInstance.value.onDidChangeModelContent(() => {
      if (!isUpdatingModel) {
        const value = editorInstance.value?.getValue() || "";
        emit("update:modelValue", value);
      }
    });
  }
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (editorInstance.value && editorInstance.value.getValue() !== newValue) {
      isUpdatingModel = true;
      
      // Save cursor position before setValue
      const position = editorInstance.value.getPosition();
      
      editorInstance.value.setValue(newValue || "");
      
      // Restore cursor position after setValue
      if (position) {
        editorInstance.value.setPosition(position);
      }
      
      isUpdatingModel = false;
    }
  },
);

watch(
  () => props.language,
  (newLanguage) => {
    if (editorInstance.value && monacoRef.value) {
      const model = editorInstance.value.getModel();
      if (model) {
        monacoRef.value.editor.setModelLanguage(model, newLanguage);

        setDiagnosticsOptions(monacoRef.value, newLanguage);
      }
    }
  },
);

onUnmounted(() => {
  editorInstance.value?.dispose();
});
</script>

<style scoped>
.code-editor-container {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  background-color: #1e1e1e;
}

.code-editor-container :deep(.monaco-editor) {
  border-radius: 8px;
}

.code-editor-container :deep(.monaco-editor .margin) {
  background-color: #1e1e1e;
}

.code-editor-container :deep(.monaco-editor .monaco-editor-background) {
  background-color: #1e1e1e;
}
</style>
