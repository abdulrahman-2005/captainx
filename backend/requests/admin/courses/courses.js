let fs = require("fs");

module.exports = {
  path: "/api/v1/courses/:email",
  method: "get",
  run: async (req, res, database) => {
    const isAdmin = await database.thisAdmin(req.params.email, req.headers.authorization);
    if (isAdmin) {
      const data = await database.fetchAllCourses(req.body.page);
      res.status(200).json(data);
    } else {
      return res.status(404).json({ errors: ["you are not admin"] });
    }
  }
}