const authenticateAdmin = (req, res, next) => {
    console.log('Auth check - Session:', req.session);
    console.log('Auth check - UserId:', req.session.userId);
    console.log('Auth check - Role:', req.session.role);
    
    if (!req.session.userId || req.session.role !== 'admin') {
        console.log('Auth failed - redirecting to login');
        return res.status(401).json({ error: 'Admin access required' });
    }
    next();
};

const authenticateUser = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

const authenticateAny = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

module.exports = {
    authenticateAdmin,
    authenticateUser,
    authenticateAny
};
