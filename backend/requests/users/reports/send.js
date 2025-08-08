module.exports = {
    path: "/api/v1/report/send/:email",
    method: "post",
    run: async (req, res, db) => {
        try {
            const {
                subject,
                company_name,
                company_website,
                profits,
                deposit,
                message
            } = req.body;

            // Validate user
            const user = await db.getUser(req.params.email);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (req.headers.authorization !== user.token) {
                return res.status(401).json({ message: "Invalid Authorization" });
            }

            if (!user.verified) {
                return res.status(401).json({ message: "User unverified" });
            }

            // Create new complaint using user details from database
            const newComplaint = await db.complaints.create({
                useremail: req.params.email,
                user_name: user.username, // Get username from database
                subject,
                companyname: company_name,
                companywebsite: company_website,
                profits: Number(profits),
                deposit: Number(deposit),
                message,
                status: 1 // pending
            });


            return res.status(200).json({
                message: "Complaint submitted successfully!"
            });

        } catch (error) {
            console.error('Error saving complaint:', error);
            return res.status(500).json({
                message: "Failed to submit complaint. Please try again."
            });
        }
    }
};