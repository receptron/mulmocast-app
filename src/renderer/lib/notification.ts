import { toast } from "vue-sonner";

export const notifySuccess = (message: string, description?: string) => {
  toast.success(message, {
    description,
  });
};

export const notifyError = (message: string, description?: string) => {
  toast.error(message, {
    description,
  });
};
