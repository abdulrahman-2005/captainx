module.exports = {
    path: "/api/admin/delete-record",
    method: "post",
    run: async (req, res, db) => {
        try {
            const { collection, id } = req.body;
            if (!collection || !id) {
                return res.status(400).json({ error: "Collection and ID are required" });
            }

            let result;
            switch (collection) {
                case 'users':
                    result = await db.users.deleteOne({ _id: id });
                    break;
                case 'purchases':
                    result = await db.purchases.deleteOne({ _id: id });
                    break;
                case 'payments':
                    result = await db.payments.deleteOne({ _id: id });
                    break;
                default:
                    return res.status(400).json({ error: "Invalid collection" });
            }

            if (result.deletedCount > 0) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: "Record not found" });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 