const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { authenticateToken, requirePermission } = require("../middleware/auth")
const productsController = require("../controllers/productsController")

const router = express.Router()

// Configuración de Multer para la subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(__dirname, "../../../uploads/products")
    // Asegurarse de que el directorio exista
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    )
  },
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Aceptar solo imágenes
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Solo se permiten archivos de imagen."), false)
    }
  },
})

router.use(authenticateToken)

router.get("/", productsController.getAll)
router.get("/:id", productsController.getById)
router.post("/", requirePermission("products"), productsController.create)
router.put("/:id", requirePermission("products"), productsController.update)
router.delete("/:id", requirePermission("products"), productsController.delete)
router.put("/:id/stock", requirePermission("inventory"), productsController.updateStock)

// Nueva ruta para subir imagen de producto
router.post(
  "/:id/upload-image",
  upload.single("image"),
  productsController.uploadImage,
)

module.exports = router
