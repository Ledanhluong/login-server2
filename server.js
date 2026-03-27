require("dotenv").config();

const express = require("express");
const fs = require("fs");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// ====== CHECK ENV ======
console.log("🔑 RESEND_API_KEY:", process.env.RESEND_API_KEY ? "OK" : "MISSING");

if (!process.env.RESEND_API_KEY) {
  console.log("❌ Thiếu RESEND_API_KEY → Dừng server");
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

// ====== FILE USER ======
const USERS_FILE = "users.json";
let users = [];

try {
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE));
  }
} catch (err) {
  console.log("❌ Lỗi đọc users.json:", err);
}

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ====== OTP STORE ======
let otpStore = {};

// ====== TEST SERVER ======
app.get("/", (req, res) => {
  res.send("Server đang chạy 🚀");
});

// ====== GỬI OTP ======
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  console.log("📩 Request OTP:", email);

  if (!email) {
    return res.json({ success: false, message: "Thiếu email" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[email] = {
    otp,
    expire: Date.now() + 2 * 60 * 1000, // 2 phút
  };

  console.log("🔑 OTP:", otp);

  try {
    const data = await resend.emails.send({
      from: "onboarding@resend.dev", // test được luôn
      to: email,
      subject: "Mã OTP",
      html: `<h1>OTP của bạn: ${otp}</h1>`,
    });

    console.log("✅ Mail sent:", data);

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
    return res.json({ success: false, message: "Thiếu dữ liệu" });
  }

  const data = otpStore[email];

  if (!data) return res.json({ success: false, message: "Chưa gửi OTP" });

  if (Date.now() > data.expire) {
    delete otpStore[email];
    return res.json({ success: false, message: "OTP hết hạn" });
  }

  if (data.otp !== otp) {
    return res.json({ success: false, message: "OTP sai" });
  }

  const userExists = users.find(u => u.email === email);
  if (userExists) {
    return res.json({ success: false, message: "Email đã tồn tại" });
  }

  users.push({ email, password });
  saveUsers();

  delete otpStore[email];

  res.json({ success: true, message: "Đăng ký thành công" });
});

// ====== LOGIN ======
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.json({ success: false, message: "Sai tài khoản hoặc mật khẩu" });
  }

  res.json({ success: true, message: "Đăng nhập thành công" });
});

// ====== RUN ======
app.listen(PORT, () => {
  console.log("🚀 Server chạy cổng " + PORT);
});
