const express = require("express");
const { saveCart, getCart } = require("../controller/cartController");

const router = express.Router();

router.post("/cart/save", saveCart);
router.get("/:userId", getCart);

module.exports = router;
