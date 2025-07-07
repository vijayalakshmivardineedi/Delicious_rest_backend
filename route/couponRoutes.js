const express = require("express");
const router = express.Router();
const {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  checkCouponAvailability,
} = require("../controller/couponController");

router.post("/create", createCoupon);
router.get("/checkCouponAvailability/:userId/:id", checkCouponAvailability);
router.get("/", getAllCoupons);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

module.exports = router;