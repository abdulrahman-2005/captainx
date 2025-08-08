const axios = require('axios');

function getPlanName(planNumber) {
    const planNames = {
        1: 'BASIC',
        2: 'PRO',
        3: 'ELITE'
    };
    return planNames[planNumber] || 'UNKNOWN';
}

module.exports = {
    path: "/api/v1/user/plan",
    method: "get",
    run: async (req, res, db) => {
        try {
            const token = req.headers.authorization;

            // Get user by token with all details
            const user = await db.users.findOne({ token });

            if (!user) {
                return res.status(401).json({ error: "Invalid token" });
            }

            // Get active purchase
            const activePurchase = await db.purchases.findOne({
                email: user._id,
                status: 2, // Approved
                paid: true
            }).sort({ purchaseDate: -1 }); // Get most recent purchase

            if (!activePurchase) {
                return res.status(403).json({ error: "No active plan found" });
            }

            // Get plan details
            const planConfig = db.pkans[activePurchase.plan];

            if (!planConfig) {
                return res.status(404).json({ error: "Plan configuration not found" });
            }

            // Calculate expiry date based on plan duration
            const purchaseDate = new Date(activePurchase.purchaseDate || Date.now());
            const expiryDate = new Date(purchaseDate);
            const planDuration = planConfig.duration || 30; // Default to 30 days if not specified
            expiryDate.setDate(expiryDate.getDate() + planDuration);

            // Get videos for this plan
            const folderSearchResponse = await axios({
                method: 'POST',
                url: 'https://dev.vdocipher.com/api/videos/folders/search',
                headers: {
                    'Authorization': `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    name: planConfig.vdocipher_foldername
                }
            });

            const folder = folderSearchResponse.data.folders?.[0];
            let totalDuration = 0;
            let totalLessons = 0;

            if (folder) {
                const videosResponse = await axios({
                    method: 'get',
                    url: 'https://dev.vdocipher.com/api/videos',
                    params: {
                        folderId: folder.id
                    },
                    headers: {
                        'Authorization': `Apisecret ${process.env.VDOCIPHER_API_SECRET}`
                    }
                });

                const videos = videosResponse.data.rows || [];
                totalLessons = videos.length;
                totalDuration = videos.reduce((acc, video) => acc + (video.length || 0), 0);
            }

            // Format the expiry date nicely
            const formatDate = (date) => {
                return new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }).format(date);
            };

            res.json({
                user: {
                    username: user.username,
                    email: user._id,
                    phone: user.phone,
                    joinDate: user.createdAt,
                    verified: user.verified,
                    status: user.status
                },
                plan: {
                    name: getPlanName(activePurchase.plan),
                    description: planConfig.description || `Access to ${getPlanName(activePurchase.plan).toLowerCase()} level courses`,
                    features: planConfig.features || [],
                    price: planConfig.price,
                    duration: planDuration
                },
                subscription: {
                    purchaseDate: purchaseDate.toISOString(),
                    expiryDate: expiryDate.toISOString(),
                    accessUntil: formatDate(expiryDate),
                    daysRemaining: Math.max(0, Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24))),
                    status: activePurchase.status,
                    isActive: true
                },
                content: {
                    totalLessons,
                    totalDuration,
                    formattedDuration: formatDuration(totalDuration)
                }
            });
        } catch (error) {
            console.error('Detailed error:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({ 
                error: "Internal Server Error",
                details: error.message 
            });
        }
    }
}; 

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
} 