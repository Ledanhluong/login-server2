require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();

app.use(session({
    secret: "secret123",
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

// 🔥 ROUTE LOGIN (cái bạn đang thiếu)
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// callback
app.get("/auth/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/"
    }),
    (req, res) => {
        res.send("Login thành công: " + req.user.displayName);
    }
);

// test
app.get("/", (req, res) => {
    res.send("Server chạy OK 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server chạy"));