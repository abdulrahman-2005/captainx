// const stripe = require("stripe")("your-secret-key"); // Uncomment when you have Stripe key

module.exports = {
    path: "/api/v1/checkout",
    method: "post",
    run: async (req, res, db) => {
        try {
            const { email, plan } = req.body;
            
            // Verify user and authorization
            const user = await db.getUser(email);
            if (!user || req.headers.authorization !== user.token) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            // Check if purchase is approved and not already paid
            const purchase = await db.purchases.findOne({ 
                email, 
                plan,
                status: 2, // Approved
                paid: { $ne: true } // Not already paid
            });

            if (!purchase) {
                return res.status(403).json({ 
                    error: "No approved unpaid purchase found" 
                });
            }

            // Mark the purchase as paid
            await db.markPurchaseAsPaid(email, plan);
            
            // Update user's plan status
            await db.users.updateOne(
                { _id: email },
                { 
                    $set: { 
                        plan,
                        planActive: true,
                        planPurchaseDate: new Date()
                    } 
                }
            );
            
            // Return success page URL
            res.json({ 
                url: `/checkout-success.html?email=${email}&plan=${plan}`,
                success: true
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 