const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Server chạy OK 🚀");
});

// ⚠️ QUAN TRỌNG
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server chạy tại port " + PORT);
});