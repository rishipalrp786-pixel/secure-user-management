const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Import controllers
const authController = require('./controllers/authController');
const userController = require('./controllers/userController');
const dataController = require('./controllers/dataController');
const { authenticateAdmin, authenticateUser } = require('./middleware/auth');
const { validateInput } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render.com
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Login rate limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login requests per windowMs
    skipSuccessfulRequests: true,
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'receipts');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Authentication routes
app.post('/login', loginLimiter, validateInput, authController.login);
app.post('/logout', authController.logout);
app.get('/api/auth/check', authController.checkAuth);

// Admin routes
app.get('/admin/dashboard', authenticateAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin_dashboard.html'));
});

app.get('/api/admin/users', authenticateAdmin, userController.getUsers);
app.post('/api/admin/users', authenticateAdmin, validateInput, userController.createUser);
app.delete('/api/admin/users/:id', authenticateAdmin, userController.deleteUser);

app.get('/api/admin/data', authenticateAdmin, dataController.getAllData);
app.post('/api/admin/data', authenticateAdmin, validateInput, dataController.createData);
app.put('/api/admin/data/:id', authenticateAdmin, validateInput, dataController.updateData);
app.delete('/api/admin/data/:id', authenticateAdmin, dataController.deleteData);
app.post('/api/admin/data/:id/upload', authenticateAdmin, dataController.uploadReceipt);

// User routes
app.get('/user/dashboard', authenticateUser, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user_dashboard.html'));
});

app.get('/api/user/data', authenticateUser, dataController.getUserData);
app.get('/api/user/download/:filename', authenticateUser, dataController.downloadReceipt);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Page not found' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
});

module.exports = app;
