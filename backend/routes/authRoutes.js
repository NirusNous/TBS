const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

const {
    registerUser,
    loginUser,
    getAllUsers,
    deleteUser
} = require('../controllers/authController');

// user
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/users', protect, adminOnly, getAllUsers);
router.delete('/users/:id', protect, adminOnly, deleteUser);

module.exports = router;
