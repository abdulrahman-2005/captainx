module.exports = (connection) => {
    const Schema = require('mongoose').Schema;
    
    const purchaseSchema = new Schema({
        email: String,
        plan: Number,
        status: {
            type: Number,
            enum: [1, 2, 3],  // 1: pending, 2: approved, 3: denied
            default: 1
        },
        createdAt: { type: Date, default: Date.now },
        paid: { type: Boolean, default: false },
        paidAt: Date
    });

    // Add a static method to get status text
    purchaseSchema.statics.getStatusText = function(status) {
        switch(status) {
            case 1: return "Pending";
            case 2: return "Approved";
            case 3: return "Denied";
            default: return "Unknown";
        }
    };

    return connection.model('Purchase', purchaseSchema);
}; 