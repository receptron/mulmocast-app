import { toast } from "vue-sonner";

export const notifySuccess = (message: string, description?: string) => {
  toast.success(message, {
    description,
  });
};

export const notifyInfo = (message: string, description?: string) => {
  toast.info(message, {
    description,
  });
};

export const notifyError = (
  message: string | Error | unknown,
  description?: string,
  action?: {
    label: string;
    onClick: () => void;
  },
) => {
  // Extract error message if an Error object is passed
  let errorMessage: string;
  if (message instanceof Error) {
    errorMessage = message.message || "Unknown error";
  } else if (typeof message === "string") {
    errorMessage = message;
  } else {
    errorMessage = String(message) || "Unknown error";
  }

  toast.error(errorMessage, {
    description,
    action,
    duration: Infinity,
    closeButton: true,
  });
};

export const notifyProgress = async <T>(
  promise: Promise<T & { result?: boolean; error?: unknown; noContext?: boolean }>,
  {
    successMessage,
    errorMessage,
    errorDescription,
  }: { successMessage: string; errorMessage: string; errorDescription: string },
) => {
  try {
    const result = await promise;
    if (result?.result === false) {
      if (result.noContext) {
        notifyError(errorMessage, errorDescription);
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
