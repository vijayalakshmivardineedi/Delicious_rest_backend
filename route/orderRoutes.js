const express = require("express");
const router = express.Router();
const { createOrder, getOrderById, getAllOrdersForAdmin, getOrderByUserId, cancleByUser, 
    adminStatusUpdate, getOrderInsightsByDate, getTodaysOrders, 
    getOrdersByDates
} = require("../controller/orderController");
const verifyToken = require("../Middleware/verifyToken");

//admins
router.get("/getAllOrders", getAllOrdersForAdmin);
router.get("/getOrdersByDates", getOrdersByDates);
router.get("/getTodaysOrders", getTodaysOrders);
router.post("/adminStatusUpdate/:orderId/:status", adminStatusUpdate)
router.get("/:orderId", getOrderById);
   
// users
router.post("/create", verifyToken, createOrder);
router.get("/:orderId",verifyToken, getOrderById);
router.get("/getOrderByUserId/:userId",verifyToken, getOrderByUserId);
router.post("/cancleByUser/:userId/:orderId",verifyToken, cancleByUser);


module.exports = router;