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
    const {userId} = req.params;
    const user = await User.findOne({userId});
    if (!user) {
    
      return res.status(403).json({ message: "User Not Found" });
    }
     const location = await Location.findOne({ userId: userId.toString() });
    
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.status(200).json({ location });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

