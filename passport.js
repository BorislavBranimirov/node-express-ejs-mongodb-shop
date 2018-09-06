const LocalStrategy = require("passport-local").Strategy;

const { User } = require("./models");

module.exports = (passport) => {
    passport.use("login", new LocalStrategy({
        passReqToCallback: true
    },
        (req, username, password, done) => {
            User.findOne({ username: username }, (err, user) => {
                if (err) { return done(err); }
                if (!user) {
                    return done(null, false, req.flash("loginMessage", "Wrong user or password"));
                }
                
                if (!user.activated) {
                    if (user.activationToken) {
                        return done(null, false,
                            req.flash("loginMessage", "Activate your account with the code from your email to log in"));
                    } else {
                        return done(null, false,
                            req.flash("loginMessage", "Account is not activated click on the reactivation button"));
                    }
                }
                user.comparePassword(password, (err, isMatch) => {
                    if (err) { return done(err); }
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, req.flash("loginMessage", "Wrong user or password"));
                    }
                });
            });
        }
    ));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });
};
