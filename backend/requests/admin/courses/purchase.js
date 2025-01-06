module.exports = {
    path: "/api/v1/purchase-request",
    method: "post",
    run: async (req, res, db) => {
        try {
            const { email, plan } = req.body;
            if (!email || !plan) {
                return res.status(400).json({ error: "Email and plan are required" });
            }

            const user = await db.users.findOne({ _id: email });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Try to create purchase request
            const result = await db.createPurchaseRequest(email, plan);
            
            if (!result.success && result.error === "DUPLICATE_REQUEST") {
                const existingPurchase = result.existingPurchase;
                let message;

                switch(existingPurchase.status) {
                    case 1:
                        message = "You already have a pending purchase request. Please wait for admin approval.";
                        break;
                    case 2:
                        message = "You have an approved purchase waiting for payment. Please complete your payment.";
                        break;
                    case 3:
                        message = "Your previous purchase request was rejected. Please contact support.";
                        break;
                    default:
                        message = "You have an existing purchase request. Please wait for it to be processed.";
                }

                return res.status(400).json({ 
                    error: message,
                    existingPurchase: existingPurchase
                });
            }

            res.json({ 
                success: true, 
                message: "Purchase request submitted and pending approval" 
            });

        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 