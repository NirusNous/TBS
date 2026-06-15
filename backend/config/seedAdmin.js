const User = require("../models/User");
const bcrypt = require("bcryptjs");


const seedAdmin = async () => {
    try {
        const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
        
        if (existingAdmin) {
            console.log("Admin user already exists");
            return;
        }

        const hashedPassword = await bcrypt.hash(
            process.env.ADMIN_PASSWORD,
            10
        );

        await User.create({
            name: process.env.ADMIN_NAME,
            email: process.env.ADMIN_EMAIL,
            password: hashedPassword,
            role: "admin"
        });

        console.log("Admin user seeded successfully");
    } catch (error) {
        console.error("Error seeding admin user:", error);
    }
};

module.exports = seedAdmin;