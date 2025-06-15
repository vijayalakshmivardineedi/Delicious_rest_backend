const User = require("../model/User");
const Location = require("../model/Location");

exports.saveLocation = async (req, res) => {
  try {
    const { address1, address2, city, postalCode, latitude, longitude, userId } = req.body;

    if (!address1 || !city || !postalCode || !latitude || !longitude || !userId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findOne({userId});

    if (!user) {
      return res.status(404).json({ message: "User ID does not match any registered user." });
    }

    const newAddress = { address1, address2, city, postalCode, latitude, longitude };

    const location = await Location.findOneAndUpdate(
      { userId },
      { $push: { address: newAddress } },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Location saved successfully", location });
  } catch (err) {
    res.status(500).json({ message: "Failed to save location", error: err.message });
  }
};


exports.getLocation = async (req, res) => {
  try {
    const userIdFromToken = req.user.id;

    const user = await User.findOne({ userId: userIdFromToken });
    if (!user) return res.status(404).json({ message: "User not found" });

    const location = await Location.findOne({ userId: userIdFromToken });

    if (!location) return res.status(404).json({ message: "Location not found" });

    res.json({ location });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch location", error: err.message });
  }
};

exports.getLocationByUserId = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token userId matches requested userId
    if (decoded.userId !== req.params.userId) {
      return res.status(403).json({ message: "User ID mismatch" });
    }

    const user = await User.findOne({ userId: req.params.userId });
    if (!user || user.phoneNumber !== decoded.phoneNumber) {
      return res.status(403).json({ message: "Phone number mismatch" });
    }

    const location = await Location.findOne({ userId: req.params.userId });
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }

    res.status(200).json({ location });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

