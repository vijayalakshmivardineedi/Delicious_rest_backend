const express = require("express");
const { saveCart, getCart, updateCart, deleteCart } = require("../controller/cartController");

const router = express.Router();

router.post("/cart/save", saveCart);
router.put("/updateCart", updateCart);
router.get("/getCart/:userId", getCart);
router.delete("/deleteCart/:userId", deleteCart);

module.exports = router;