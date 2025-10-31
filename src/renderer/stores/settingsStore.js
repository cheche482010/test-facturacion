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
    systemTitle: "Facturación",
    systemLogo: "",
    primaryColor: "#1976D2",
    secondaryColor: "#4CAF50",
    darkMode: false,
    fontsTitle: { font: "Arial", size: "24px" },
    fontsSubtitle: { font: "Arial", size: "18px" },
    fontsText: { font: "Arial", size: "14px" },
    summaryCardsBgColor: "#FFFFFF",
    summaryCardsTextColor: "#000000",
    summaryCardsIcon: "mdi-chart-line",
    summaryCardsTextSize: "16px",
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
          let value = setting.value;
          if (setting.dataType === "boolean") {
            value = value === "true";
          } else if (setting.dataType === "number") {
            value = parseFloat(value);
          } else if (setting.dataType === "json") {
            try {
              value = JSON.parse(value);
            } catch (e) {
              console.warn(`Error parsing JSON for ${setting.key}:`, e);
            }
          }
          newSettings[setting.key] = value;
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
        ([key, value]) => {
          let processedValue = value;
          let dataType = "string";

          if (typeof value === "boolean") {
            processedValue = value.toString();
            dataType = "boolean";
          } else if (typeof value === "number") {
            processedValue = value.toString();
            dataType = "number";
          } else if (typeof value === "object") {
            processedValue = JSON.stringify(value);
            dataType = "json";
          } else {
            processedValue = value ? value.toString() : "";
          }

          return {
            key,
            value: processedValue,
            dataType,
          };
        }
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