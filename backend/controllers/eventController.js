// Events CRUD

const Event = require('../models/Event');
const Booking = require('../models/Booking');
const cleanupExpiredEvents = require('../utils/cleanupExpiredEvents');

// Helper function to generate seats for an event
const generateSeats = () => {
    const seats = [];
    const rows = ['A', 'B', 'C', 'D', 'E'];

    rows.forEach(row => {
        for (let i = 1; i <= 10; i++) {
            seats.push({ seatNumber: `${row}${i}`, isBooked: false });
        }
    });

    return seats;
};

const getEventDateTime = (date, time) => {
    if (!date || !time) {
        return null;
    }

    const eventDateTime = new Date(`${date}T${time}`);

    if (Number.isNaN(eventDateTime.getTime())) {
        return null;
    }

    return eventDateTime;
};

const isPastEventDateTime = (date, time) => {
    const eventDateTime = getEventDateTime(date, time);

    return !eventDateTime || eventDateTime <= new Date();
};

// Create a new event
const createEvent = async (req, res) => {
    try {
        const { title, description, date, time, price } = req.body;
        const numericPrice = Number(price);

        if (Number.isNaN(numericPrice) || numericPrice < 0) {
            return res.status(400).json({ message: "Price cannot be negative" });
        }

        if (isPastEventDateTime(date, time)) {
            return res.status(400).json({ message: "Event date and time must be in the future" });
        }

        const newEvent = await Event.create({
            title,
            description,
            date,
            time,
            price: numericPrice,
            seats: generateSeats(),
        });

        res.status(201).json({ message: "Event created successfully", event: newEvent });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all events
const getAllEvents = async (req, res) => {
    try {
        await cleanupExpiredEvents();
        const events = await Event.find();
        res.status(200).json({ events });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get event by ID
const getEventsById = async (req, res) => {
    try {
        await cleanupExpiredEvents();
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.status(200).json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update an event
const updateEvent = async (req, res) => {
    try {
        await cleanupExpiredEvents();

        if (req.body.date !== undefined || req.body.time !== undefined) {
            const existingEvent = await Event.findById(req.params.id);

            if (!existingEvent) {
                return res.status(404).json({ message: "Event not found" });
            }

            const nextDate = req.body.date || existingEvent.date.toISOString().slice(0, 10);
            const nextTime = req.body.time || existingEvent.time;

            if (isPastEventDateTime(nextDate, nextTime)) {
                return res.status(400).json({ message: "Event date and time must be in the future" });
            }
        }

        if (req.body.price !== undefined) {
            const numericPrice = Number(req.body.price);

            if (Number.isNaN(numericPrice) || numericPrice < 0) {
                return res.status(400).json({ message: "Price cannot be negative" });
            }

            req.body.price = numericPrice;
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedEvent) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.status(200).json({
            message: "Event updated successfully",
            event: updatedEvent
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete an event
const deleteEvent = async (req, res) => {
    try {
        const deletedEvent = await Event.findByIdAndDelete(req.params.id);

        if (!deletedEvent) {
            return res.status(404).json({ message: "Event not found" });
        }

        await Booking.deleteMany({ event: req.params.id });

        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    createEvent,
    getAllEvents,
    getEventsById,
    updateEvent,
    deleteEvent
};
