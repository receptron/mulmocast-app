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
  });
};

export const notifyProgress = <T>(
  promise: Promise<T>,
  {
    loadingMessage,
    successMessage,
    errorMessage,
  }: { loadingMessage: string | Component; successMessage: string; errorMessage: string },
) => {
  toast.promise(
    (async () => {
      const result = await promise;
      if (result?.result === false) {
        console.log("error");
        if (result.error) {
          throw result.error;
        }
        throw Error("Unknown error");
      }
    })(),
    {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
    },
  );
  return promise;
};
