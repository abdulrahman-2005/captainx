module.exports = {
    path: "/api/admin/complaints",
    method: "get",
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

            // Fetch only pending complaints (status 1)
            const complaints = await db.complaints.find({ status: 1 }).sort({ createdAt: -1 });
            
            console.log('Found complaints:', complaints); // Add this for debugging
            
            res.json({
                records: complaints,
                count: complaints.length
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
};