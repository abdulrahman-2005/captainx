module.exports = {
    path: "/api/admin/users",
    method: "get",
    run: async (req, res, db) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const recordsPerpage = 10;
            const pageIndex = page - 1;
            const recordSkipped = pageIndex * recordsPerpage;

            // Get total users count
            const totalUsers = await db.users.countDocuments({});
            
            // Get pending users for the table
            const pendingUsers = await db.users.aggregate([
                { $match: { status: { $in: [0, 1, 2] } } },
                {
                    $facet: {
                        data: [
                            { $skip: recordSkipped },
                            { $limit: recordsPerpage }
                        ],
                        count: [{ $count: "count" }]
                    }
                }
            ]).exec();

            const result = {
                records: pendingUsers[0]?.data || [],
                pendingCount: pendingUsers[0]?.count?.[0]?.count || 0,
                totalUsers: totalUsers,
                recordsPerpage,
                recordSkipped
            };

            res.json(result);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 