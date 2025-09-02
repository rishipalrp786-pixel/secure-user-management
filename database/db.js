const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Data records table
    db.run(`CREATE TABLE IF NOT EXISTS data_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        aadhaar_number TEXT NOT NULL,
        srn TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        receipt_filename TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // User access table (many-to-many relationship)
    db.run(`CREATE TABLE IF NOT EXISTS user_access (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        record_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (record_id) REFERENCES data_records (id) ON DELETE CASCADE,
        UNIQUE(user_id, record_id)
    )`);

    // Create default admin user
    createDefaultAdmin();
}

// Create default admin user
async function createDefaultAdmin() {
    const adminUsername = 'admin';
    const adminPassword = 'Uidai@2003';
    
    try {
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        
        db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
            [adminUsername, hashedPassword, 'admin'],
            function(err) {
                if (err) {
                    console.error('Error creating admin user:', err.message);
                } else if (this.changes > 0) {
                    console.log('Default admin user created successfully');
                }
            }
        );
    } catch (error) {
        console.error('Error hashing admin password:', error);
    }
}

// Database helper functions
const dbHelpers = {
    // User operations
    getUserByUsername: (username) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    getUserById: (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    getAllUsers: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT id, username, role, created_at FROM users WHERE role != "admin"', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    createUser: (username, hashedPassword, role = 'user') => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                [username, hashedPassword, role],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, username, role });
                }
            );
        });
    },

    deleteUser: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM users WHERE id = ? AND role != "admin"', [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes > 0);
            });
        });
    },

    // Data record operations
    getAllDataRecords: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM data_records ORDER BY id DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    getDataRecordById: (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM data_records WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    createDataRecord: (name, aadhaarNumber, srn, status = 'Pending') => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO data_records (name, aadhaar_number, srn, status) VALUES (?, ?, ?, ?)',
                [name, aadhaarNumber, srn, status],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, name, aadhaar_number: aadhaarNumber, srn, status });
                }
            );
        });
    },

    updateDataRecord: (id, name, aadhaarNumber, srn, status, receiptFilename = null) => {
        return new Promise((resolve, reject) => {
            const query = receiptFilename 
                ? 'UPDATE data_records SET name = ?, aadhaar_number = ?, srn = ?, status = ?, receipt_filename = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
                : 'UPDATE data_records SET name = ?, aadhaar_number = ?, srn = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            
            const params = receiptFilename 
                ? [name, aadhaarNumber, srn, status, receiptFilename, id]
                : [name, aadhaarNumber, srn, status, id];

            db.run(query, params, function(err) {
                if (err) reject(err);
                else resolve(this.changes > 0);
            });
        });
    },

    deleteDataRecord: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM data_records WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes > 0);
            });
        });
    },

    // User access operations
    getUserDataRecords: (userId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT dr.* FROM data_records dr
                INNER JOIN user_access ua ON dr.id = ua.record_id
                WHERE ua.user_id = ?
                ORDER BY dr.id DESC
            `;
            db.all(query, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    getRecordAccessUsers: (recordId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT u.id, u.username FROM users u
                INNER JOIN user_access ua ON u.id = ua.user_id
                WHERE ua.record_id = ?
            `;
            db.all(query, [recordId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    assignRecordToUser: (recordId, userId) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT OR IGNORE INTO user_access (user_id, record_id) VALUES (?, ?)',
                [userId, recordId],
                function(err) {
                    if (err) reject(err);
                    else resolve(true);
                }
            );
        });
    },

    assignRecordToUsers: (recordId, userIds) => {
        return new Promise((resolve, reject) => {
            // First, remove existing assignments
            db.run('DELETE FROM user_access WHERE record_id = ?', [recordId], (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!userIds || userIds.length === 0) {
                    resolve(true);
                    return;
                }

                // Insert new assignments
                const placeholders = userIds.map(() => '(?, ?)').join(', ');
                const values = userIds.flatMap(userId => [userId, recordId]);
                
                db.run(`INSERT INTO user_access (user_id, record_id) VALUES ${placeholders}`, values, function(err) {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        });
    },

    hasUserAccess: (userId, recordId) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT 1 FROM user_access WHERE user_id = ? AND record_id = ?', [userId, recordId], (err, row) => {
                if (err) reject(err);
                else resolve(!!row);
            });
        });
    }
};

module.exports = { db, dbHelpers };
