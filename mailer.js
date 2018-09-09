const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});


exports.mail = {
    /**
     * Email to send to activate account
     * @param {string} receiverEmail
     * @param {string} username
     * @param {string} token - activation token
     * @param {string} activateURL - redirect URL to input confirmation code at
     */
    activateAccountMail: function (receiverEmail, username, token, activateURL) {
        return new Promise(function (resolve, reject) {
            transporter.sendMail({
                from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
                to: receiverEmail,
                subject: 'Confirm account activation',
                text: username + ",\nVisit: " + redirectURL + " and input the code: " +
                    token + " to activate your account.",
                html: username + ",<br>" + "<a href=\"" + redirectURL +"\">Redirect to activate account page</a><br> " +
                    "Input the code: <strong>" + token + "</strong> to activate your account."
            }, (err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
    },

    /**
     * Email to send on password change request
     * @param {string} receiverEmail
     * @param {string} username
     * @param {string} token - password reset token
     * @param {string} activateURL - redirect URL to input confirmation code at
     */
    resetPasswordMail: function (receiverEmail, username, token, activateURL) {
        return new Promise(function (resolve, reject) {
            transporter.sendMail({
                from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
                to: receiverEmail,
                subject: 'Request for password reset',
                text: username +
                    ",\nVisit: " + activateURL +" and input the code: " +
                    token + " to change your password.",
                html: username + ",<br>" +
                    "<a href=\"" + activateURL + "\">Redirect to reset password page</a><br> " +
                    "Input the code: <strong>" + token + "</strong> to change your password."
            }, (err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
    },

    /**
     * Email to send on password changed
     * @param {string} receiverEmail
     * @param {string} username
     */
    passwordChangedMail: function (receiverEmail, username) {
        return new Promise(function (resolve, reject) {
            transporter.sendMail({
                from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
                to: receiverEmail,
                subject: "Password changed",
                text: username +
                    ",\nYour password has been changed. " +
                    "If you were not the one to change it, contact support."
            }, (err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
    },

    /**
     * Email to send on account name changed
     * @param {string} receiverEmail
     * @param {string} username
     * @param {string} name - the new name
     */
    nameChangedMail: function (receiverEmail, username, name) {
        return new Promise(function (resolve, reject) {
            transporter.sendMail({
                from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
                to: receiverEmail,
                subject: "Name changed",
                text: username +
                    ",\nYour name has been changed to " + name +
                    ". If you were not the one to change it, contact support."
            }, (err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
    },

    /**
     * Contact site email
     * @param {string} name
     * @param {string} email - email of sender
     * @param {string} subject - email subject
     * @param {string} messageBody - email body
     */
    contactMail: function (name, email, subject, messageBody) {
        return new Promise(function (resolve, reject) {
            transporter.sendMail({
                from: "'Contact form' <" + process.env.EMAIL + ">",
                to: process.env.EMAIL,
                subject: subject,
                text: "name: " + name + "\nemail: " + email + "\nmessage: " + messageBody
            }, (err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
    },

    /**
     * Email to send on order sumbit
     * @param {string} receiverEmail
     * @param {Object[{itemName: string, quantity: number}]} sentItemObjectArray
     * @param {string[]} outOfOrderItemArray - array with not send item names
     * @param {string} messageBody - email body
     */
    checkoutMail: function (receiverEmail, sentItemObjectArray, outOfOrderItemArray) {
        let message = "The order you just send of: ";
        for (let i = 0; i < sentItemObjectArray.length - 1; i++) {
            message += sentItemObjectArray[i].itemName + " x" + sentItemObjectArray[i].quantity + ", "
        }
        message += sentItemObjectArray[sentItemObjectArray.length - 1].itemName +
            " x" + sentItemObjectArray[sentItemObjectArray.length - 1].quantity +
            " will be shipped to you in a week.";
        if(outOfOrderItemArray.length>0) {
            message += "\nThe following items were out of stock and not placed on the order: " + outOfOrderItemArray;
        }

        return new Promise(function (resolve, reject) {
            transporter.sendMail({
                from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
                to: receiverEmail,
                subject: 'Order has been successfully send',
                text: message
            }, (err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
    },

    /**
     * Emails to send on email change to the new email, use together with ToOld function
     * @param {string} newEmail
     * @param {string} username
     * @param {string} token - email change token
     * @param {string} activateURL - redirect URL to input confirmation code at
     */
    changeEmailsToNewMail: function (newEmail, username, token, activateURL) {
        return new Promise(function (resolve, reject) {
            transporter.sendMail({
                from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
                to: newEmail,
                subject: "Request for email change",
                text: username +
                    ",\nTo confirm change of email to this one go to " + activateURL +
                    " and input the code: " + token +
                    ".\nIf you were not the one to ask for the change, dont respond and delete this email.",
                html: username + ",<br>" +
                    "<a href=\"" + activateURL + "\">Redirect to change email page</a><br> " +
                    "Input the code: <strong>" + token + "</strong> to change your email to this one." +
                    " If you were not the one to ask for the change, dont respond and delete this email."
            }, (err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
    },

    /**
     * Emails to send on email change to to the old email, use together with ToNew function
     * @param {string} oldEmail
     * @param {string} username
     */
    changeEmailsToOldMail: function (oldEmail, username) {
        return new Promise(function (resolve, reject) {
            transporter.sendMail({
                from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
                to: oldEmail,
                subject: "Request for email change",
                text: username +
                    ",\nPer your request after confirmation your email will be changed to a new one." +
                    "\nIf you were not the one to ask for email change, contact support."
            }, (err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
    },

    /**
     * Emails to send on email changed to the new email, use together with ToOld function
     * @param {string} newEmail
     * @param {string} username
     */
    emailsChangedToNewMail: function (newEmail, username) {
        return new Promise(function (resolve, reject) {
            transporter.sendMail({
                from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
                to: newEmail,
                subject: "Email changed",
                text: username +
                    ",\nYour account's email was changed to this one per your request."
            }, (err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
    },

    /**
     * Emails to send on email changed to the old email, use together with ToNew function
     * @param {string} oldEmail
     * @param {string} username
     */
    emailsChangedToOldMail: function (oldEmail, username) {
        return new Promise(function (resolve, reject) {
            transporter.sendMail({
                from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
                to: oldEmail,
                subject: "Email changed",
                text: username +
                    ",\nYour account's email was changed per your request." +
                    "\nIf you were not the one to ask for email change, contact support."
            }, (err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
    },

    /**
     * Emails to on account deactivation
     * @param {string} receiverEmail
     * @param {string} username
     */
    accountDeactivatedMail: function (receiverEmail, username) {
        return new Promise(function (resolve, reject) {
            transporter.sendMail({
                from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
                to: receiverEmail,
                subject: "Account deactivated",
                text: username +
                    ",\nYour account has been deactivated per your request.\n" +
                    "To reactivate it at any time click on the reactivate account button on the login page.\n" +
                    "If you were not the one to deactivate it, contact support."
            }, (err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
    },

    /**
     * Emails to send on account deletetion request
     * @param {string} receiverEmail
     * @param {string} username
     * @param {string} token - delete account token
     * @param {string} activateURL - redirect URL to input confirmation code at
     */
    deleteAccountMail: function (receiverEmail, username, token, activateURL) {
        return new Promise(function (resolve, reject) {
            transporter.sendMail({
                from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
                to: receiverEmail,
                subject: "Confirm account deletion",
                text: username +
                    ",\nTo confirm the deletion of your account visit: " +
                    activateURL + " and input the code: " + token +
                    " to delete your account.\nIf you were not the one to ask for deletion, contact support.",
                html: username + ",<br>" +
                    "<a href=\"" + activateURL + "\">Redirect to delete account page</a><br> " +
                    "Input the code: <strong>" + token + "</strong>. " +
                    "If you were not the one to ask for deletion, contact support."
            }, (err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
    },

    /**
     * Emails to send on account deletion
     * @param {string} receiverEmail
     * @param {string} username
     */
    accountDeletedMail: function (receiverEmail, username) {
        return new Promise(function (resolve, reject) {
            transporter.sendMail({
                from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
                to: receiverEmail,
                subject: "Account deleted",
                text: username +
                    ",\nYour account has been deleted per your request."
            }, (err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
    }
}