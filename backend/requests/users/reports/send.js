const Mailjet = require('node-mailjet');
const mailjet = new Mailjet({
    apiKey: process.env.MAILJET_API_KEY,
    apiSecret: process.env.MAILJET_SECRET_KEY
});

module.exports = {
    path: "/api/v1/report/send/:email",
    method: "post",
    run: async (req, res, database) => {
        try {
            const {
                user_name,
                subject,
                company_name,
                company_website,
                profits,
                deposit,
                message
            } = req.body;

            // Validate user
            const user = await database.getUser(req.params.email);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (req.headers.authorization !== user.token) {
                return res.status(401).json({ message: "Invalid Authorization" });
            }

            if (!user.verified) {
                return res.status(401).json({ message: "User unverified" });
            }

            // Format the email content
            const emailContent = `
                <h2>New Complaint Report</h2>
                <h3>User Information:</h3>
                <p><strong>Name:</strong> ${user_name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
                
                <h3>Complaint Details:</h3>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Company Name:</strong> ${company_name}</p>
                <p><strong>Company Website:</strong> ${company_website}</p>
                <p><strong>Reported Profits:</strong> $${profits}</p>
                <p><strong>Total Deposit:</strong> $${deposit}</p>
                
                <h3>Message:</h3>
                <p>${message}</p>
                
                <hr>
                <p><small>This complaint was submitted on ${new Date().toLocaleString()}</small></p>
            `;

            // Send email using Mailjet v3.1
            const emailData = {
                Messages: [
                    {
                        From: {
                            Email: "bodyazmy.new.2005@gmail.com",
                            Name: "Captain X Complaints"
                        },
                        To: [
                            {
                                Email: "abuazmy.gg@gmail.com",
                                Name: "Captain X Support"
                            }
                        ],
                        Subject: `New Complaint: ${subject}`,
                        HTMLPart: emailContent,
                        CustomID: `complaint_${Date.now()}`
                    }
                ]
            };

            await mailjet
                .post('send', { version: 'v3.1' })
                .request(emailData);

            return res.status(200).json({
                message: "Complaint submitted successfully!"
            });

        } catch (error) {
            console.error('Error sending complaint:', error);
            return res.status(500).json({
                message: "Failed to send complaint. Please try again."
            });
        }
    }
};
