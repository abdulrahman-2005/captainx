module.exports = {
    path: "/api/admin/check-access",
    method: "get",
    run: async (req, res, db) => {
        try {
            const token = req.headers.authorization;
            const email = req.query.email;

            const isAdmin = await db.thisAdmin(email, token);
            res.json({ isAdmin });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 