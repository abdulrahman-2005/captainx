const stripe = require("stripe")("your-secret-key");
const express = require("express");

module.exports = {
  path: "/webhook/stripe",
  method: "post",
  run: async (req, res) => {
    const endpointSecret = "your-webhook-signing-secret"; // قم بوضع توقيع Webhook من Stripe
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      // تحقق من صحة الطلب باستخدام توقيع Stripe
      event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // التعامل مع الأحداث التي يتم استلامها
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // تحديث حالة المستخدم في قاعدة البيانات بناءً على email
      const email = session.customer_email; // أو استخدم custom fields إذا تم إعدادها
      const user = await database.getUser(email);

      if (user) {
        await database.updateUserStatus(email, { status: 4 }); // تحديث حالة المستخدم إلى "مدفوع"
        console.log(`Payment successful for user: ${email}`);
      }
    }

    res.status(200).end();
  },
};
