module.exports = (connection) => {
    const Schema = require('mongoose').Schema;
    
    const progressSchema = new Schema({
        userId: String,
        completedLessons: [String],  // Array of completed lesson IDs
        totalWatchTime: { type: Number, default: 0 },
        lastActivity: { type: Date, default: Date.now }
    });

    return connection.model('Progress', progressSchema);
}; 