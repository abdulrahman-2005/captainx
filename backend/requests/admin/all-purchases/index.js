module.exports = {
    path: "/api/admin/all-purchases",
    method: "get",
    run: async (req, res, db) => {
        try {
            const token = req.headers.authorization;
            if (!token) {
                return res.status(401).json({ error: "Authorization required" });
            }

            // Get user by token
            const user = await db.users.findOne({ token });
            if (!user) {
                return res.status(401).json({ error: "Invalid token" });
            }

            // Check if user is admin using thisAdmin method
            const isAdmin = await db.thisAdmin(user._id, token);
            if (!isAdmin) {
                return res.status(403).json({ error: "Not authorized" });
            }

            // Continue with fetching purchases only if user is admin
            const purchases = await db.purchases.find({}).sort({ createdAt: -1 });
            res.json({ purchases });

        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 