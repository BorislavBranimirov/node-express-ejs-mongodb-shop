const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
    _userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    orders: [{
        date: { type: Date, default: Date.now },
        items: [{
            itemName: String,
            quantity: Number
        }],
    }]
});

module.exports = mongoose.model("History", historySchema);