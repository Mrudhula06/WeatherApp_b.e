const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const apiKey = process.env.OPENWEATHERMAP_API_KEY;
const mongoURI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Enable CORS
app.use(cors());

// Weather schema
const weatherSchema = new mongoose.Schema({
  city: { type: String, required: true },
  description: { type: String, required: true },
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  wind: { type: Number, required: true },
  // data: { type: Object, required: true },
  date: { type: Date, default: Date.now }
});

const Weather = mongoose.model('climate', weatherSchema);

// Express middleware
app.use(express.json());

// Routes
app.post('/weather', async (req, res) => {
  const { city } = req.body;

  try {
    // Fetch data from OpenWeatherMap API
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
    const data = response.data;

    // Extract relevant data
    const description = data.weather[0].description;
    const temperature = data.main.temp;
    const humidity = data.main.humidity;
    const wind = data.wind.speed;

    // Save data to database
    const weatherData = new Weather({ 
      city, 
      description, 
      temperature, 
      humidity, 
      wind, 
      data 
    });
    await weatherData.save();

    res.json(weatherData);
  } catch (err) {
    console.error('Error fetching or saving weather data:', err);

    if (err.response) {
      res.status(err.response.status).json({ message: err.response.data.message });
    } else if (err.request) {
      res.status(500).json({ message: 'No response from weather service' });
    } else {
      res.status(500).json({ message: 'Error setting up request' });
    }
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
