let fs = require("fs");

module.exports = {
  path: "/api/v1/verfiy/:email",
  method: "get",
  run: async (req, res, database) => {
    try {
      const user = await database.getUser(req.params.email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const token = req.headers.authorization?.replace('Bearer ', '') || req.headers.authorization;
      if (!token || token !== user.token) {
        return res.status(401).json({ message: "Invalid Authorization" });
      }

      if (!user.verified) {
        return res.status(200).json({ 
          message: "User unverified",
          verified: false,
          approved: false
        });
      }

      return res.status(200).json({ 
        message: "User verified",
        verified: true,
        approved: user.status === 2
      });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};  