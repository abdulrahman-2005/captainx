module.exports = {
    path: "/api/admin/users",
    method: "get",
    run: async (req, res, db) => {
        try {
            console.log('Fetching users...');
            const page = parseInt(req.query.page) || 1;
            const users = await db.users.find({ 
                status: 1,
                verified: true
            }).skip((page - 1) * 10).limit(10);
            
            const total = await db.users.countDocuments({ 
                status: 1,
                verified: true
            });
            
            console.log('Found users:', users);
            
            res.json({
                records: users,
                count: total,
                recordsPerpage: 10,
                recordSkipped: (page - 1) * 10
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 