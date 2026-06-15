const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const {
    createEvent,
    getAllEvents,
    getEventsById,
    updateEvent,
    deleteEvent
} = require('../controllers/eventController');

router.post('/', protect, adminOnly, createEvent);
router.get('/', getAllEvents);
router.get('/:id', getEventsById);
router.put('/:id', protect, adminOnly, updateEvent);
router.delete('/:id', protect, adminOnly, deleteEvent);

module.exports = router;
