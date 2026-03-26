require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const crypto = require("crypto");

const app = express();

// ===== SESSION =====
app.use(session({
    secret: "secret123",
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// ===== PASSPORT =====
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

// ===== LƯU USER =====
global.users = {};

// ===== ROUTE =====

// test
app.get("/", (req, res) => {
    res.send("Server chạy OK 🚀");
});

// login
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// callback
app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {

        const token = crypto.randomBytes(16).toString("hex");

        global.users[token] = {
            name: req.user.displayName,
            email: req.user.emails[0].value
        };

        console.log("User:", global.users[token]);

        // 🔥 REDIRECT về link có token
        res.redirect(`/success?token=${token}`);
    }
);

// 👉 trang hiển thị (optional)
app.get("/success", (req, res) => {
    const token = req.query.token;

    res.send(`
        <h2>Login thành công ✅</h2>
        <p>Bạn có thể quay lại game</p>
        <p>Token:</p>
        <h3>${token}</h3>
    `);
});

// 👉 API lấy user
app.get("/user", (req, res) => {
    const token = req.query.token;

    if (!token || !global.users[token]) {
        return res.json({ success: false });
    }

    res.json({
        success: true,
        user: global.users[token]
    });
});

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server chạy port:", PORT);
});