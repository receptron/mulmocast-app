import { notifyError } from "@/lib/notification";
import { useI18n } from "vue-i18n";
import { ENV_KEYS } from "../../shared/constants";

import { useMulmoGlobalStore } from "@/store";

export const useApiErrorNotify = () => {
  const globalStore = useMulmoGlobalStore();
  const { t } = useI18n();

  const apiErrorNotify = (keyName: string) => {
    notifyError(t("ui.status.error"), t("notify.apiKey.error", { keyName: ENV_KEYS[keyName].title }), {
      label: t("notify.apiKey.setup"),
      onClick: () => globalStore.toggleSettingModal(),
    });
  };

  return {
    apiErrorNotify,
  };
};
