const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    description: String,
    price: { type: Number, required: true, set: setPrice, get: getPrice },
    pricePer: { type: String, required: true, set: setPricePer },
    inStock: { type: Boolean, default: true }
}, {
        toObject: {
            virtuals: true
        },
        toJSON: {
            virtuals: true
        }
    });


itemSchema.virtual("fullPrice")
    .get(function () {
        return this.price.toFixed(2) + this.pricePer + " USD";
    });

/**
 * Multiplies number by 100 before saving in database
 * @param {number} priceNumber
 */
function setPrice(priceNumber) {
    //just *100 can give unexpected results like 4.02 => 401.99999999
    //so round it with fixed => 402 (which returns a string so convert back to number)
    return Number((priceNumber * 100).toFixed(0));
};

/**
 * Divides number by 100 before getting from database
 * @param {number} priceNumber
 */
function getPrice(priceNumber) {
    return priceNumber / 100;
};

/**
 * Prefixes slash to price unit before saving to database 
 * @param {number} per - "each", "kg" or "litre"
 * @returns {string} "/" + per unit 
 */
function setPricePer(per) {
    return "/" + per;
};


module.exports = mongoose.model("Item", itemSchema);