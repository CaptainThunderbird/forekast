const express = require('express');
const cors = require('cors');
const authRoutes = require('./auth.routes');
const tweetRoutes = require('./tweets.routes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json()); // Essential for parsing incoming req.body JSON data

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tweets', tweetRoutes);

// Base Health Check
app.get('/', (req, res) => {
  res.send('Forekast backend server is running smoothly!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});