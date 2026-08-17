import User from '../models/User.js';

export const isAdmin = async (req, res, next) => {
    try {
        // We look for 'x-admin-email' header to verify admin status
        const adminEmail = req.headers['x-admin-email'];
        
        if (!adminEmail) {
            return res.status(401).json({ message: 'Authorization required. Missing admin email header.' });
        }

        const user = await User.findOne({ email: adminEmail.trim().toLowerCase() });
        
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
        }

        // Attach user to request for downstream handlers
        req.user = user;
        next();
    } catch (error) {
        console.error("Authorization middleware error:", error);
        res.status(500).json({ message: 'Server error during authorization' });
    }
};
