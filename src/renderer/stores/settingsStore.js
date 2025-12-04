import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/services/api.js";

export const useSettingsStore = defineStore("settings", () => {
  const settings = ref({
    company_name: "Mi Empresa",
    company_rif: "J-12345678-9",
    company_address: "Dirección de la empresa",
    company_phone: "+58 212 123 4567",
    company_email: "info@empresa.com",
    system_title: "Facturación",
    system_logo: "",
    primary_color: "#1976D2",
    secondary_color: "#4CAF50",
    dark_mode: false,
    fonts_title: { font: "Arial", size: "24px" },
    fonts_subtitle: { font: "Arial", size: "18px" },
    fonts_text: { font: "Arial", size: "14px" },
    summary_cards_bg_color: "#FFFFFF",
    summary_cards_text_color: "#000000",
    summary_cards_icon: "mdi-chart-line",
    summary_cards_text_size: "16px",
  });

  const loading = ref(false);
  const error = ref(null);

  const fetchSettings = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/settings');
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

  const fetchCompanySettings = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/settings/company');
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
      error.value = "Error loading company settings";
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  const saveSettings = async () => {
    loading.value = true;
    error.value = null;
    try {
      const categories = {
        company_name: 'company',
        company_rif: 'company',
        company_address: 'company',
        company_phone: 'company',
        company_email: 'company',
        system_title: 'interface',
        system_logo: 'interface',
        primary_color: 'interface',
        secondary_color: 'interface',
        dark_mode: 'interface',
        fonts_title: 'interface',
        fonts_subtitle: 'interface',
        fonts_text: 'interface',
        summary_cards_bg_color: 'interface',
        summary_cards_text_color: 'interface',
        summary_cards_icon: 'interface',
        summary_cards_text_size: 'interface',
      };

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
            category: categories[key] || 'system',
          };
        }
      );
      await api.post('/settings', settingsArray);
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
    fetchCompanySettings,
    saveSettings,
  };
});