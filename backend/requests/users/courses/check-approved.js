module.exports = {
    path: "/api/v1/check-approved-purchases",
    method: "get",
    run: async (req, res, db) => {
        try {
            const token = req.headers.authorization;
            if (!token) {
                return res.status(401).json({ error: "Authorization required" });
            }

            const user = await db.getUserByToken(token);
            if (!user) {
                return res.status(401).json({ error: "Invalid token" });
            }

            // Get approved purchases that haven't been paid yet
            const approvedPurchases = await db.purchases.find({
                email: user._id,
                status: 2, // Approved status
                paid: { $ne: true } // Not paid yet
            }).lean();

            res.json({ approvedPurchases });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 