const express = require("express");
const { saveCart, getCart, updateCart, deleteCart } = require("../controller/cartController");

const router = express.Router();

router.post("/cart/save", saveCart);
router.put("/updateCart", updateCart);
router.get("/getCart/:userId", getCart);
router.get("/deleteCart", deleteCart);

module.exports = router;
