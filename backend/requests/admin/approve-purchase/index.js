module.exports = {
    path: "/api/admin/approve-purchase",
    method: "post",
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

            // Check if user is admin using the global admins array
            if (!db.thisAdmin(user._id)) {
                return res.status(403).json({ error: "Not authorized" });
            }

            // Continue with approval process only if user is admin
            const { email, plan } = req.body;
            if (!email || !plan) {
                return res.status(400).json({ error: "Email and plan are required" });
            }

            // Approve the purchase
            const success = await db.approvePurchase(email, plan);
            if (success) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: "Purchase request not found or already processed" });
            }

        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 