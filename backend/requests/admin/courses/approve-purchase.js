module.exports = {
    path: "/api/admin/approve-purchase",
    method: "post",
    run: async (req, res, db) => {
        try {
            const { email, plan } = req.body;
            if (!email || !plan) {
                return res.status(400).json({ error: "Email and plan are required" });
            }
            
            await db.approvePurchase(email, plan);
            res.json({ success: true });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 