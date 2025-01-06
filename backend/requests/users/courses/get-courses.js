const axios = require('axios');

module.exports = {
    path: "/api/v1/courses",
    method: "get",
    run: async (req, res, db) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: "Authorization required" });
            }

            // Get user by token
            const user = await db.users.findOne({ token });
            if (!user) {
                return res.status(401).json({ error: "Invalid token" });
            }

            // Check if user has an active paid plan
            const activePurchase = await db.purchases.findOne({
                email: user._id,
                status: 2, // Approved
                paid: true
            });

            if (!activePurchase) {
                return res.status(403).json({ error: "No active plan found" });
            }

            // Get plan configuration
            const planConfig = db.pkans[activePurchase.plan];
            if (!planConfig || !planConfig.vdocipher_foldername) {
                return res.status(404).json({ error: "Plan configuration not found" });
            }

            console.log('Searching for folder:', planConfig.vdocipher_foldername);

            // Search for folder by name
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

            // Log the response to see its structure
            console.log('Folder search response:', JSON.stringify(folderSearchResponse.data, null, 2));

            // Get folder from response
            const folder = folderSearchResponse.data.folders?.[0];

            if (!folder) {
                console.error(`Folder not found for plan: ${planConfig.vdocipher_foldername}`);
                return res.json({ courses: [] });
            }

            console.log(`Found folder ID ${folder.id} for plan ${planConfig.vdocipher_foldername}`);

            // Get videos using v1 API with folder ID
            const vdoCipherResponse = await axios({
                method: 'get',
                url: 'https://dev.vdocipher.com/api/videos',
                params: {
                    folderId: folder.id
                },
                headers: {
                    'Authorization': `Apisecret ${process.env.VDOCIPHER_API_SECRET}`
                }
            });

            // Get videos from the response
            const videos = vdoCipherResponse.data.rows || [];

            console.log(`Found ${videos.length} videos in folder ${planConfig.vdocipher_foldername}`);

            if (!videos.length) {
                return res.json({ courses: [] });
            }

            // Get OTP for each video
            const courses = await Promise.all(videos.map(async (video) => {
                const otpResponse = await axios({
                    method: 'post',
                    url: `https://dev.vdocipher.com/api/videos/${video.id}/otp`,
                    headers: {
                        'Authorization': `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
                        'Content-Type': 'application/json'
                    },
                    data: {
                        ttl: 300
                    }
                });

                return {
                    id: video.id,
                    title: video.title,
                    description: video.description || '',
                    poster: video.poster,
                    length: video.length,
                    otp: otpResponse.data.otp,
                    playbackInfo: otpResponse.data.playbackInfo
                };
            }));

            res.json({ courses });
        } catch (error) {
            console.error('Error:', error);
            if (error.response) {
                console.error('VdoCipher API Error:', error.response.data);
            }
            res.status(500).json({ error: error.message || "Internal Server Error" });
        }
    }
}; 