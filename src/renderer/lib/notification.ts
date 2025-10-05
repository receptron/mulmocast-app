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

export const notifyProgress = async <T>(
  promise: Promise<T & { result?: boolean; error?: unknown }>,
  { successMessage, errorMessage }: { successMessage: string; errorMessage: string },
) => {
  try {
    const result = await promise;
    if (result?.result === false) {
      if (result?.error) {
        notifyError(errorMessage, result.error instanceof Error ? result.error.message : "Unknown error");
      } else {
        notifyError(errorMessage);
      }
    } else {
      notifySuccess(successMessage);
    }
    return result;
  } catch (error) {
    notifyError(errorMessage, error instanceof Error ? error.message : "Unknown error");
  }
};
