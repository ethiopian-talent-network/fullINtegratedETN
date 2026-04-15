const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/auth", require("./routes/authRoutes"));
app.use("/user", require("./routes/userRoutes"));
app.use("/employer", require("./routes/employerRoutes"));
app.use("/talents", require("./routes/talentRoutes"));
app.use("/chat", require("./routes/openaiRoute"));
app.use("/admin", require("./routes/adminRoutes"));
app.use("/payment", require("./routes/paymentRoutes"));


app.listen(5000, () => {
  console.log("Server is running on port http://localhost:5000");
});
