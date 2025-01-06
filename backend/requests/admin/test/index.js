module.exports = {
    path: "/api/admin/test",
    method: "get",
    run: async (req, res, db) => {
        try {
            const token = req.headers.authorization;
            const email = req.query.email;

            // Check if user is admin
            const isAdmin = await db.thisAdmin(email, token);
            if (!isAdmin) {
                return res.status(403).json({ error: "Not authorized" });
            }

            // Only fetch data if user is admin
            const users = await db.users.find({}).lean();
            res.json({ users });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 