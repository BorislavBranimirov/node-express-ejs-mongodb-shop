const express = require("express");
const randomstring = require("randomstring");
const router = express.Router();

const { History } = require("../models");
const { User } = require("../models");
const { mail } = require("../mailer");

module.exports = (passport) => {
    router.route("/cart")
        .get(require('permission')(),
            (req, res, next) => {
                User.findById(req.user._id)
                    .populate("cart.item")
                    .exec(function (err, user) {
                        if (err) return next(err);
                        res.render("cart", { msg: req.flash("cartMessage"), itemObjectArray: user.cart });
                    });
            })
        .delete(require('permission')(),
            (req, res, next) => {
                User.findById(req.user._id, (err,user) => {
                    user.cart.splice(0, user.cart.length);
                    user.save();
                    res.redirect("back");
                });
            });

    router.route("/checkout")
        .patch(require('permission')(),
            (req, res, next) => {
                User.findById(req.user._id)
                    .populate("cart.item", { itemName: 1, inStock: 1 })
                    .exec(function (err, user) {
                        if (err) return next(err);

                        //array of sent item names + quantity
                        let itemObjectArray = [];
                        //array of not send out of stock item names
                        let outOfStockitemArray = [];
                        for (let i = 0; i < user.cart.length; i++) {
                            if (user.cart[i].item.inStock) {
                                itemObjectArray.push({
                                    itemName: user.cart[i].item.itemName,
                                    quantity: user.cart[i].quantity
                                });
                            } else {
                                outOfStockitemArray.push(user.cart[i].item.itemName);
                            }
                        }

                        //if no items in cart or only ones that are out of stock - dont send order
                        if (itemObjectArray.length === 0) { 
                            req.flash("cartMessage", "No available items in cart.")
                            return res.redirect("back"); 
                        }

                        res.render("checkout", { 
                            msg: req.flash("checkoutMessage"),
                            sentItems: itemObjectArray,
                            outOfStockNames: outOfStockitemArray 
                        });

                        mail.checkoutMail(user.email, itemObjectArray, outOfStockitemArray)
                            .catch(err => console.error(err));

                        History.findOne({_userId: req.user._id}, (err, history) => {
                            if (err) return next(err);

                            //if user has previous orders, else - hasn't made previous orders
                            if (history) {
                                history.orders.push({
                                    items: itemObjectArray
                                });
                                history.save();
                            } else {
                                History.create({ _userId: req.user._id })
                                    .then((history) => {
                                        history.orders.push({
                                            items: itemObjectArray
                                        });
                                        history.save();
                                    })
                                    .catch((err) => {
                                        console.error(err);
                                        return next(err);
                                    })
                            }
                        })

                        user.cart.splice(0, user.cart.length);
                        user.save();
                    });
            });
    
    router.route("/removeItem")
        .delete(require('permission')(),
            (req, res, next) => {
                User.findById(req.user._id, (err, user) => {
                    if (err) return next(err);
                    for (let i = 0; i < user.cart.length; i++) {
                        if(user.cart[i].item._id.equals(req.body.itemId)) {
                            user.cart.splice(i, 1);
                            break;
                        }
                    }
                    user.save();
                    res.redirect("cart");
                });
            });

    router.route("/changeEmail")
        .get(require('permission')(),
            (req, res, next) => {
                res.render("sendEmail", { 
                    msg: req.flash("changeEmailMessage"),
                    text: "Enter the email you wish to change to.",
                    path: "/user/changeEmail?_method=patch" 
                });
            })
        .patch(require('permission')(),
            (req, res, next) => {
                User.findById(req.user._id, (err, user) => {
                    if (err) return next(err);

                    if (user) {
                        user.changeEmail.token = randomstring.generate(20);
                        user.changeEmail.newEmail = req.body.email;
                        user.save((err) => {
                            if (err) return next(err);

                            mail.changeEmailsToNewMail(user.changeEmail.newEmail, user.username, user.changeEmail.token)
                                .catch(err => console.error(err));

                            mail.changeEmailsToOldMail(user.email, user.username)
                                .catch(err => console.error(err));

                            req.flash("verifyChangeEmailMessage", "Input code from your new email to confirm change.");
                            res.redirect("/user/verify/changeEmail");
                        });
                    } else {
                        res.status(500);
                        return next("Couldn't find user with from session in database");
                    }
                });
            });

    router.route("/verify/changeEmail")
        .get(require('permission')(),
            (req, res, next) => {
                res.render("verifyCode", {
                    msg: req.flash("verifyChangeEmailMessage"),
                    path: "/user/verify/changeEmail?_method=patch",
                    text: "Enter the code from your email below to update with new email."
                });
            })
        .patch(require('permission')(),
            (req, res, next) => {
                User.findOne({"changeEmail.token": req.body.code}, (err, user) => {
                    if (err) return next(err);

                    if(user) {
                        let oldEmail = user.email;

                        user.email = user.changeEmail.newEmail;
                        user.changeEmail = undefined;
                        user.save((err) => {
                            if (err) return next(err);

                            mail.emailsChangedToNewMail(user.email, user.username)
                                .catch(err => console.error(err));

                            mail.emailsChangedToOldMail(oldEmail, user.username)
                                .catch(err => console.error(err));

                            req.flash("loginMessage", "Email updated successfully");
                            res.redirect("/login");
                        });
                    } else {
                        req.flash("verifyChangeEmailMessage", "Incorrect code");
                        res.redirect("back");
                    }
                });
            });


    router.route("/deactivate")
        .patch(require('permission')(),
            (req, res, next) => {
                User.findById(req.user._id, (err, user) => {
                    if (err) return next(err);

                    user.activated = false;
                    user.save((err) => {
                        if (err) { return next(err); }

                        mail.accountDeactivatedMail(user.email, user.username)
                            .catch(err => console.error(err));

                        req.logout();
    
                        req.flash("loginMessage", "Account successfully deactivated");
                        res.redirect("/login");
                    });
                });  
            });

    router.route("/delete")
        .patch(require('permission')(),
            (req, res, next) => {
                User.findById(req.user._id, (err, user) => {
                    if (err) return next(err);

                    user.deleteAccountToken = randomstring.generate(20);
                    user.save((err) => {
                        if (err) return next(err);
                        
                        mail.deleteAccountMail(user.email, user.username, user.deleteAccountToken)
                            .catch(err => console.error(err));

                        req.flash("deleteAccMessage", "Email has been sent to confirm account deletion.");
                        res.redirect("verify/delete");
                    });
                });  
            });

    router.route("/verify/delete")
        .get(require('permission')(),
            (req, res, next) => {
                res.render("verifyCode", {
                    msg: req.flash("deleteAccMessage"),
                    path: "/user/verify/delete?_method=delete",
                    text: "Enter the deletion code from your email below.(Be careful, there is no way to undo this operation!)"
                });
            })
        .delete(require('permission')(),
            (req, res, next) => {
                let email = req.user.email;
                let username = req.user.username;

                User.findOneAndRemove({ $and: [{ _id: req.user._id}, { deleteAccountToken: req.body.code}] }, (err , user) => {
                    if (err) return next(err);
                    if (user) {
                        mail.accountDeletedMail(email, username)
                            .catch(err => console.error(err));

                        req.flash("loginMessage", "Account successfully deleted");
                        res.redirect("/login");
                    } else {
                        req.flash("deleteAccMessage", "Incorrect code");
                        res.redirect("back");
                    }
                });
            });

    router.route("/changePass")
        .get(require('permission')(),
            (req, res, next) => {
                res.render("changePass", {
                    msg: req.flash("changePassMessage"),
                    //need to specify array element for flash to use object properly
                    formData: req.flash("formDataPass")[0]
                });
            })
        .patch(require('permission')(),
            (req, res, next) => {
                User.findById(req.user._id, (err, user) => {
                    if (err) { return next(err); }
                    user.comparePassword(req.body.oldPassword, (err, isMatch) => {
                        if (err) { return next(err); }
                        if (isMatch) {
                            //if new pass and reentered pass dont match
                            if (req.body.newPassword !== req.body.newPassword2) {
                                req.flash("formDataPass", req.body);
                                req.flash("changePassMessage", "Passwords don't match");
                                res.redirect("changePass");
                            } else {
                                //if new pass is the same as old pass
                                if (req.body.oldPassword === req.body.newPassword) {
                                    req.flash("formDataPass", req.body);
                                    req.flash("changePassMessage", "You already have this password");
                                    res.redirect("changePass");
                                } else {
                                    //accepted new pass
                                    user.password = req.body.newPassword;
                                    user.save((err) => {
                                        if (err) return next(err);

                                        mail.passwordChangedMail(user.email, user.username)
                                            .catch(err => console.error(err));

                                        res.redirect(req.user.username);
                                    });
                                }
                            }
                        } else {
                            //dont re-enter the old pass if its wrong
                            req.flash("formDataPass", {oldPassword: ""});
                            req.flash("changePassMessage", "Wrong old password");
                            res.redirect("changePass");
                        }
                    });
                });
            });

    router.route("/changeName")
        .get(require('permission')(),
            (req, res, next) => {
                res.render("changeName", { msg: req.flash("changeNameMessage") });
            })
        .patch(require('permission')(),
            (req, res, next) => {
                if (req.user.realName === req.body.realName) {
                    req.flash("changeNameMessage", "You already have this name");
                    res.redirect("changeName");
                } else {
                    User.findById(req.user._id, (err, user) => {
                        if (err) { return next(err); }
                        
                        user.realName = req.body.realName;
                        user.save((err) => {
                            if (err) return next(err);

                            mail.nameChangedMail(user.email, user.username, user.realName)
                                .catch(err => console.error(err));
                            
                            res.redirect(req.user.username);
                        });
                    });
                }
            });

    router.route("/logout")
        .post(require('permission')(),
            (req, res, next) => {
                req.logout();
                res.redirect("/");
            });

    router.route("/:username")
        .get(require('permission')(),
            (req, res, next) => {
                //check if there's already a user with this username regardless of capitalisation
                var regex = new RegExp(["^", req.params.username, "$"].join(""), "i");

                //if the currently logged in user use profile.ejs
                //if the user exists but is not the one logged in load with notLoggedUser.ejs
                if (regex.test(req.user.username)) {
                    res.render("profile", { msg: req.flash("accountMessage") });
                } else {
                    User.findOne({ username: regex }, (err, user) => {
                        if (err) { return next(err); }
                        if (!user) {
                            res.status(404);
                            return next(new Error("Profile not registered"));
                        }
                        res.render("notLoggedUser", {
                            msg: req.flash("notLoggedAccountMessage"),
                            username: user.username,
                            realName: user.realName
                        });
                    })
                }
            });

    router.route("/:username/pastOrders")
        .get(require('permission')(),
            (req, res, next) => {
                //check if there's already a user with this username regardless of capitalisation
                var regex = new RegExp(["^", req.params.username, "$"].join(""), "i");

                if (regex.test(req.user.username)) {
                    History.findOne({ _userId: req.user._id }, (err, history) => {
                        if (err) return next(err);

                        //if user has previous orders
                        if (history) {
                            res.render("pastOrders", { history: history, msg: req.flash("userOrdersMessage") });
                        } else {
                            //if user hasn't made previous orders
                            //pass empty history object if one doesn't exist
                            res.render("pastOrders", { history: {}, msg: req.flash("userOrdersMessage") });
                        }
                    })
                } else {
                    res.redirect("back");
                }
            });

    return router;
}