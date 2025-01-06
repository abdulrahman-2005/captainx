const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
    useremail: { type: String, required: true },
    user_name: { type: String, required: true },
    subject: { type: String, required: true },
    companyname: { type: String, required: true },
    companywebsite: { type: String, required: true },
    profits: { type: Number, required: true },
    deposit: { type: Number, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: Number, default: 1 } // 1 = pending, 2 = responded, 3 = archived
});

// Add this for debugging
complaintSchema.post('save', function(doc) {
    console.log('Saved complaint:', doc);
});

module.exports = (connection) => connection.model("Complaint", complaintSchema);

