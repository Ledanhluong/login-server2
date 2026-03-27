require("dotenv").config();

const express = require("express");
const fs = require("fs");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// ====== DEBUG ENV ======
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "OK" : "MISSING");

// ====== FILE USER ======
const USERS_FILE = "users.json";
let users = [];

if (fs.existsSync(USERS_FILE)) {
  users = JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ====== OTP STORE ======
let otpStore = {};

// ====== MAIL CONFIG ======
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🔥 TEST MAIL CONFIG NGAY KHI SERVER START
transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ MAIL CONFIG ERROR:", error);
  } else {
    console.log("✅ MAIL SERVER READY");
  }
});

// ====== TEST SERVER ======
app.get("/", (req, res) => {
  res.send("Server đang chạy 🚀");
});

// ====== GỬI OTP ======
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  console.log("📩 Request OTP:", email);

  if (!email) {
    return res.json({ message: "Thiếu email" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[email] = {
    otp,
    expire: Date.now() + 2 * 60 * 1000,
  };

  console.log("🔑 OTP:", otp);

  try {
    let info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Mã OTP",
      text: `OTP của bạn: ${otp}`,
    });

    console.log("✅ Mail sent:", info.response);

    res.json({ success: true, message: "Đã gửi OTP" });
  } catch (err) {
    console.log("❌ MAIL ERROR:", err);
    res.json({ success: false, message: "Lỗi gửi mail" });
  }
});

// ====== REGISTER ======
app.post("/register", (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.json({ message: "Thiếu dữ liệu" });
  }

  const data = otpStore[email];

  if (!data) return res.json({ message: "Chưa gửi OTP" });

  if (Date.now() > data.expire) {
    delete otpStore[email];
    return res.json({ message: "OTP hết hạn" });
  }

  if (data.otp !== otp) {
    return res.json({ message: "OTP sai" });
  }

  const userExists = users.find(u => u.email === email);
  if (userExists) {
    return res.json({ message: "Email đã tồn tại" });
  }

  users.push({ email, password });
  saveUsers();

  delete otpStore[email];

  res.json({ message: "Đăng ký thành công" });
});

// ====== LOGIN ======
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.json({ message: "Sai tài khoản hoặc mật khẩu" });
  }

  res.json({ message: "Đăng nhập thành công" });
});

// ====== RUN ======
app.listen(PORT, () => {
  console.log("🚀 Server chạy cổng " + PORT);
});
