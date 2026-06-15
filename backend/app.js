require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');  
const cleanupExpiredEvents = require('./utils/cleanupExpiredEvents');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const port = process.env.PORT || 5000;



connectDB().then(() => {
    cleanupExpiredEvents().catch(error => {
        console.error("Expired event cleanup failed:", error);
    });

    setInterval(() => {
        cleanupExpiredEvents().catch(error => {
            console.error("Expired event cleanup failed:", error);
        });
    }, 60 * 1000);
});

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);


app.listen(port, (error) => {
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ port);
    else 
        console.log("Error occurred, server can't start", error);
}
);


app.get('/', (req, res) => {
    res.status(200);
    res.send('this is the Root url of the server');
});
