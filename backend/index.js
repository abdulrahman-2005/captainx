require("dotenv").config();
const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const bodyParser = require("body-parser");
let express = require("express");
let fs = require("fs");
const http = require("http");
let db = require("./db");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const database = new db(
  process.env.MONGODB_URI
);
const cors = require('cors');
const path = require("path");

module.exports = async function (app) {
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(express.static(__dirname + '/../frontend/cssprject/new'));
  app.use('/imgs', express.static(path.join(__dirname, 'imgs')));

  sleep(5000)
  fs.readdirSync(__dirname + "/requests/").forEach((dir) => {
    fs.readdirSync(__dirname + `/requests/${dir}`).forEach((dir2) => {
      const requests = fs
        .readdirSync(__dirname + `/requests/${dir}/${dir2}`)
        .filter((file) => file.endsWith(".js"));

      for (let file of requests) {
        let request = require(__dirname + `/requests/${dir}/${dir2}/${file}`);
        if (dir2 === "logs" && file === "get.js") continue;
        if (request.method && request.path) {
          app[request.method](request.path, async (req, res) => {
            try {
              return request.run(req, res, database);
            } catch (error) {
              console.error(error);
              return res.status(500).json({
                errors: ["Internal Server Error"],
                message: "Internal Server Error",
              });
            }
          });
        }
      }
    });
  });


  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
        scope: ["email"]
      },
      async (accessToken, refreshToken, profile, done) => {
        if (profile.emails && profile.emails[0]) {
          const email = profile.emails[0].value;
          console.log("Email:", email);
          return done(null, { email, accessToken });
        } else {
          console.error("No email information available in the profile");
          return done(new Error("No email information"), null);
        }
      }
    )
  );

  app.use(passport.initialize());

  // توجيه المستخدم لتسجيل الدخول عبر Google باستخدام scope فقط من email
  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["email"] }), // هنا scope فقط email
  );

  // استلام بيانات Google وحفظ التوكن
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: '/login-failed',
      session: false
    }),
    async (req, res) => {
      if (!req.user) {
        return res.redirect('/login-failed');
      }
      const user = await database.getUser(req.user.email);
      const email = req.user.email;
      console.log(email);

      if (!user) {
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "7d" });
        await database.createUser(email, token);
        res.send(
          `<script>
                    localStorage.setItem('token', '${token}');
                    localStorage.setItem('email', '${email}');
                    window.location.href = '/';
                </script>`
        );
      } else {
        console.log(user);
        res.send(
          `<script>
                    localStorage.setItem('token', '${user.token}');
                    localStorage.setItem('email', '${email}');
                    window.location.href = '/';
                </script>`
        );
      }
    }
  );

  app.get("/login-success", (req, res) => {
    res.sendFile(__dirname + "/success.html");
  });

  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/../frontend/cssprject/new/index.html');
  });

  app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/../frontend/cssprject/new/admin.html');
  });

  app.get('/data-for-debugging', (req, res) => {
    res.sendFile(__dirname + '/../frontend/cssprject/new/data-for-debugging.html');
  });

  app.get('/login-failed', (req, res) => {
    res.send('Login failed. Please try again.');
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};
