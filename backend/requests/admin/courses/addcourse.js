let fs = require("fs");

module.exports = {
  path: "/api/v1/addcourse/:email",
  method: "post", // POST لاستقبال البيانات
  run: async (req, res, database) => {
    const isAdmin = await database.thisAdmin(req.params.email, req.headers.authorization);
    if (isAdmin) {

      const course = {
        name: req.body.name,
        description : req.body.description,
        price: req.body.price
      }
      const course1 = await database.createCourse(course);
      
    } else {
      return res.status(404).json({ errors: ["you are not admin"] });
    }
  }
}