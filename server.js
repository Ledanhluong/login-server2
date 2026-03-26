require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const crypto = require("crypto");

const app = express();

// ===== TRUST PROXY (BẮT BUỘC CHO RENDER) =====
app.set("trust proxy", 1);

// ===== SESSION =====
app.use(session({
    secret: "secret123",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,      // Render dùng HTTPS
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
    return done(null, profile);
}));

// ===== LƯU USER (tạm thời RAM) =====
global.users = {};

// ===== ROUTE =====

// test
app.get("/", (req, res) => {
    res.send("Server chạy OK 🚀");
});

// login google
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// callback google
app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {

        if (!req.user) {
            return res.redirect("/");
        }

        const token = crypto.randomBytes(16).toString("hex");

        // fix lỗi undefined email
        const name = req.user.displayName || "NoName";
        const email = (req.user.emails && req.user.emails.length > 0)
            ? req.user.emails[0].value
            : "NoEmail";

        global.users[token] = { name, email };

        console.log("User login:", global.users[token]);

        // 🔥 redirect kèm token
        return res.redirect(`/success?token=${token}`);
    }
);

// trang hiển thị token
app.get("/success", (req, res) => {
    const token = req.query.token || "Không có token";

    res.send(`
        <h2>Login thành công ✅</h2>
        <p>Quay lại game</p>

        <script>
            navigator.clipboard.writeText("${token}");
        </script>

        <h3>${token}</h3>
    `);
});

// API lấy user
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

// API check token (game dùng)
app.get("/verify-token", (req, res) => {
    const token = req.query.token;

    if (!token || !global.users[token]) {
        return res.json({ valid: false });
    }

    res.json({ valid: true });
});

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server chạy port:", PORT);
});