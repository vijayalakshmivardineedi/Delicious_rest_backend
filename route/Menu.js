const express = require("express");
const router = express.Router();

const {
  getAllMenus,
  getById,
  createCategory,
  addItemToCategory,
  updateCategoryById,
  updateItemById,
  deleteCategoryById,
  deleteItemById,
  toggleCategory,
  toggleItem 
} = require("../controller/Menu");
const upload = require("../Middleware/uploads");

const uploadWithErrorHandler = (req, res, next) => {
  const multerUpload = upload.fields([
    { name: "image", maxCount: 1 },
  ]);

  multerUpload(req, res, function (err) {
    if (err) {
      req.uploadError = err.message;
      console.error("Multer Error:", err.message);
    }

    const isPostMethod = req.method === "POST";

    const hasImage = req.files && req.files.image && req.files.image.length > 0;

    if (isPostMethod && !hasImage) {
      req.uploadError = req.uploadError || "Image file is required.";
    }

    if (hasImage) {
    }

    next();
  });
};

router.get("/getMenu", getAllMenus);
router.get("/:id", getById);

router.post("/createCategory", uploadWithErrorHandler, createCategory);
router.post("/addItemToCategory", uploadWithErrorHandler, addItemToCategory);

router.put("/updateCategoryById", uploadWithErrorHandler, updateCategoryById);
router.put("/updateItem/:categoryId/:itemId", uploadWithErrorHandler, updateItemById);

router.delete("/deleteCategoryById/:id", deleteCategoryById);
router.delete("/deleteItem/:categoryId/:itemId", deleteItemById);

router.patch("/toggleCategory/:categoryId", toggleCategory);
router.patch("/toggleItem/:categoryId/:itemId", toggleItem);

module.exports = router;