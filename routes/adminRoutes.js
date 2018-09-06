const express = require("express");
const router = express.Router();

const { History } = require("../models");
const { Item } = require("../models");
const { User } = require("../models");

module.exports = (passport) => {
    router.route("/add")
        .get(require('permission')(['admin']),
            (req, res, next) => {
                res.render("addItem", {
                    msg: req.flash("itemAddMessage"),
                    //need to specify array element for flash to use req.flash object properly
                    formData: req.flash("formDataItem")[0]
                });
            })
        .post(require('permission')(['admin']),
            (req, res, next) => {
                //check if there's already an item with this itemName regardless of capitalisation
                var regex = new RegExp(["^", req.body.itemName, "$"].join(""), "i");

                Item.findOne({ itemName: regex }, (err, item) => {
                    if (err) { return next(err); }
                    if (item) {
                        //refill with current user input after page reload
                        req.flash("formDataItem", req.body);
                        req.flash("itemAddMessage", "Item already exists");
                        res.redirect("back");
                    } else {
                        let obj = Object.assign({}, req.body);
                        //item schema price expects a number
                        obj.price = Number(obj.price);
                        Item.create(obj)
                            .then(() => {
                                res.redirect("back");
                            })
                            .catch((err) => {
                                console.error(err);
                                return next(err);
                            });
                    }
                });
            });

    router.route("/edit")
        .get(require('permission')(['admin']),
            (req, res, next) => {
                Item.find({}, (err, items)  => {
                    if (err) { return next(err); }
                    res.render("editItem", {
                        msg: req.flash("itemEditMessage"),
                        //need to specify array element for flash to use req.flash object properly
                        formData: req.flash("formDataItem")[0],
                        itemArray: items
                    });
                });
            })
        .patch(require('permission')(['admin']),
            (req, res, next) => {
                //check if there's already an item with this itemName regardless of capitalisation
                var regex = new RegExp(["^", req.body.itemName, "$"].join(""), "i");

                let obj = Object.assign({}, req.body);
                //item schema price expects a number
                obj.price = Number(obj.price);
                //item schema inStock expects a bool
                //if checkbox checked - return true
                //otherwise it's not set in req.body - return false
                if (req.body.inStock) {
                    obj.inStock = true;
                } else {
                    obj.inStock = false;
                }

                Item.findOneAndUpdate({ itemName: regex }, obj, (err, item) => {
                    if (err) { return next(err); }
                    if (!item) {
                        //refill with current user input after page reload
                        req.flash("formDataItem", req.body);
                        req.flash("itemEditMessage", "Item doesn't exist");
                    }
                        res.redirect("back");
                });
            })
        .delete(require('permission')(['admin']),
            (req, res, next) => {
                //check if there's already an item with this itemName regardless of capitalisation
                var regex = new RegExp(["^", req.body.deleteItemName, "$"].join(""), "i");

                let obj = Object.assign({}, req.body);
                //item schema price expects a number
                obj.price = Number(obj.price);

                Item.findOneAndRemove({ itemName: regex }, (err, item) => {
                    if (err) { return next(err); }
                    if (!item) {
                        req.flash("itemEditMessage", "Item doesn't exist");
                        res.redirect("back");
                    } else {
                        //if item was found, query all users and remove the item from their carts
                        User.find({ cart: { $exists: 1, $not: { $size: 0 } } }, (err, users) => {
                            if (err) return next(err);
                            //loop through all users
                            for (let i = 0; i < users.length; i++) {
                                //loop through all items in a user's cart
                                for (let j = 0; j < users[i].cart.length; j++) {
                                    //if the object id in the cart is equal to the removed item's id, remove it
                                    if (users[i].cart[j].item.equals(item._id)) {
                                        users[i].cart.splice(j, 1);
                                        users[i].save();
                                    }
                                }
                            }
                        });
                        res.redirect("back");
                    }
                });
            });

    router.route("/orders")
        .get(require('permission')(['admin']),
            (req, res, next) => {
                History.find({}, (err, histories) => {
                    if (err) { return next(err); }
                    res.render("allOrders", { 
                        histories: histories,
                        msg: req.flash("allOrdersMessage")
                    });
                })
            });

    return router;
}