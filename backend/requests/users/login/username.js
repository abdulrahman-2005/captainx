  module.exports = {
    path: "/api/v1/username/:username",
    method: "get",
    run: async (req, res, database) => {
      const user = await database.searchUsername(req.params.username);
      if (user) return res.status(404).json({ errors: ["Username Taken"] });
    }
  };