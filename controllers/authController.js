const bcrypt = require('bcrypt');
const { dbHelpers } = require('../database/db');

const authController = {
    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required' });
            }

            // Get user from database
            const user = await dbHelpers.getUserByUsername(username);
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Create session
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;

            // Redirect based on role
            const redirectUrl = user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
            
            res.json({ 
                success: true, 
                message: 'Login successful',
                role: user.role,
                redirectUrl: redirectUrl
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).json({ error: 'Could not log out' });
            }
            res.json({ success: true, message: 'Logged out successfully' });
        });
    },

    checkAuth: (req, res) => {
        if (req.session.userId) {
            res.json({
                authenticated: true,
                role: req.session.role,
                username: req.session.username
            });
        } else {
            res.json({ authenticated: false });
        }
    }
};

module.exports = authController;
