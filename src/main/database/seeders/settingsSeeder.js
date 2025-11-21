require("dotenv").config()
const { Settings } = require("../models")

const seedSettings = async () => {
  try {
    console.log("   -> Creando configuraciones...")

    const settingsCount = await Settings.count()
    if (settingsCount > 0) {
      console.log("     -> Las configuraciones ya existen, omitiendo creación.")
      return
    }

    const settingsExist = await Settings.count()
    if (settingsExist === 0) {
      const defaultSettings = [
        {
          key: "company_name",
          value: "Mi Empresa",
          category: "company",
          description: "Nombre de la empresa",
        },
        {
          key: "company_rif",
          value: "J-12345678-9",
          category: "company",
          description: "RIF de la empresa",
        },
        {
          key: "company_address",
          value: "Dirección de la empresa",
          category: "company",
          description: "Dirección fiscal",
        },
        {
          key: "default_currency",
          value: "VES",
          category: "system",
          description: "Moneda por defecto",
        },
        {
          key: "exchange_rate",
          value: "36.50",
          dataType: "number",
          category: "system",
          description: "Tasa de cambio USD/VES",
        },
        {
          key: "auto_update_exchange_rate",
          value: "true",
          dataType: "boolean",
          category: "system",
          description: "Actualizar tasa automáticamente",
        },
        {
          key: "default_tax_rate",
          value: "16.00",
          dataType: "number",
          category: "system",
          description: "Tasa de IVA por defecto",
        },
        {
          key: "business_opening_time",
          value: "09:00",
          dataType: "string",
          category: "system",
          description: "Hora de apertura del negocio (HH:mm)",
        },
        {
          key: "system_title",
          value: "Facturación",
          dataType: "string",
          category: "interface",
          description: "Título del sistema",
        },
        {
          key: "system_logo",
          value: "",
          dataType: "string",
          category: "interface",
          description: "Logo del sistema (base64)",
        },
        {
          key: "primary_color",
          value: "#1976D2",
          dataType: "string",
          category: "interface",
          description: "Color primario del sistema",
        },
        {
          key: "secondary_color",
          value: "#4CAF50",
          dataType: "string",
          category: "interface",
          description: "Color secundario del sistema",
        },
        {
          key: "dark_mode",
          value: "false",
          dataType: "boolean",
          category: "interface",
          description: "Modo oscuro activado",
        },
        {
          key: "fonts_title",
          value: JSON.stringify({ font: "Arial", size: "24px" }),
          dataType: "json",
          category: "interface",
          description: "Configuración de fuente para títulos",
        },
        {
          key: "fonts_subtitle",
          value: JSON.stringify({ font: "Arial", size: "18px" }),
          dataType: "json",
          category: "interface",
          description: "Configuración de fuente para subtítulos",
        },
        {
          key: "fonts_text",
          value: JSON.stringify({ font: "Arial", size: "14px" }),
          dataType: "json",
          category: "interface",
          description: "Configuración de fuente para texto",
        },
        {
          key: "summary_cards_bg_color",
          value: "#FFFFFF",
          dataType: "string",
          category: "interface",
          description: "Color de fondo de las tarjetas resumen",
        },
        {
          key: "summary_cards_text_color",
          value: "#000000",
          dataType: "string",
          category: "interface",
          description: "Color de texto de las tarjetas resumen",
        },
        {
          key: "summary_cards_icon",
          value: "mdi-chart-line",
          dataType: "string",
          category: "interface",
          description: "Icono por defecto de las tarjetas resumen",
        },
        {
          key: "summary_cards_text_size",
          value: "16px",
          dataType: "string",
          category: "interface",
          description: "Tamaño del texto de las tarjetas resumen",
        },
      ]

      await Settings.bulkCreate(defaultSettings)
      console.log("     -> Configuraciones por defecto creadas.")
    }

    console.log("   -> Configuraciones creadas exitosamente.")
  } catch (error) {
    console.error("Error creando configuraciones:", error)
    throw error
  }
}

module.exports = { seedSettings }

if (require.main === module) {
  seedSettings()
    .then(() => {
      console.log("Seeder de configuraciones ejecutado exitosamente.")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Error ejecutando seeder de configuraciones:", error)
      process.exit(1)
    })
}