# Shop app

Shop project with expressjs, mongodb, ejs, passport.

## Installation

Install the dependencies

```sh
$ npm install
```
Create and fill a .env file (by default uses gmail and you might need to allow "Less secure apps" on said email to make nodemailer module run, edit the mailer.js file to use another email service)
```sh
PORT = Insert port number here
MONGODB_URI = Insert mongodb URI here
EMAIL = Insert email here
EMAIL_PASS = Insert email password here
SESSION_SECRET = Insert random string to use as session secret here
```
Run app

```sh
$ npm start
```