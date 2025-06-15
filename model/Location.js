const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  userId: { type: String, required: true  },
  address: [
    {
      address1: { type: String, required: true  },
      address2: { type: String, required: true  },
      city: { type: String, required: true },
      postalCode: { type: String, required: true  },
      latitude: { type: Number, required: true  },
      longitude: { type: Number, required: true  },
    }
  ]
});

module.exports = mongoose.model("Location", locationSchema);
