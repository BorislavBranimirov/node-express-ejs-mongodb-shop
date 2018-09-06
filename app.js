const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const morgan = require("morgan");
const flash = require("connect-flash");
const methodOverride = require('method-override');
const favicon = require('serve-favicon');

const app = express();
app.disable("x-powered-by");

//add imports
const { ENV, MONGODB_URI, PORT } = require("./config");
const setupPassport = require("./passport");
const { baseRouter, adminRouter, userRouter } = require("./routes")(passport);

//public files
app.use(express.static(path.join(__dirname, 'public')))
app.use(favicon(path.join(__dirname, 'public', 'img', 'favicon.ico')))

//method override
app.use(methodOverride('_method'));

//views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//database
if (ENV === "development") {
    mongoose.set("debug", true);
}
mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
    .then(() => {
        console.log("Successfully connected to " + MONGODB_URI);
    })
    .catch((err) => {
        console.error(err);
        return next(err);
    });

//body-parser
app.use(bodyParser.urlencoded({ extended: false }));

//morgan
app.use(morgan('dev'));

//connect-flash
app.use(flash());

//passport
app.use(session({
    secret: "2#J^zH&&O$",
    resave: true,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());
setupPassport(passport);

//routers
app.use(function(req, res, next){
    //expore req.user to view files
    res.locals.user = req.user;
    next();
});
app.use("/", baseRouter);
app.use("/admin", adminRouter);
app.use("/user", userRouter);
app.use(function (req, res, next) {
    res.status(404);
    next(new Error("Page not found"));
});

//permission
app.set('permission', {
    after: (req, res, next, authorizedStatus) => {
        if(authorizedStatus === "notAuthorized") {
            res.status(403);
            return next(new Error( "User not Authorized to access page"));
        }
        if(authorizedStatus === "notAuthenticated") {
            res.status(401);
            return next(new Error( "User not authenticated"));
        }
        return next();
    }
});

app.use(function (err, req, res, next) {
    console.error(err);
    switch (res.statusCode) {
        case 401: {
            req.flash("loginMessage", "You must be logged in to visit this page");
            res.redirect("/login");
            break;
        }
        case 403: {
            res.send("You don't have access to this page");
            break;
        }
        case 404: {
            res.send("404 Page not found");
            break;
        }
        case 500: {
            res.send("500 Something broke");
            break;
        }
        default: {
            res.status(500);
            res.send("500 Something broke");
        }
    }
});

app.listen(PORT, () => {
    console.log("Listening on port: " + PORT);
});