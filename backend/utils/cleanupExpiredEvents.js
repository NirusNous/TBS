const Booking = require('../models/Booking');
const Event = require('../models/Event');

const getEventDateValue = (date) => {
    if (!date) {
        return null;
    }

    if (date instanceof Date) {
        return date.toISOString().slice(0, 10);
    }

    return String(date).slice(0, 10);
};

const getEventDateTime = (event) => {
    const dateValue = getEventDateValue(event.date);

    if (!dateValue || !event.time) {
        return null;
    }

    const eventDateTime = new Date(`${dateValue}T${event.time}`);

    if (Number.isNaN(eventDateTime.getTime())) {
        return null;
    }

    return eventDateTime;
};

const cleanupExpiredEvents = async () => {
    const events = await Event.find().select('_id date time');
    const now = new Date();
    const expiredEventIds = events
        .filter((event) => {
            const eventDateTime = getEventDateTime(event);

            return eventDateTime && eventDateTime <= now;
        })
        .map(event => event._id);

    if (expiredEventIds.length === 0) {
        return 0;
    }

    await Booking.deleteMany({ event: { $in: expiredEventIds } });
    await Event.deleteMany({ _id: { $in: expiredEventIds } });

    return expiredEventIds.length;
};

module.exports = cleanupExpiredEvents;
