require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();

// TRUST PROXY (bắt buộc khi deploy Render)
app.set("trust proxy", 1);

// SESSION
app.use(session({
  secret: process.env.SESSION_SECRET || "fallback_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,      // Render dùng HTTPS
    httpOnly: true
  }
}));

// PASSPORT
app.use(passport.initialize());
app.use(passport.session());

// LƯU USER
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// GOOGLE LOGIN
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://login-server-t05y.onrender.com/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

// HOME
app.get("/", (req, res) => {
  res.send(`
    <h2>Server đang chạy 🚀</h2>
    <a href="/auth/google">👉 Đăng nhập bằng Google</a>
  `);
});

// LOGIN GOOGLE
app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

// CALLBACK
app.get("/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/"
  }),
  (req, res) => {
    res.send(`
      <h1>Đăng nhập thành công ✅</h1>
      <p><b>Tên:</b> ${req.user.displayName}</p>
      <p><b>Email:</b> ${req.user.emails[0].value}</p>
      <a href="/profile">Vào profile</a><br><br>
      <a href="/logout">Đăng xuất</a>
    `);
  }
);

// PROFILE (phải login mới vào được)
app.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/");
  }

  res.send(`
    <h1>PROFILE</h1>
    <p>${req.user.displayName}</p>
    <p>${req.user.emails[0].value}</p>
    <a href="/logout">Đăng xuất</a>
  `);
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

// SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server chạy tại port " + PORT);
});