module.exports = {
    path: "/api/admin/purchases",
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

            const page = parseInt(req.query.page) || 1;
            const data = await db.getPurchaseRequests(page);
            res.json(data);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 