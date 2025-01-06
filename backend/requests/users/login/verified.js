const multer = require("multer");
const fs = require("fs");

// إعداد التخزين للملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const avatarFolder = "./avts";
    if (!fs.existsSync(avatarFolder)) {
      fs.mkdirSync(avatarFolder);
    }
    cb(null, avatarFolder); // تحديد المجلد الذي سيتم حفظ الصور فيه
  },
  filename: (req, file, cb) => {
    cb(null, `${req.params.email}.png`); // تسمية الملف بناءً على البريد الإلكتروني
  }
});

const upload = multer({ storage: storage });

module.exports = {
  path: "/api/v1/verifid/:email",
  method: "post",
  run: async (req, res, database) => {
    upload.single("image")(req, res, async () => {
      try {
        if (!req.body || !req.body.data) {
          console.error("No data in request body");
          return res.status(400).json({ errors: ["No data"] });
        }

        if (!req.file) {
          console.error("No image uploaded");
          return res.status(400).json({ errors: ["Image is required"] });
        }

        const { username, phoneNumber, accountNumber } = JSON.parse(req.body.data);

        // Validate required fields
        if (!username || !phoneNumber || !accountNumber) {
          return res.status(400).json({ errors: ["All fields are required"] });
        }

        console.log(`Processing user verification for ${req.params.email}`);

        const user = await database.getUser(req.params.email);
        if (!user) {
          return res.status(404).json({ errors: ["User not found"] });
        }

        // Get token without Bearer prefix
        let token = req.headers.authorization;
        if (token?.startsWith("Bearer ")) {
          token = token.split("Bearer ")[1];
        }

        if (token !== user.token) {
          return res.status(401).json({ message: "Invalid Authorization" });
        }

        if (user.verified) {
          return res.status(400).json({ message: "User already verified" });
        }

        // Update user
        await database.updateUser(req.params.email, {
          username,
          phone: phoneNumber,
          accountNumber,
          verified: true,
          status: 1
        });

        return res.status(200).json({ message: "User verified and updated successfully" });
      } catch (error) {
        console.error("Error in verification:", error);
        return res.status(500).json({ errors: ["Internal server error"] });
      }
    });
  }
};
