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
     */
    activateAccountMail: function (receiverEmail, username, token) {
        transporter.sendMail({
            from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
            to: receiverEmail,
            subject: 'Confirm account activation',
            text: username +
                ",\nVisit: https://express-ejs-mongo-shop.herokuapp.com/verify/activate and input the code: " +
                token + " to activate your account.",
            html: username + ",<br>" +
                "<a href=\"https://express-ejs-mongo-shop.herokuapp.com/verify/activate\">Redirect to activate account page</a><br> " +
                "Input the code: <strong>" + token + "</strong> to activate your account."
        }, (err) => {
            if (error) { return next(err); }
        });
    },

    /**
     * Email to send on password change request
     * @param {string} receiverEmail
     * @param {string} username
     * @param {string} token - password reset token
     */
    resetPasswordMail: function (receiverEmail, username, token) {
        transporter.sendMail({
            from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
            to: receiverEmail,
            subject: 'Request for password reset',
            text: username +
                ",\nVisit: https://express-ejs-mongo-shop.herokuapp.com/verify/passwordReset and input the code: " +
                token + " to change your password.",
            html: username + ",<br>" +
                "<a href=\"https://express-ejs-mongo-shop.herokuapp.com/verify/passwordReset\">Redirect to reset password page</a><br> " +
                "Input the code: <strong>" + token + "</strong> to change your password."
        }, (err) => {
            if (error) { return next(err); }
        });
    },

    /**
     * Email to send on password changed
     * @param {string} receiverEmail
     * @param {string} username
     */
    passwordChangedMail: function (receiverEmail, username) {
        transporter.sendMail({
            from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
            to: receiverEmail,
            subject: "Password changed",
            text: username +
                ",\nYour password has been changed. " +
                "If you were not the one to change it, contact support."
        }, (err) => {
            if (error) { return next(err); }
        });
    },

    /**
     * Email to send on account name changed
     * @param {string} receiverEmail
     * @param {string} username
     * @param {string} name - the new name
     */
    nameChangedMail: function (receiverEmail, username, name) {
        transporter.sendMail({
            from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
            to: receiverEmail,
            subject: "Name changed",
            text: username +
                ",\nYour name has been changed to " + name +
                ". If you were not the one to change it, contact support."
        }, (err) => {
            //if (error) { return next(err); }
            console.log("change|||||||||" + err + process.env.EMAIL+ process.env.EMAIL_PASS);
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
        transporter.sendMail({
            from: "'Contact form' <" + process.env.EMAIL + ">",
            to: process.env.EMAIL,
            subject: subject,
            text: "name: " + name + "\nemail: " + email + "\nmessage: " + messageBody
        }, (err) => {
            if (error) { return next(err); }
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
        for(let i = 0 ; i < sentItemObjectArray.length - 1; i++) {
            message += sentItemObjectArray[i].itemName + " x" + sentItemObjectArray[i].quantity + ", "
        }
        message += sentItemObjectArray[sentItemObjectArray.length-1].itemName +
        " x" + sentItemObjectArray[sentItemObjectArray.length-1].quantity +
        " will be shipped to you in a week." +
        "\nThe following items were out of stock and not placed on the order: " + outOfOrderItemArray

        transporter.sendMail({
            from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
            to: receiverEmail,
            subject: 'Order has been successfully send',
            text: message
        }, (err) => {
            if (error) { return next(err); }
        });
    },

    /**
     * Emails to send on email change
     * @param {string} newEmail
     * @param {string} oldEmail
     * @param {string} username
     * @param {string} token - email change token
     */
    changeEmailsMail: function (newEmail, oldEmail, username, token) {
        transporter.sendMail({
            from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
            to: newEmail,
            subject: "Request for email change",
            text: username +
                ",\nTo confirm change of email to this one go to " +
                "https://express-ejs-mongo-shop.herokuapp.com/user/verify/changeEmail and input the code: " + token +
                ".\nIf you were not the one to ask for the change, dont respond and delete this email.",
            html: username + ",<br>" +
            "<a href=\"https://express-ejs-mongo-shop.herokuapp.com/user/verify/changeEmail\">Redirect to change email page</a><br> " +
            "Input the code: <strong>" + token + "</strong> to change your email to this one." +
            " If you were not the one to ask for the change, dont respond and delete this email."
        }, (error, info) => {
            if (error) { return next(err); }
        });

        transporter.sendMail({
            from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
            to: oldEmail,
            subject: "Request for email change",
            text: username +
                ",\nPer your request after confirmation your email will be changed to a new one." +
                "\nIf you were not the one to ask for email change, contact support."
        }, (error, info) => {
            if (error) { return next(err); }
        });
    },

    /**
     * Emails to send on email changed
     * @param {string} newEmail
     * @param {string} oldEmail
     * @param {string} username
     */
    emailsChangedMail: function (newEmail, oldEmail, username) {
        transporter.sendMail({
            from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
            to: newEmail,
            subject: "Email changed",
            text: username +
                ",\nYour account's email was changed to this one per your request."
        }, (error, info) => {
            if (error) { return next(error); }
        });

        transporter.sendMail({
            from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
            to: oldEmail,
            subject: "Email changed",
            text: username +
                ",\nYour account's email was changed per your request." +
                "\nIf you were not the one to ask for email change, contact support."
        }, (error, info) => {
            if (error) { return next(error); }
        });
    },

    /**
     * Emails to on account deactivation
     * @param {string} receiverEmail
     * @param {string} username
     */
    accountDeactivatedMail: function (receiverEmail, username) {
        transporter.sendMail({
            from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
            to: receiverEmail,
            subject: "Account deactivated",
            text: username +
                ",\nYour account has been deactivated per your request.\n" +
                "To reactivate it at any time click on the reactivate account button on the login page.\n" +
                "If you were not the one to deactivate it, contact support."
        }, (err) => {
            if (error) { return next(err); }
        });
    },

    /**
     * Emails to send on account deletetion request
     * @param {string} receiverEmail
     * @param {string} username
     * @param {string} token - delete account token
     */
    deleteAccountMail: function (receiverEmail, username, token) {
        transporter.sendMail({
            from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
            to: receiverEmail,
            subject: "Confirm account deletion",
            text: username +
                ",\nTo confirm the deletion of your account visit: " +
                "https://express-ejs-mongo-shop.herokuapp.com/user/verify/delete and input the code: " + token +
                " to delete your account.\nIf you were not the one to ask for deletion, contact support.",
            html: username + ",<br>" +
                "<a href=\"https://express-ejs-mongo-shop.herokuapp.com/user/verify/delete\">Redirect to delete account page</a><br> " +
                "Input the code: <strong>" + token + "</strong>. " +
                "If you were not the one to ask for deletion, contact support."
        }, (err) => {
            if (error) { return next(err); }
        });
    },

    /**
     * Emails to send on account deletion
     * @param {string} receiverEmail
     * @param {string} username
     */
    accountDeletedMail: function (receiverEmail, username) {
        transporter.sendMail({
            from: "'Bori\'s shop' <" + process.env.EMAIL + ">",
            to: receiverEmail,
            subject: "Account deleted",
            text: username +
                ",\nYour account has been deleted per your request."
        }, (err) => {
            if (error) { return next(err); }
        });
    }
}