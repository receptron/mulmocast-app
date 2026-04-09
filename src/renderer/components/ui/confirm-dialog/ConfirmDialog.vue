<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <div class="flex items-center gap-3">
          <div v-if="icon" :class="iconBackgroundClass">
            <component :is="iconComponent" :class="iconClass" />
          </div>
          <div class="flex-1">
            <!-- Supports both parameterized and non-parameterized i18n keys
                 Examples: t('ui.actions.delete') or t('ui.actions.deleteThing', {thing: 'project'}) -->
            <DialogTitle class="text-left">{{ t(dialogTitleKey, dialogTitleParams) }}</DialogTitle>
            <DialogDescription v-if="dialogDescriptionKey" class="mt-2 text-left">
              {{ t(dialogDescriptionKey) }}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <DialogFooter class="flex-row justify-end gap-3 sm:gap-3">
        <Button :variant="cancelVariant" @click="handleCancel" :disabled="loading">
          {{ t(cancelLabelKey ? cancelLabelKey : "ui.actions.cancel") }}
        </Button>
        <Button :variant="confirmVariant" @click="handleConfirm" :disabled="loading">
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t(confirmLabelKey ? confirmLabelKey : "ui.actions.ok") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { AlertTriangle, Loader2, Info, CheckCircle, XCircle, HelpCircle } from "@lucide/vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "vue-i18n";

type IconType = "warning" | "error" | "success" | "info" | "question";
type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost";

interface Props {
  open: boolean;
  dialogTitleKey: string;
  dialogTitleParams?: Record<string, any>;
  dialogDescriptionKey?: string;
  icon?: IconType | null;
  confirmLabelKey?: string;
  cancelLabelKey?: string;
  confirmVariant?: ButtonVariant;
  cancelVariant?: ButtonVariant;
  loading?: boolean;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "confirm"): void;
  (e: "cancel"): void;
}

const { t } = useI18n();

const props = withDefaults(defineProps<Props>(), {
  icon: "warning",
  confirmLabelKey: "",
  cancelLabelKey: "",
  confirmVariant: "destructive",
  cancelVariant: "outline",
  loading: false,
});

const emit = defineEmits<Emits>();

// Map icon types to their corresponding Lucide Vue components
const iconComponent = computed(() => {
  const iconMap = {
    warning: AlertTriangle,
    error: XCircle,
    success: CheckCircle,
    info: Info,
    question: HelpCircle,
  };
  return props.icon ? iconMap[props.icon] : null;
});

// Generate background circle classes for each icon type
const iconBackgroundClass = computed(() => {
  const baseClasses = "flex h-12 w-12 shrink-0 items-center justify-center rounded-full";
  const colorMap = {
    warning: "bg-destructive/10 dark:bg-destructive/40", // Red background for warnings/danger
    error: "bg-destructive/10 dark:bg-destructive/40", // Red background for errors
    success: "bg-green-500/10 dark:bg-green-500/40", // Green background for success
    info: "bg-blue-500/10 dark:bg-blue-500/40", // Blue background for information
    question: "bg-gray-500/10 dark:bg-gray-500/40", // Gray background for questions
  };
  const bgColor = props.icon ? colorMap[props.icon] : "bg-gray-500/10 dark:bg-gray-500/40";
  return `${baseClasses} ${bgColor}`;
});

// Generate icon color classes for each icon type
const iconClass = computed(() => {
  const baseClasses = "h-6 w-6";
  const colorMap = {
    warning: "text-destructive dark:text-red-400", // Red icon for warnings/danger
    error: "text-destructive dark:text-red-400", // Red icon for errors
    success: "text-green-500 dark:text-green-300", // Green icon for success
    info: "text-blue-500 dark:text-blue-300", // Blue icon for information
    question: "text-gray-500 dark:text-gray-300", // Gray icon for questions
  };
  const textColor = props.icon ? colorMap[props.icon] : "text-gray-500 dark:text-gray-300";
  return `${baseClasses} ${textColor}`;
});

const handleConfirm = () => {
  emit("confirm");
};

const handleCancel = () => {
  emit("cancel");
  emit("update:open", false);
};
</script>
