module.exports = (connection) => {
    const Schema = require('mongoose').Schema;
    
    const userSchema = new Schema({
        _id: String,  // email
        token: String,
        username: String,
        accountNumber: String,
        phone: String,
        plan: Number,
        verified: Boolean,
        status: Number
    });

    return connection.model('User', userSchema);
};
    