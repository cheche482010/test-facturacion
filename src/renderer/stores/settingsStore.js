import { defineStore } from "pinia";
import { ref } from "vue";

export const useSettingsStore = defineStore("settings", () => {
  const settings = ref({
    currency: "USD",
    language: "es",
    timezone: "America/Caracas",
    theme: "light",
    companyName: "",
    companyRif: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    invoicePrefix: "FAC-",
    nextInvoiceNumber: 1,
    taxRate: 16,
    autoCalculateTax: true,
    autoBackup: false,
    backupInterval: 24,
    openingTime: "08:00",
  });

  const loading = ref(false);
  const error = ref(null);

  const fetchSettings = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await window.electronAPI.invoke("get-settings");
      if (response) {
        const newSettings = {};
        for (const setting of response) {
          newSettings[setting.key] = setting.value;
        }
        settings.value = { ...settings.value, ...newSettings };
      }
    } catch (err) {
      error.value = "Error loading settings";
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  const saveSettings = async () => {
    loading.value = true;
    error.value = null;
    try {
      const settingsArray = Object.entries(settings.value).map(
        ([key, value]) => ({
          key,
          value: value.toString(),
        })
      );
      await window.electronAPI.invoke("save-settings", settingsArray);
    } catch (err) {
      error.value = "Error saving settings";
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  return {
    settings,
    loading,
    error,
    fetchSettings,
    saveSettings,
  };
});