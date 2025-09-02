const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { dbHelpers } = require('../database/db');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'uploads', 'receipts');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    // Allow only PDF and image files
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only PDF and image files are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

const dataController = {
    getAllData: async (req, res) => {
        try {
            const records = await dbHelpers.getAllDataRecords();
            
            // Get assigned users for each record
            const recordsWithUsers = await Promise.all(records.map(async (record) => {
                const assignedUsers = await dbHelpers.getRecordAccessUsers(record.id);
                return { ...record, assignedUsers };
            }));

            res.json({ success: true, records: recordsWithUsers });
        } catch (error) {
            console.error('Error fetching data records:', error);
            res.status(500).json({ error: 'Failed to fetch data records' });
        }
    },

    createData: async (req, res) => {
        try {
            const { name, aadhaar_number, srn, status = 'Pending', assigned_users = [] } = req.body;

            // Create the data record
            const newRecord = await dbHelpers.createDataRecord(name, aadhaar_number, srn, status);

            // Assign users if provided
            if (assigned_users.length > 0) {
                await dbHelpers.assignRecordToUsers(newRecord.id, assigned_users);
            }

            res.json({ 
                success: true, 
                message: 'Data record created successfully',
                record: newRecord
            });

        } catch (error) {
            console.error('Error creating data record:', error);
            res.status(500).json({ error: 'Failed to create data record' });
        }
    },

    updateData: async (req, res) => {
        try {
            const recordId = parseInt(req.params.id);
            const { name, aadhaar_number, srn, status, assigned_users = [] } = req.body;

            if (isNaN(recordId)) {
                return res.status(400).json({ error: 'Invalid record ID' });
            }

            // Update the data record
            const updated = await dbHelpers.updateDataRecord(recordId, name, aadhaar_number, srn, status);
            
            if (!updated) {
                return res.status(404).json({ error: 'Record not found' });
            }

            // Update user assignments
            await dbHelpers.assignRecordToUsers(recordId, assigned_users);

            res.json({ 
                success: true, 
                message: 'Data record updated successfully'
            });

        } catch (error) {
            console.error('Error updating data record:', error);
            res.status(500).json({ error: 'Failed to update data record' });
        }
    },

    deleteData: async (req, res) => {
        try {
            const recordId = parseInt(req.params.id);
            
            if (isNaN(recordId)) {
                return res.status(400).json({ error: 'Invalid record ID' });
            }

            // Get record to check for receipt file
            const record = await dbHelpers.getDataRecordById(recordId);
            
            // Delete the record
            const deleted = await dbHelpers.deleteDataRecord(recordId);
            
            if (deleted) {
                // Delete associated receipt file if exists
                if (record && record.receipt_filename) {
                    const filePath = path.join(__dirname, '..', 'uploads', 'receipts', record.receipt_filename);
                    fs.unlink(filePath, (err) => {
                        if (err) console.error('Error deleting receipt file:', err);
                    });
                }
                
                res.json({ success: true, message: 'Data record deleted successfully' });
            } else {
                res.status(404).json({ error: 'Record not found' });
            }

        } catch (error) {
            console.error('Error deleting data record:', error);
            res.status(500).json({ error: 'Failed to delete data record' });
        }
    },

    uploadReceipt: [
        upload.single('receipt'),
        async (req, res) => {
            try {
                const recordId = parseInt(req.params.id);
                
                if (isNaN(recordId)) {
                    return res.status(400).json({ error: 'Invalid record ID' });
                }

                if (!req.file) {
                    return res.status(400).json({ error: 'No file uploaded' });
                }

                // Get current record to check for existing file
                const record = await dbHelpers.getDataRecordById(recordId);
                if (!record) {
                    // Delete uploaded file if record doesn't exist
                    fs.unlink(req.file.path, () => {});
                    return res.status(404).json({ error: 'Record not found' });
                }

                // Delete old receipt file if exists
                if (record.receipt_filename) {
                    const oldFilePath = path.join(__dirname, '..', 'uploads', 'receipts', record.receipt_filename);
                    fs.unlink(oldFilePath, (err) => {
                        if (err) console.error('Error deleting old receipt file:', err);
                    });
                }

                // Update record with new filename
                const updated = await dbHelpers.updateDataRecord(
                    recordId, 
                    record.name, 
                    record.aadhaar_number, 
                    record.srn, 
                    record.status, 
                    req.file.filename
                );

                if (updated) {
                    res.json({ 
                        success: true, 
                        message: 'Receipt uploaded successfully',
                        filename: req.file.filename
                    });
                } else {
                    // Delete uploaded file if update failed
                    fs.unlink(req.file.path, () => {});
                    res.status(500).json({ error: 'Failed to update record with receipt' });
                }

            } catch (error) {
                console.error('Error uploading receipt:', error);
                // Delete uploaded file on error
                if (req.file) {
                    fs.unlink(req.file.path, () => {});
                }
                res.status(500).json({ error: 'Failed to upload receipt' });
            }
        }
    ],

    getUserData: async (req, res) => {
        try {
            const userId = req.session.userId;
            const records = await dbHelpers.getUserDataRecords(userId);
            
            res.json({ success: true, records });
        } catch (error) {
            console.error('Error fetching user data:', error);
            res.status(500).json({ error: 'Failed to fetch user data' });
        }
    },

    downloadReceipt: async (req, res) => {
        try {
            const { filename } = req.params;
            const userId = req.session.userId;
            const userRole = req.session.role;

            // Validate filename
            if (!filename || filename.includes('..') || filename.includes('/')) {
                return res.status(400).json({ error: 'Invalid filename' });
            }

            const filePath = path.join(__dirname, '..', 'uploads', 'receipts', filename);

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'File not found' });
            }

            // For non-admin users, check if they have access to this file
            if (userRole !== 'admin') {
                // Find the record with this filename
                const records = await dbHelpers.getUserDataRecords(userId);
                const hasAccess = records.some(record => record.receipt_filename === filename);
                
                if (!hasAccess) {
                    return res.status(403).json({ error: 'Access denied' });
                }
            }

            // Send file
            res.download(filePath, (err) => {
                if (err) {
                    console.error('Error downloading file:', err);
                    res.status(500).json({ error: 'Failed to download file' });
                }
            });

        } catch (error) {
            console.error('Error downloading receipt:', error);
            res.status(500).json({ error: 'Failed to download receipt' });
        }
    }
};

module.exports = dataController;
