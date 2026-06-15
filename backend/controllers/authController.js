const User = require("../models/User");
const Booking = require("../models/Booking");
const Event = require("../models/Event");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const createToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const toPublicUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
});

const releaseBookings = async (bookings) => {
    await Promise.all(
        bookings.map(async (booking) => {
            await Event.updateOne(
                { _id: booking.event, "seats.seatNumber": booking.seatNumber },
                { $set: { "seats.$.isBooked": false } }
            );
        })
    );
};

// newUser registration controller
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "user",
        });

        const token = createToken(user._id);

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: toPublicUser(user),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }   
};


// user login controller
const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect Password" });
        }

        const token = createToken(user._id);

        res.json({
            token,
            message: "Login successful",
            user: toPublicUser(user),
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot delete your own account" });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "admin") {
            return res.status(400).json({ message: "Admin accounts cannot be deleted here" });
        }

        const bookings = await Booking.find({ user: user._id });

        await releaseBookings(bookings);
        await Booking.deleteMany({ user: user._id });
        await User.findByIdAndDelete(user._id);

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};


module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    deleteUser,
};
