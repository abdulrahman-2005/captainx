module.exports = {
  path: "/api/v1/purchase-request",
  method: "post",
  run: async (req, res, db) => {
    try {
      const { email, plan } = req.body;
      if (!email || !plan) {
        return res.status(400).json({ error: "Email and plan are required" });
      }

      // Check if user exists
      const user = await db.getUser(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check authorization
      if (req.headers.authorization !== user.token) {
        return res.status(401).json({ error: "Invalid authorization" });
      }

      // Check if registration is approved (must be status 2)
      if (user.status !== 2) {
        return res.status(403).json({ 
          error: "Your registration must be approved by admin before making purchases"
        });
      }

      try {
        // This will throw an error if user has existing purchase
        await db.createPurchaseRequest(email, plan);
        
        return res.json({ 
          success: true, 
          message: "Purchase request submitted and pending approval"
        });
      } catch (purchaseError) {
        if (purchaseError.message === "User already has an existing purchase request") {
          // Get the existing purchase to determine its status
          const existingPurchase = await db.purchases.findOne({
            email,
            paid: { $ne: true }
          });

          let message;
          if (existingPurchase) {

            if (existingPurchase.paid) {
              return res.status(400).json({ error: "You already have an active subscription." });
            }

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
          } else {
            message = "You cannot place a new order at this time.";
          }

          return res.status(400).json({ error: message });
        }
        throw purchaseError;
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};