require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const crypto = require("crypto");

const app = express();

// ================= SESSION =================
app.use(session({
    secret: "secret123",
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// ================= PASSPORT =================
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

// ================= LƯU USER TẠM =================
global.users = {}; // token -> user

// ================= ROUTE =================

// 👉 test server
app.get("/", (req, res) => {
    res.send("Server chạy OK 🚀");
});

// 👉 login google
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// 👉 callback sau login
app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {

        // 🔥 tạo token
        const token = crypto.randomBytes(16).toString("hex");

        // 🔥 lưu user
        global.users[token] = {
            name: req.user.displayName,
            email: req.user.emails[0].value
        };

        console.log("User login:", global.users[token]);

        // 👉 TRẢ TOKEN (test)
        res.send(`
            <h2>Login thành công</h2>
            <p>Token:</p>
            <h3>${token}</h3>
        `);
    }
);

// 👉 API lấy user từ token
app.get("/user", (req, res) => {
    const token = req.query.token;

    if (!token || !global.users[token]) {
        return res.json({
            success: false,
            message: "Token không hợp lệ"
        });
    }

    res.json({
        success: true,
        user: global.users[token]
    });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server chạy tại port:", PORT);
});