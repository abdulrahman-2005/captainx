let fs = require("fs");

module.exports = {
  path: "/api/admin/deny",
  method: "post",
  run: async (req, res, db) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      await db.denyUser(email);
      res.json({ success: true });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}