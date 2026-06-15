const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
{
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String,
        required: true,
        match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    price : {
        type: Number,
        required: true,
        min: 0,
    },
    seats: [
        { 
            seatNumber: String, 
            isBooked: {
                type :Boolean,
                default: false
            }
        }
    ]
}, {timestamps: true});



module.exports = mongoose.model('Event', eventSchema);
