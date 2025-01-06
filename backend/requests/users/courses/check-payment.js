module.exports = {
    path: "/api/v1/check-payment",
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

            const paymentStatus = await db.checkUserPaymentStatus(user._id);
            res.json(paymentStatus);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 