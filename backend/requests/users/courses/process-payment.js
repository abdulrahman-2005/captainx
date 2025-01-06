
module.exports = {
    path: "/api/v1/process-payment",
    method: "post",
    run: async (req, res, db) => {
        try {
            const { email, plan } = req.body;
            if (!email || !plan) {
                return res.status(400).json({ error: "Email and plan are required" });
            }

            const token = req.headers.authorization;
            if (!token) {
                return res.status(401).json({ error: "Authorization required" });
            }

            const user = await db.getUserByToken(token);
            if (!user) {
                return res.status(401).json({ error: "Invalid token" });
            }

            const paymentStatus = await db.checkUserPaymentStatus(user._id);
            if (paymentStatus.hasPaid && paymentStatus.currentPlan === plan) {
                return res.status(400).json({ error: "You have already paid for this plan" });
            }

            // Process payment logic here
            // For example, integrate with a payment gateway like Stripe or PayPal

            // If payment is successful, mark the purchase as paid
            await db.markPurchaseAsPaid(email, plan);

            res.json({ success: true });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
};