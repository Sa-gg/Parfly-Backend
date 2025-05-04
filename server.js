import express from 'express';
import cors from 'cors'; 
import clientRoute from './routes/clientRoute.js';
import driverRoute from './routes/driverRoute.js'; 
import deliveryRoute from './routes/deliveryRoute.js'; 
import env from 'dotenv';
import axios from 'axios';

env.config();
const app = express();
const PORT = process.env.PORT || 3000;  // Use dynamic port or default to 3000

const tomtomKey = process.env.TOMTOM_API_KEY;

app.use(cors());
app.use(express.json());

app.use('/api', clientRoute);
app.use('/api', driverRoute);
app.use('/api', deliveryRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/api/search-location', async (req, res) => {
  const { q } = req.query;   // e.g. /api/search-location?q=Quezon%20City
  try {
    const { data } = await axios.get(
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json`, {
        params: { key: tomtomKey }
      }
    );
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});




