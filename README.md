# Secure User Management System

A comprehensive web application with role-based authentication, user management, and secure data handling.

## Features

### 🔐 Security Features
- **Bcrypt password hashing** with salt rounds of 12
- **Session-based authentication** with secure cookies
- **Rate limiting** for login attempts and general requests
- **Input validation and sanitization** to prevent XSS and injection attacks
- **CSRF protection** via express-session
- **Helmet.js** for security headers
- **File upload validation** with type and size restrictions

### 👥 User Roles

#### Admin (admin / Uidai@2003)
- Create and delete user accounts
- Manage all data records (CRUD operations)
- Upload receipt files for records
- Assign record access to specific users
- View all system data

#### Regular Users
- View only assigned data records
- Download receipt files for accessible records
- Cannot create, edit, or delete any content

### 📊 Data Management
- **Auto-incrementing S.No.** for all records
- **Aadhaar number validation** (12 digits)
- **Status tracking** (Pending, Approved, Rejected)
- **File upload/download** for receipts (PDF, images)
- **User access control** per record

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation Steps

1. **Install dependencies:**
```bash
npm install
```

2. **Start the application:**
```bash
npm start
```

3. **For development (with auto-restart):**
```bash
npm run dev
```

4. **Access the application:**
- Open your browser and go to `http://localhost:3000`
- Login with admin credentials: `admin` / `Uidai@2003`

## Project Structure

```
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── database/
│   └── db.js                 # SQLite database setup and helpers
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── userController.js     # User management
│   └── dataController.js     # Data and file management
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── validation.js        # Input validation
├── public/
│   ├── index.html           # Login page
│   ├── admin_dashboard.html # Admin interface
│   ├── user_dashboard.html  # User interface
│   ├── styles.css           # Responsive styling
│   └── scripts.js           # Frontend JavaScript
└── uploads/
    └── receipts/            # Uploaded receipt files
```

## Database Schema

### Users Table
- `id` (Primary Key)
- `username` (Unique)
- `password` (Bcrypt hashed)
- `role` (admin/user)
- `created_at`

### Data Records Table
- `id` (Primary Key, S.No.)
- `name`
- `aadhaar_number` (12 digits)
- `srn`
- `status` (Pending/Approved/Rejected)
- `receipt_filename`
- `created_at`
- `updated_at`

### User Access Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `record_id` (Foreign Key)
- `created_at`

## API Endpoints

### Authentication
- `POST /login` - User login
- `POST /logout` - User logout

### Admin Routes
- `GET /admin/dashboard` - Admin dashboard page
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/data` - Get all data records
- `POST /api/admin/data` - Create data record
- `PUT /api/admin/data/:id` - Update data record
- `DELETE /api/admin/data/:id` - Delete data record
- `POST /api/admin/data/:id/upload` - Upload receipt

### User Routes
- `GET /user/dashboard` - User dashboard page
- `GET /api/user/data` - Get assigned records
- `GET /api/user/download/:filename` - Download receipt

## Security Measures

1. **Password Security**
   - Bcrypt hashing with 12 salt rounds
   - Minimum 6 character requirement

2. **Session Security**
   - HttpOnly cookies
   - 24-hour session expiry
   - Secure session management

3. **Rate Limiting**
   - 100 requests per 15 minutes (general)
   - 5 login attempts per 15 minutes

4. **Input Validation**
   - Server-side validation for all inputs
   - XSS prevention via input sanitization
   - File type and size validation

5. **Access Control**
   - Role-based route protection
   - Record-level access control
   - File download authorization

## Usage Guide

### Admin Workflow
1. Login with admin credentials
2. **User Management Tab:**
   - Create new users with username/password
   - View all users and delete if needed
3. **Data Management Tab:**
   - Add new records with required fields
   - Assign records to specific users
   - Upload receipt files
   - Update record status

### User Workflow
1. Login with provided credentials
2. View assigned records in dashboard
3. Download receipt files if available
4. Cannot modify any data

## File Upload
- **Supported formats:** PDF, JPG, JPEG, PNG, GIF
- **Maximum size:** 5MB per file
- **Storage:** Local filesystem with UUID filenames
- **Security:** File type validation and access control

## Development Notes

- SQLite database for simplicity (easily replaceable)
- Responsive design for mobile compatibility
- Modern ES6+ JavaScript
- Error handling and user feedback
- Audit trail via timestamps

## Production Deployment

For production deployment:

1. **Environment Variables:**
   - Set `NODE_ENV=production`
   - Change session secret
   - Configure HTTPS

2. **Database:**
   - Consider PostgreSQL or MySQL for production
   - Set up proper database backups

3. **Security:**
   - Enable HTTPS
   - Set secure cookie flags
   - Configure proper CORS if needed

4. **File Storage:**
   - Consider cloud storage (AWS S3, etc.)
   - Implement proper backup strategy

## Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Ensure write permissions in database directory
   - Check SQLite installation

2. **File upload issues:**
   - Verify uploads/receipts directory exists
   - Check file permissions

3. **Session issues:**
   - Clear browser cookies
   - Restart server

### Support
For issues or questions, check the console logs for detailed error messages.
