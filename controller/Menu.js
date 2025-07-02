const Menu = require("../model/Menu");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

exports.getAllMenus = async (req, res) => {
  try {
    const menus = await Menu.find();
    if (menus.length === 0) {
      return res.status(404).json([]);
    }
    res.status(200).json(menus);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch menus", error: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    if (req.uploadError)
      return res.status(400).json({ message: req.uploadError });

    const { name, categoryType } = req.body;
    if (!categoryType || !["Veg", "Non-Veg"].includes(categoryType)) {
      return res.status(400).json({ message: "Invalid categoryType" });
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
    res.status(201).json(newCategory); // ✅ fix: return raw category
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create category", error: err.message });
  }
};

exports.updateCategoryById = async (req, res) => {
  try {
    if (req.uploadError) {
      return res.status(400).json({ success: false, message: req.uploadError });
    }

    const { id, name, categoryType } = req.body;
    if (categoryType && !["Veg", "Non-Veg"].includes(categoryType)) {
      return res.status(400).json({
        message: "Invalid categoryType. Must be 'Veg' or 'Non-Veg'.",
      });
    }

    const category = await Menu.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (req.files && req.files.image && req.files.image.length > 0) {
      const filePath = req.files.image[0].path;
      const oldUrl = category.cateimage;
      const publicIdMatch = oldUrl.match(/\/([^/]+)\.[a-z]+$/i);
      const publicId = publicIdMatch ? `categories/${publicIdMatch[1]}` : null;
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }

      const result = await cloudinary.uploader.upload(filePath, {
        folder: "categories",
      });
      fs.unlinkSync(filePath);
      category.cateimage = result.secure_url;
    }

    if (name) category.name = name;
    if (categoryType) category.categoryType = categoryType;

    await category.save();

    res.status(200).json({ message: "Category updated", data: category });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update category", error: err.message });
  }
};

exports.deleteCategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Menu.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const oldUrl = category.cateimage;
    const publicIdMatch = oldUrl.match(/\/([^/]+)\.[a-z]+$/i);
    const publicId = publicIdMatch ? `categories/${publicIdMatch[1]}` : null;
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    await Menu.findByIdAndDelete(id);
    res.status(200).json({ message: "Category and its items deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Category deletion failed", error: error.message });
  }
};

exports.addItemToCategory = async (req, res) => {
  try {
    const { categoryId, itemName, itemCost } = req.body;

    if (req.uploadError) {
      return res.status(400).json({ success: false, message: req.uploadError });
    }

    const category = await Menu.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    console.log("category", category);

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
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong." });
  }
};

exports.updateItemById = async (req, res) => {
  try {
    const { categoryId, itemId } = req.params;
    const { itemName, itemCost, isEnabled } = req.body;

    if (req.uploadError) {
      return res.status(400).json({ success: false, message: req.uploadError });
    }

    const category = await Menu.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const item = category.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in category" });
    }

    // If new image is uploaded
    if (req.files && req.files.image && req.files.image.length > 0) {
      const filePath = req.files.image[0].path;

      const oldUrl = item.image;
      const publicIdMatch = oldUrl.match(/\/([^/]+)\.[a-z]+$/i);
      const publicId = publicIdMatch ? `menuItems/${publicIdMatch[1]}` : null;

      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }

      const result = await cloudinary.uploader.upload(filePath, {
        folder: "menuItems",
      });

      fs.unlinkSync(filePath);
      item.image = result.secure_url;
    }

    if (itemName !== undefined) item.itemName = itemName;
    if (itemCost !== undefined) item.itemCost = itemCost;
    if (isEnabled !== undefined) item.isEnabled = isEnabled;

    await category.save();

    res.status(200).json({ message: "Item updated successfully", data: item });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Item update failed", error: error.message });
  }
};

exports.deleteItemById = async (req, res) => {
  const { categoryId, itemId } = req.params;

  try {
    const category = await Menu.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const item = category.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in category" });
    }

    const oldUrl = item.image;
    const publicIdMatch = oldUrl.match(/\/([^/]+)\.[a-z]+$/i);
    const publicId = publicIdMatch ? `menuItems/${publicIdMatch[1]}` : null;

    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    category.items = category.items.filter((i) => i._id.toString() !== itemId);
    await category.save();

    res.status(200).json({ message: "Item deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Item deletion failed", error: error.message });
  }
};

exports.getById = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Menu.findById(id);
    if (category)
      return res.status(200).json({ type: "category", data: category });

    const menus = await Menu.find();
    for (const menu of menus) {
      const item = menu.items.id(id);
      if (item) {
        return res
          .status(200)
          .json({ type: "item", data: item, categoryId: menu._id });
      }
    }

    res.status(404).json({ message: "Category or item not found" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.toggleCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Menu.findById(categoryId);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    category.isEnabled = !category.isEnabled;
    category.items.forEach((item) => {
      item.isEnabled = category.isEnabled;
    });

    await category.save();
    res.status(200).json({ message: "Category toggled", data: category });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error toggling category", error: error.message });
  }
};

exports.toggleItem = async (req, res) => {
  try {
    const { categoryId, itemId } = req.params;
    const category = await Menu.findById(categoryId);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const item = category.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.isEnabled = !item.isEnabled;
    await category.save();

    res.status(200).json({ message: "Item toggled", data: item });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error toggling item", error: error.message });
  }
};
