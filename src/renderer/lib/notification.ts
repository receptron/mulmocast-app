import { Component } from "vue";
import { toast } from "vue-sonner";

export const notifySuccess = (message: string, description?: string) => {
  toast.success(message, {
    description,
  });
};

export const notifyError = (
  message: string,
  description?: string,
  action?: {
    label: string;
    onClick: () => void;
  },
) => {
  toast.error(message, {
    description,
    action,
    duration: Infinity,
    closeButton: true,
  });
};

export const notifyProgress = <T>(
  promise: Promise<T & { result?: boolean; error?: unknown }>,
  {
    loadingMessage,
    successMessage,
    errorMessage,
  }: { loadingMessage: string | Component; successMessage: string; errorMessage: string },
) => {
  const toastId = toast.loading(loadingMessage, {
    duration: Infinity,
  });
  promise
    .then((result) => {
      toast.dismiss(toastId);
      if (result?.result === false) {
        notifyError(errorMessage, result.error instanceof Error ? result.error.message : "Unknown error");
      } else {
        notifySuccess(successMessage);
      }
    })
    .catch((error) => {
      toast.dismiss(toastId);
      notifyError(errorMessage, error instanceof Error ? error.message : "Unknown error");
    });
  return promise;
};
