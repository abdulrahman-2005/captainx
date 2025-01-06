module.exports = {
    path: "/api/admin/complaints/:id/respond",
    method: "post",
    run: async (req, res, db) => {
        try {
            const token = req.headers.authorization;
            if (!token) {
                return res.status(401).json({ error: "No authorization token provided" });
            }

            // Get user from token
            const user = await db.getUserByToken(token);
            if (!user) {
                return res.status(401).json({ error: "Invalid token" });
            }

            // Check if user is admin
            const isAdmin = await db.thisAdmin(user._id, token);
            if (!isAdmin) {
                return res.status(403).json({ error: "Not authorized" });
            }

            // Update complaint status
            const result = await db.complaints.findByIdAndUpdate(
                req.params.id,
                { status: 2 }, // 2 = responded
                { new: true }
            );

            if (!result) {
                return res.status(404).json({ error: "Complaint not found" });
            }

            res.json({ success: true, complaint: result });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 