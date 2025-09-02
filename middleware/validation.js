const { body, validationResult } = require('express-validator');

const validateInput = [
    // Sanitize and validate common inputs
    body('username').optional().trim().escape().isLength({ min: 3, max: 50 }),
    body('password').optional().isLength({ min: 6, max: 100 }),
    body('name').optional().trim().escape().isLength({ min: 1, max: 100 }),
    body('aadhaar_number').optional().trim().isLength({ min: 12, max: 12 }).isNumeric(),
    body('srn').optional().trim().escape().isLength({ min: 1, max: 50 }),
    body('status').optional().isIn(['Pending', 'Approved', 'Rejected']),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }
        next();
    }
];

const validateUserCreation = [
    body('username').trim().escape().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('password').isLength({ min: 6, max: 100 }).withMessage('Password must be 6-100 characters'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }
        next();
    }
];

const validateDataRecord = [
    body('name').trim().escape().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be 1-100 characters'),
    body('aadhaar_number').trim().isLength({ min: 12, max: 12 }).isNumeric().withMessage('Aadhaar number must be exactly 12 digits'),
    body('srn').trim().escape().isLength({ min: 1, max: 50 }).withMessage('SRN is required and must be 1-50 characters'),
    body('status').isIn(['Pending', 'Approved', 'Rejected']).withMessage('Status must be Pending, Approved, or Rejected'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }
        next();
    }
];

module.exports = {
    validateInput,
    validateUserCreation,
    validateDataRecord
};
