require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const crypto = require("crypto");

const app = express();

// ===== TRUST PROXY (Render bắt buộc) =====
app.set("trust proxy", 1);

// ===== SESSION =====
app.use(session({
    secret: "secret123",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,       // bắt buộc HTTPS (Render OK)
        sameSite: "none"
    }
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

    const user = {
        id: profile.id,
        name: profile.displayName || "NoName",
        email: (profile.emails && profile.emails.length > 0)
            ? profile.emails[0].value
            : "NoEmail"
    };

    return done(null, user);
}));

// ===== LƯU USER (RAM - DEMO) =====
const users = {};

// ===== ROUTE =====

// test server
app.get("/", (req, res) => {
    res.send("Server chạy OK 🚀");
});

// ===== LOGIN GOOGLE =====
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// ===== CALLBACK =====
app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {

        if (!req.user) {
            return res.redirect("/");
        }

        // 🔐 tạo token
        const token = crypto.randomBytes(32).toString("hex");

        // lưu user
        users[token] = req.user;

        console.log("✅ LOGIN:", req.user.email);
        console.log("🔑 TOKEN:", token);

        // ===================================
        // 🔥 QUAN TRỌNG NHẤT (AUTO LOGIN)
        // ===================================
        return res.redirect(`mygame://login?token=${token}`);
    }
);

// ===== API LẤY USER =====
app.get("/user", (req, res) => {
    const token = req.query.token;

    if (!token || !users[token]) {
        return res.json({ success: false });
    }

    res.json({
        success: true,
        user: users[token]
    });
});

// ===== API VERIFY TOKEN =====
app.get("/verify-token", (req, res) => {
    const token = req.query.token;

    if (!token || !users[token]) {
        return res.json({ valid: false });
    }

    res.json({ valid: true });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("🚀 Server chạy tại port:", PORT);
});