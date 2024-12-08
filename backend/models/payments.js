const mongoose = require("mongoose");

const users = new mongoose.Schema({
    _id: { type: String, required: true }, // id
    email: { type: String, required: true },
    status: { type: Number, defualt: 0 },
    plan: { type: Number, required: 0 },
    creatAt: { type: Number, required: true },
    payAt: { type: Number, required: true },
});

module.exports = (connection) => connection.model("Users", users, "users");
