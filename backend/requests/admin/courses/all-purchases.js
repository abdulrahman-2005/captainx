module.exports = {
    path: "/api/admin/all-purchases",
    method: "get",
    run: async (req, res, db) => {
        try {
            // Get all purchases and map status codes to readable strings
            const purchases = await db.purchases.find({})
                .sort({ createdAt: -1 })
                .lean()
                .then(purchases => purchases.map(purchase => ({
                    ...purchase,
                    statusText: getStatusText(purchase.status),
                    statusClass: getStatusClass(purchase.status)
                })));
            
            res.json({ purchases });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}; 

function getStatusText(status) {
    switch(status) {
        case 1:
            return "Pending";
        case 2:
            return "Approved";
        case 3:
            return "Denied";
        default:
            return "Unknown";
    }
}

function getStatusClass(status) {
    switch(status) {
        case 1:
            return "pending";
        case 2:
            return "approved";
        case 3:
            return "denied";
        default:
            return "unknown";
    }
} 