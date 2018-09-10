const express = require("express");
const randomstring = require("randomstring");
const router = express.Router();

const { Item } = require("../models");
const { User } = require("../models");
const { mail } = require("../mailer");
const { helperFunctions } = require("../lib");

module.exports = function (passport) {
    router.route("/")
        .get((req, res, next) => {
            res.render("homePage", {
                msg: req.flash("homePageMessage"),
                //req.user undefined if user not logged in
                user: req.user
            });
        });

    router.route("/register")
        .get((req, res, next) => {
            if (req.isAuthenticated()) {
                res.redirect("/user/" + req.user.username);
            } else {
                res.render("register", {
                    msg: req.flash("registerMessage"),
                    //need to specify array element for flash to use object properly
                    formData: req.flash("formDataReg")[0]
                });
            }
        })
        .post((req, res, next) => {
            //check if there's already a user with this name/email regardless of capitalisation
            let regexName = new RegExp(["^", req.body.username, "$"].join(""), "i");
            let regexEmail = new RegExp(["^", req.body.email, "$"].join(""), "i");

            User.find({ $or: [{ username: regexName }, { email: regexEmail }] }, (err, users) => {
                if (err) { return next(err); }
                if (users.length === 0) {
                    let obj = Object.assign({}, req.body);
                    obj.activationToken = randomstring.generate(20);

                    User.create(obj)
                        .then((user) => {
                            let activateURL = req.protocol+"://"+req.get('Host')+"/verify/activate";
                            mail.activateAccountMail(obj.email, user.username, user.activationTokenm, activateURL)
                                .catch(err => console.error(err));

                            req.flash("verifyActivationMessage", "Activate your account with the code from your email to log in")
                            res.redirect("/verify/activate");
                        })
                        .catch((err) => {
                            console.error(err);
                            return next(err);
                        });
                } else {
                    for (let i = 0; i < users.length; i++) {
                        if (regexName.test(users[i].username)) {
                            //refill old req.body info after redirect
                            req.flash("registerMessage", "User already exists");
                        }
                        if (regexEmail.test(users[i].email)) {
                            //refill old req.body info after redirect
                            req.flash("registerMessage", "A user already has this email. Choose a different email");
                        }
                    }
                    req.flash("formDataReg", req.body);
                    res.redirect("/register");
                }
            });
        });

    router.route("/login")
        .get((req, res, next) => {
            if (req.isAuthenticated()) {
                res.redirect("/user/" + req.user.username);
            } else {
                res.render("login", {
                    msg: req.flash("loginMessage")
                });
            }
        })
        .post(passport.authenticate("login", {
            failureRedirect: "/login",
            failureFlash: true
        }), (req, res, next) => {
            res.redirect("/user/" + req.user.username);
        });

    router.route("/verify/activate")
        .get((req, res, next) => {
            res.render("verifyCode", {
                msg: req.flash("verifyActivationMessage"),
                path: "/verify/activate?_method=patch",
                text: "Enter the activation code from your email below.",
            });
        })
        .patch((req, res, next) => {
            User.findOne({ activationToken: req.body.code }, (err, user) => {
                if (err) { return next(err); }
                if (user) {
                    user.activated = true;
                    user.activationToken = undefined;
                    user.save();
                    req.flash("loginMessage", "Account activated")
                    res.redirect("/login");
                } else {
                    req.flash("verifyActivationMessage", "Incorrect code");
                    res.redirect("back");
                }
            });
        });

    router.route("/reactivateAccount")
        .get((req, res, next) => {
            res.render("sendEmail", {
                msg: req.flash("reactivateAccMessage"),
                text: "Enter the email connected to your unactivated account.",
                path: "/reactivateAccount?_method=patch"
            });
        })
        .patch((req, res, next) => {
            //check if there's already a user with this email regardless of capitalisation
            let regex = new RegExp(["^", req.body.email, "$"].join(""), "i");

            User.findOne({ email: regex }, (err, user) => {
                if (err) { return next(err); }
                if (user) {
                    if (user.activated) {
                        req.flash("reactivateAccMessage", "Account already active");
                        res.redirect("back");
                    } else {
                        user.activationToken = randomstring.generate(20);
                        user.save((err) => {
                            if (err) { return next(err); }

                            let activateURL = req.protocol+"://"+req.get('Host')+"/verify/activate";
                            mail.activateAccountMail(user.email, user.username, user.activationToken, activateURL)
                                .catch(err => console.error(err));

                            req.flash("verifyActivationMessage", "Activate your account with the code from the email");
                            res.redirect("/verify/activate");
                        });
                    }
                } else {
                    req.flash("reactivateAccMessage", "Incorrect email");
                    res.redirect("back");
                }
            });
        });

    router.route("/forgottenPassword")
        .get((req, res, next) => {
            res.render("sendEmail", {
                msg: req.flash("resetPassEmailMessage"),
                text: "Enter the email of the account whose password you want to reset.",
                path: "/forgottenPassword?_method=patch"
            });
        })
        .patch((req, res, next) => {
            //check if there's already a user with this email regardless of capitalisation
            let regex = new RegExp(["^", req.body.email, "$"].join(""), "i");

            User.findOne({ email: regex }, (err, user) => {
                if (err) { return next(err); }
                if (user) {
                    user.lostPassToken = randomstring.generate(20);
                    user.save((err) => {
                        if (err) { return next(err); }

                        let activateURL = req.protocol+"://"+req.get('Host')+"/verify/passwordReset";
                        mail.resetPasswordMail(user.email, user.username, user.lostPassToken, activateURL)
                            .catch(err => console.error(err));

                        req.flash("resetPasswordMessage", "Activate your account with the code from the email");
                        res.redirect("/verify/passwordReset");
                    });
                } else {
                    req.flash("resetPassEmailMessage", "Incorrect email");
                    res.redirect("back");
                }
            });
        });

    router.route("/verify/passwordReset")
        .get((req, res, next) => {
            res.render("verifyPassword", { msg: req.flash("resetPasswordMessage") });
        })
        .patch((req, res, next) => {
            User.findOne({ lostPassToken: req.body.code }, (err, user) => {
                if (err) { return next(err); }
                if (user) {
                    //if new pass and reentered pass dont match
                    if (req.body.newPassword !== req.body.newPassword2) {
                        req.flash("resetPasswordMessage", "Passwords don't match");
                        res.redirect("back");
                    } else {
                        user.comparePassword(req.body.newPassword, (err, isMatch) => {
                            if (err) { return next(err); }
                            //if new pass is the same as old pass
                            if (isMatch) {
                                req.flash("resetPasswordMessage", "You already have this password");
                                res.redirect("back");
                            } else {
                                //accepted new pass
                                user.password = req.body.newPassword;
                                user.lostPassToken = undefined;
                                user.save((err) => {
                                    if (err) return next(err);

                                    mail.passwordChangedMail(user.email, user.username)
                                        .catch(err => console.error(err));

                                    req.flash("loginMessage", "Password reset")
                                    res.redirect("/login");
                                });
                            }
                        });
                    }
                } else {
                    req.flash("resetPasswordMessage", "Incorrect code");
                    res.redirect("back");
                }
            });
        });

    router.route("/about")
        .get((req, res, next) => {
            res.render("about", { msg: req.flash("aboutMessage") });
        });

    router.route("/contact")
        .get((req, res, next) => {
            res.render("contact", { msg: req.flash("contactMessage") });
        })
        .post((req, res, next) => {
            mail.contactMail(req.body.realName, req.body.email, req.body.subject, req.body.message)
                .catch(err => console.error(err));

            res.redirect("back");
        });

    router.route("/itempage")
        .get((req, res, next) => {
            Item.find({}, (err, items) => {
                if (err) { return next(err); }

                //default values to use if some filter is not set or not correct type
                let defaults = {
                    page: 1,
                    count: 4,
                    priceMin: 0,
                    priceMax: 20,
                    search: ""
                }

                //number of items per page
                let count = parseInt(req.query.count) || defaults.count;

                //current page
                let page = parseInt(req.query.page) || defaults.page;

                //starting index in item array
                let startingIndex = (page-1)*count;

                //minimum price value for filtered items
                let priceMin = Number(req.query.priceMin) || defaults.priceMin;

                //maximum price value for filtered items
                let priceMax = Number(req.query.priceMax) || defaults.priceMax;

                //search item regardless of capitalisation
                //but pass the normal search string back to ejs
                let search = req.query.search || defaults.search
                let searchRegex = new RegExp([req.query.search].join(""), "i");

                //filter items array
                items = items.filter((item) => {
                    return (item.price >= priceMin && item.price <= priceMax && searchRegex.test(item.itemName)) 
                });

                //max number of pages there can be with the set count query
                let numberOfPages = Math.ceil(items.length/count);

                //get items only for current page
                items = items.slice(startingIndex, startingIndex + count);


                //filter info to fill html page's filter inputs
                let filterObject = {
                    page: page,
                    search: search,
                    count: count,
                    priceMin: priceMin,
                    priceMax: priceMax
                }

                //set a query string - path+queries (!!for use in ejs file!!)
                let queryString="/itempage?";
                for (let property in filterObject) {
                    if (filterObject.hasOwnProperty(property)) {
                        queryString += property + "=" + filterObject[property] + "&"
                    }
                }
                queryString=queryString.slice(0, -1);

                //pages array to use for pagination
                //second parameter is the max number of pages in pagination
                let pagesArray = helperFunctions.getPagesArray(page, 9, numberOfPages);

                res.render("itemPage", {
                    msg: req.flash("itemMessage"),
                    itemArray: items,
                    filterObject: filterObject,
                    defaults: defaults,
                    numberOfPages: numberOfPages,
                    queryString: queryString,
                    pagesArray: pagesArray
                });
            });
        });

    router.route("/item/:itemId/:itemName")
        .get((req, res, next) => {
            Item.findById(req.params.itemId, (err, item) => {
                if (err) { return next(err); }
                if (!item) {
                    res.status(404);
                    return next(new Error("Item not found"));
                }
                res.render("item", { msg: req.flash("itemMessage"), item: item });
            });
        })
        .patch(require('permission')(),
            (req, res, next) => {
                //adding to cart
                Item.findById(req.params.itemId, (err, item) => {
                    if (err) { return next(err); }
                    if (!item) {
                        res.status(404);
                        return next(new Error("Item not found"));
                    }
                    User.findById(req.user._id, (err, user) => {
                        if (err) { return next(err); }
                        let itemIndex = user.cart.findIndex((element) => {
                            return element.item.equals(item._id);
                        });
                        if (itemIndex != -1) {
                            req.flash("itemMessage", "Item already in cart.");
                        } else {
                            user.cart.push({ item: item._id, quantity: req.body.quantity });
                            user.save();
                        }
                        res.redirect("back");
                    });
                });
            });

    router.route("/item/:itemId/:itemName/quantity")
        .patch(require('permission')(),
            (req, res, next) => {
                User.findById(req.user._id, (err, user) => {
                    if (err) return next(err);
                    for (let i = 0; i < user.cart.length; i++) {
                        if (user.cart[i].item._id.equals(req.params.itemId)) {
                            user.cart[i].quantity = req.body.quantity;
                            user.save();
                            res.redirect("back");
                        }
                    }
                });
            });

    router.route("/isUsernameAvailable")
        .get((req, res, next) => {
            //check if there's already a user with this name regardless of capitalisation
            let regex = new RegExp(["^", req.query.username, "$"].join(""), "i");

            User.findOne({ username: regex }, (err, user) => {
                if (err) return next(err);
                if (user) {
                    res.send("User already exists")
                } else {
                    res.send("Username available");
                }
            });
        })

    return router;
}