const bcrypt = require('bcrypt');
const { dbHelpers } = require('../database/db');

const userController = {
    getUsers: async (req, res) => {
        try {
            const users = await dbHelpers.getAllUsers();
            res.json({ success: true, users });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    },

    createUser: async (req, res) => {
        try {
            const { username, password } = req.body;

            // Check if username already exists
            const existingUser = await dbHelpers.getUserByUsername(username);
            if (existingUser) {
                return res.status(400).json({ error: 'Username already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create user
            const newUser = await dbHelpers.createUser(username, hashedPassword, 'user');
            
            res.json({ 
                success: true, 
                message: 'User created successfully',
                user: { id: newUser.id, username: newUser.username, role: newUser.role }
            });

        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    },

    deleteUser: async (req, res) => {
        try {
            const userId = parseInt(req.params.id);
            
            if (isNaN(userId)) {
                return res.status(400).json({ error: 'Invalid user ID' });
            }

            const deleted = await dbHelpers.deleteUser(userId);
            
            if (deleted) {
                res.json({ success: true, message: 'User deleted successfully' });
            } else {
                res.status(404).json({ error: 'User not found or cannot be deleted' });
            }

        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ error: 'Failed to delete user' });
        }
    }
};

module.exports = userController;
