const Booking = require('../models/Booking');
const Event = require('../models/Event');
const cleanupExpiredEvents = require('../utils/cleanupExpiredEvents');

const releaseSeat = async (booking) => {
    await Event.updateOne(
        { _id: booking.event, "seats.seatNumber": booking.seatNumber },
        { $set: { "seats.$.isBooked": false } }
    );
};

// Create a new booking
const createBooking = async (req, res) => {
    try {
        await cleanupExpiredEvents();

        const { eventId, seatNumber } = req.body;

        if (req.user.role === "admin") {
            return res.status(403).json({ message: "Admins cannot book event seats" });
        }

        if (!eventId || !seatNumber) {
            return res.status(400).json({ message: "Event ID and seat number are required" });
        }

        const eventExists = await Event.exists({ _id: eventId });

        if (!eventExists) {
            return res.status(404).json({ message: "Event not found" });
        }

        const seatExists = await Event.exists({
            _id: eventId,
            "seats.seatNumber": seatNumber
        });

        if (!seatExists) {
            return res.status(404).json({ message: "Seat not found" });
        }

        const event = await Event.findOneAndUpdate(
            {
                _id: eventId,
                seats: {
                    $elemMatch: {
                        seatNumber,
                        isBooked: false
                    }
                }
            },
            { $set: { "seats.$.isBooked": true } },
            { new: true }
        );

        if (!event) {
            return res.status(400).json({ message: "Seat is already booked" });
        }

        let booking;

        try {
            booking = await Booking.create({
                user: req.user._id,
                event: event._id,
                seatNumber,
            });
        } catch (bookingError) {
            await releaseSeat({ event: event._id, seatNumber });
            throw bookingError;
        }

        res.status(201).json({ message: "Booking created successfully", booking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to cancel this booking" });
        }

        await releaseSeat(booking);
        await Booking.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Booking cancelled successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get logged in user's bookings
const getMyBookings = async (req, res) => {
    try {
        await cleanupExpiredEvents();
        const bookings = await Booking.find({ user: req.user._id }).populate('event');

        res.status(200).json({ bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const getAllBookings = async (req, res) => {
    try {
        await cleanupExpiredEvents();
        const bookings = await Booking.find()
            .populate("user", "name email role")
            .populate("event", "title date time price")
            .sort({ createdAt: -1 });

        res.status(200).json({ bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    createBooking,
    cancelBooking,
    getMyBookings,
    getAllBookings,
};
