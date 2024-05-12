import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const app = express();

app.set("view engine", "ejs");

mongoose
  .connect("mongodb://localhost:27017", { dbName: "backend" })
  .then(() => {
    console.log("DB Connected Successfully");
  })
  .catch((err) => {
    console.log(err);
  });

const dataSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const userInfo = mongoose.model("UserInfo", dataSchema);

app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const authenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decode = jwt.verify(token, "SecretKey");
    req.user = await userInfo.findById(decode._id);
    next();
  } else res.redirect("/Login");
};

app.get("/", authenticated, (req, res) => {
  res.render("Logout", { name: req.user.name });
});

app.get("/Logout", (req, res) => {
  res.render("Logout", { name: "suman" });
});

app.get("/Login", (req, res) => {
  res.render("Login");
});

app.get("/register", (req, res) => {
  res.render("Register");
});

app.post("/Logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

app.post("/login", async (req, res) => {
  const { username, Email } = req.body;

  let user = await userInfo.findOne({ email: Email });

  if (!user) {
    return res.redirect("/register");
  }

  const token = jwt.sign({ _id: user._id }, "SecretKey");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.post("/register", async (req, res) => {
  const { username, Email } = req.body;

  let user = await userInfo.findOne({ email: Email });

  if (user) {
    return res.render("Register", { Email, message: "User already Exist" });
  }
  user = await userInfo.create({ name: username, email: Email });

  const token = jwt.sign({ _id: user._id }, "SecretKey");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.listen(5000, () => {
  console.log("Server up!");
});
