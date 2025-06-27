const Menu = require("../model/Menu");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// GET all menu categories
exports.getAllMenus = async (req, res) => {
  try {
    const menus = await Menu.find();
    res.status(200).json(menus);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch menus", error: err.message });
  }
};

// POST create new category
exports.createCategory = async (req, res) => {
  try {
    if (req.uploadError) {
      return res.status(400).json({ success: false, message: req.uploadError });
    }
    const { name, categoryType } = req.body;

    console.log("req.body", req.body)

    if (!categoryType || !["Veg", "Non-Veg"].includes(categoryType)) {
      return res.status(400).json({ message: "Invalid or missing categoryType. Must be 'Veg' or 'Non-Veg'." });
    }

    
    const filePath = req.files.image[0].path;

    const result = await cloudinary.uploader.upload(filePath, {
      folder: "categories",
    });

    fs.unlinkSync(filePath);

    const newCategory = new Menu({
      name,
      categoryType,
      cateimage: result.secure_url,
      items: [],
    });

    await newCategory.save();
    res.status(201).json({ message: "Category created", data: newCategory });
  } catch (err) {
    res.status(500).json({ message: "Failed to create category", error: err.message });
  }
};


exports.updateCategoryById = async (req, res) => {
  try {
    if (req.uploadError) {
      return res.status(400).json({ success: false, message: req.uploadError });
    }

    const { id, name, categoryType } = req.body;

    // Validate category type
    if (categoryType && !["Veg", "Non-Veg"].includes(categoryType)) {
      return res.status(400).json({
        message: "Invalid categoryType. Must be 'Veg' or 'Non-Veg'.",
      });
    }

    // Fetch the category
    const category = await Menu.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // If a new image is uploaded
    if (req.files && req.files.image && req.files.image.length > 0) {
      const filePath = req.files.image[0].path;

      // Extract public_id from old Cloudinary URL (cateimage)
      const oldUrl = category.cateimage;
      console.log("oldUrl", oldUrl)
      //https://res.cloudinary.com/ducfodlsa/image/upload/v1750786170/categories/jg9wtzbjnv9kxb9zk7ua.png
      const publicIdMatch = oldUrl.match(/\/([^/]+)\.[a-z]+$/i); // Extract file name without extension
     console.log("publicIdMatch", publicIdMatch)
      const publicId = publicIdMatch ? `categories/${publicIdMatch[1]}` : null;
console.log("publicId", publicId)
      // Delete old image from Cloudinary
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }

      // Upload new image to Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "categories",
      });

      // Delete local temp file
      fs.unlinkSync(filePath);

      // Update category image URL
      category.cateimage = result.secure_url;
    }

    // Update fields
    if (name) category.name = name;
    if (categoryType) category.categoryType = categoryType;

    // Save updates
    await category.save();

    res.status(200).json({ message: "Category updated", data: category });

  } catch (err) {
    res.status(500).json({ message: "Failed to update category", error: err.message });
  }
};


exports.addItemToCategory = async (req, res) => {
  try {
    const { categoryId, itemName, itemCost } = req.body;

    if (req.uploadError) {
      return res.status(400).json({ success: false, message: req.uploadError });
    }

    const category = await Menu.findById(categoryId);
    if (!category)
      return res.status(404).json({ success: false, message: "Category not found" });

    const filePath = req.files.image?.[0]?.path;

    let imageUrl = "";
    if (filePath) {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "menuItems",
      });
      fs.unlinkSync(filePath);
      imageUrl = result.secure_url;
    }

    const newItem = {
      itemName,
      itemCost,
      image: imageUrl,
    };

    category.items.push(newItem);

    await category.save();

    return res.status(200).json({ success: true, data: newItem });
  } catch (error) {
    console.error("Add Item Error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
};



exports.getById = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Menu.findById(id);
    if (category) return res.status(200).json({ type: "category", data: category });

    const menus = await Menu.find();
    for (const menu of menus) {
      const item = menu.items.id(id);
      if (item) {
        return res.status(200).json({ type: "item", data: item, categoryId: menu._id });
      }
    }

    res.status(404).json({ message: "Category or item not found" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// PUT update item
exports.updateItemById = async (req, res) => {
  const { categoryId, itemId } = req.params;
  const { itemName, itemCost, isEnabled, imageBase64 } = req.body;

  try {
    const category = await Menu.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const item = category.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (itemName !== undefined) item.itemName = itemName;
    if (itemCost !== undefined) item.itemCost = itemCost;
    if (isEnabled !== undefined) item.isEnabled = isEnabled;

    if (imageBase64) {
      const upload = await cloudinary.uploader.upload(imageBase64, { folder: "menu_items" });
      item.image = upload.secure_url;
    }

    await category.save();
    res.status(200).json({ message: "Item updated", data: item });
  } catch (error) {
    res.status(500).json({ message: "Item update failed", error: error.message });
  }
};

// DELETE category
exports.deleteCategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Menu.findById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    await Menu.findByIdAndDelete(id);
    res.status(200).json({ message: "Category and its items deleted" });
  } catch (error) {
    res.status(500).json({ message: "Category deletion failed", error: error.message });
  }
};

// DELETE item
exports.deleteItemById = async (req, res) => {
  const { categoryId, itemId } = req.params;

  try {
    const category = await Menu.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const item = category.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    category.items = category.items.filter(i => i._id.toString() !== itemId);
    await category.save();

    res.status(200).json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ message: "Item deletion failed", error: error.message });
  }
};

