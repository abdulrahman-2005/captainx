module.exports = {
    path: "/api/admin/purchases",
    method: "get",
    run: async (req, res, db) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const data = await db.getPurchaseRequests(page);
            console.log('Found purchases:', data);
            res.json(data);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 