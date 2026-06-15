const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const {
    createBooking,
    cancelBooking,
    getMyBookings,
    getAllBookings
} = require('../controllers/bookingController');

router.post('/', protect, createBooking);
router.get('/', protect, adminOnly, getAllBookings);
router.get('/my-bookings', protect, getMyBookings);
router.delete('/:id', protect, cancelBooking);

module.exports = router;
