require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./auth.routes');
const tweetsRoutes = require('./tweets.routes');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tweets', tweetsRoutes);

app.get('/', (req, res) => {
  res.send('Forekast backend server is running smoothly!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});