const Coupon = require("../model/Coupon");
const Order = require("../model/Order");
const User = require("../model/User");

function generate4DigitCouponId() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function isCouponIdUnique(couponId) {
  const existing = await Coupon.findOne({ couponId });
  return !existing;
}

async function generateUniqueCouponId() {
  for (let i = 0; i < 5; i++) {
    const newId = generate4DigitCouponId();
    if (await isCouponIdUnique(newId)) return newId;
  }
  throw new Error("Failed to generate unique couponId, try again");
}

exports.createCoupon = async (req, res) => {
  try {
    const couponId = await generateUniqueCouponId();

    const couponData = {
      ...req.body,
      couponId,
    };

    const coupon = new Coupon(couponData);
    await coupon.save();

    res.status(201).json({ message: "Coupon created", coupon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const updated = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ message: "Coupon updated", coupon: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: "Coupon deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.checkCouponAvailability = async (req, res) => {
  const { userId, id } = req.params;
  console.log(userId, id);

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const coupon = await Coupon.findById(id); // fix: use findById instead of findOne
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

    const orders = await Order.find({ userId });

    if (coupon.nthOrder === 1) {
      if (orders.length > 0) {
        return res
          .status(400)
          .json({ message: "Coupon is only valid for first-time orders" });
      }
    } else {
      // ✅ Handle your requested condition:
      if (orders.length <= 0) {
        return res
          .status(400)
          .json({ message: "Coupon not applicable. No past orders found." });
      }

      const deliveredOrders = orders.filter(
        (order) => order.status === "delivered"
      );

      if (deliveredOrders.length < coupon.nthOrder - 1) {
        return res.status(400).json({
          message: `Coupon is only valid on your ${coupon.nthOrder}th delivered order. You currently have ${deliveredOrders.length} delivered order(s).`,
        });
      }
    }

    res.status(200).json({
      message: "Coupon is available",
      coupon,
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: error.message });
  }
};
