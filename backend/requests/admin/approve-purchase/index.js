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

            const { email, plan } = req.body;
            if (!email || !plan) {
                return res.status(400).json({ error: "Email and plan are required" });
            }

            // Get the purchase request
            const purchase = await db.purchases.findOne({
                email,
                plan,
                status: 1 // Pending
            });

            if (!purchase) {
                return res.status(404).json({ error: "Purchase request not found or already processed" });
            }

            // Update purchase status and mark as paid
            const updateResult = await db.purchases.updateOne(
                { _id: purchase._id },
                { 
                    $set: { 
                        status: 2, // Approved
                        paid: true,
                        paidAt: new Date()
                    } 
                }
            );

            if (updateResult.modifiedCount === 0) {
                return res.status(500).json({ error: "Failed to update purchase status" });
            }

            // Update user's plan
            const userUpdateResult = await db.users.updateOne(
                { _id: email },
                { 
                    $set: { 
                        plan,
                        planActive: true,
                        planPurchaseDate: new Date()
                    } 
                }
            );

            if (userUpdateResult.modifiedCount === 0) {
                return res.status(500).json({ error: "Failed to update user plan" });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 