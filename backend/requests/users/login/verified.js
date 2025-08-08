const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Create base uploads directory if it doesn't exist
const UPLOADS_DIR = "backend/uploads";
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

module.exports = {
  path: "/api/v1/verifid/:email",
  method: "post",
  run: async (req, res, database) => {
    // Create user directory if it doesn't exist
    const userDir = path.join(UPLOADS_DIR, req.params.email);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    // Configure multer storage with fixed filenames
    const storage = multer.diskStorage({
      destination: function(req, file, cb) {
        cb(null, userDir);
      },
      filename: function(req, file, cb) {
        // Use fixed filenames based on field name
        if (file.fieldname === 'selfie') {
          cb(null, 'profile.png');
        } else if (file.fieldname === 'idImage') {
          cb(null, 'id.png');
        } else {
          cb(new Error('Unknown field name'));
        }
      }
    });
    
    // Create multer upload instance
    const upload = multer({ 
      storage: storage,
      fileFilter: function(req, file, cb) {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'));
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
      }
    });
    
    // Handle the upload as middleware
    const uploadMiddleware = upload.fields([
      { name: 'selfie', maxCount: 1 },
      { name: 'idImage', maxCount: 1 }
    ]);
    
    // Process the upload
    uploadMiddleware(req, res, async function(err) {
      try {
        if (err) {
          console.error('Upload error:', err);
          return res.status(400).json({ errors: [err.message] });
        }
        
        // Check if files were uploaded
        if (!req.files || !req.files.selfie || !req.files.idImage) {
          return res.status(400).json({ errors: ['Both selfie and ID image are required'] });
        }
        
        // Check if data was provided
        if (!req.body.data) {
          return res.status(400).json({ errors: ['User data is required'] });
        }
        
        // Parse user data
        let userData;
        try {
          userData = JSON.parse(req.body.data);
        } catch (e) {
          return res.status(400).json({ errors: ['Invalid user data format'] });
        }
        
        const { username, phoneNumber, accountNumber } = userData;
        
        // Validate required fields
        if (!username || !phoneNumber || !accountNumber) {
          return res.status(400).json({ errors: ['All fields are required'] });
        }
        
        // Get user from database
        const user = await database.getUser(req.params.email);
        if (!user) {
          return res.status(404).json({ errors: ['User not found'] });
        }
        
        // Verify token
        let token = req.headers.authorization;
        if (token?.startsWith('Bearer ')) {
          token = token.split('Bearer ')[1];
        }
        
        if (token !== user.token) {
          return res.status(401).json({ message: 'Invalid Authorization' });
        }
        
        if (user.verified) {
          return res.status(400).json({ message: 'User already verified' });
        }
        
        // Define file paths for database
        const selfiePath = path.join(userDir, 'profile.png');
        const idImagePath = path.join(userDir, 'id.png');
        
        // Update user in database
        await database.updateUser(req.params.email, {
          username,
          phone: phoneNumber,
          accountNumber,
          verified: true,
          status: 1,
          selfiePath,
          idImagePath
        });
        
        return res.status(200).json({ message: 'User verified and updated successfully' });
      } catch (error) {
        console.error('Error in verification:', error);
        return res.status(500).json({ errors: ['Internal server error'] });
      }
    });
  }
};