const express = require("express");
const router = express.Router();
const locationController = require("../controller/locationController");
const verifyToken = require("../Middleware/verifyToken");

router.post("/save", verifyToken, locationController.saveLocation);
router.get("/", verifyToken, locationController.getLocation);
router.get("/:userId", verifyToken, locationController.getLocationByUserId);

module.exports = router;
