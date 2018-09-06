const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const SALT = 10;

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, set: toLower },
    realName: { type: String, required: true },
    role: { type: String, default: "user" },
    cart: [{
        item: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
        quantity: { type: Number, default: 1 }
    }],
    activated: { type: Boolean, default: false },
    activationToken: { type: String },
    lostPassToken: { type: String },
    deleteAccountToken: { type: String },
    changeEmail: { token: { type: String }, newEmail: { type: String } }
},
    { timestamps: true }
);

userSchema.pre("save", function (next) {
    const user = this;

    if (!user.isModified("password")) { return next(); }

    bcrypt.hash(user.password, SALT)
        .then((hashed) => {
            user.password = hashed;
            return next();
        })
        .catch((err) => {
            console.error(err);
            return next(err);
        });
});

/**
 * Compare user input password to the hashed passwrod in database
 * @param {string} password - unhashed user input password
 * @param {string} next - callback(err, isMatch boolean)
 */
userSchema.methods.comparePassword = function (password, next) {
    bcrypt.compare(password, this.password)
        .then((isMatch) => {
            return next(null, isMatch);
        })
        .catch((err) => {
            console.error(err);
            return next(err);
        });
};

/**
 * Makes string lowercase, used for saving emails
 * @param {string} str
 */
function toLower(str) {
    return str.toLowerCase();
}

module.exports = mongoose.model("User", userSchema);