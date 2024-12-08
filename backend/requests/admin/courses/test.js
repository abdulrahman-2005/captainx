module.exports = {
    path: "/api/admin/test",
    method: "get",
    run: async (req, res, db) => {
        try {
            const allUsers = await db.users.find({});
            console.log('All users in database:', allUsers);
            res.json({ users: allUsers });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 