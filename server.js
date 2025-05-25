import express from "express";
import cors from "cors";
import clientRoute from "./routes/clientRoute.js";
import driverRoute from "./routes/driverRoute.js";
import deliveryRoute from "./routes/deliveryRoute.js";
import reportRoute from "./routes/reportRoute.js";
import env from "dotenv";
import axios from "axios";

env.config();
const app = express();
const PORT = process.env.PORT || 3000; // Use dynamic port or default to 3000
// const PORT = 3000;

const tomtomKey = process.env.TOMTOM_API_KEY;

app.use(cors());
app.use(express.json());

app.use("/api", clientRoute);
app.use("/api", driverRoute);
app.use("/api", deliveryRoute);
app.use("/api", reportRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// http://localhost:3000/api/search-location?q=inday&lat=10.6765&lon=122.9509
// http://localhost:3000/api/search-location?q=inday

app.get("/api/search-location", async (req, res) => {
  const { q, lat, lon } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Query parameter q is required" });
  }

  try {
    const params = {
      key: tomtomKey,
      fuzzyLevel: 2, // improve typo tolerance (0-2)
      limit: 10, // limit results for performance
      bbox: "9.5,122.3,11.2,123.0", // approx bbox for Negros Occidental
    };

    // Add lat/lon bias if valid
    if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
      params.lat = lat;
      params.lon = lon;
    }

    const { data } = await axios.get(
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json`,
      { params }
    );

    // Looser filter for Negros Occidental by checking multiple address fields
    const filteredResults = data.results.filter((result) => {
      const addr = result.address || {};
      const province = (addr.countrySecondarySubdivision || "").toLowerCase();
      const municipalitySubdivision = (
        addr.municipalitySubdivision || ""
      ).toLowerCase();
      const municipality = (addr.municipality || "").toLowerCase();
      const freeform = (addr.freeformAddress || "").toLowerCase();

      return (
        province.includes("negros occidental") ||
        municipalitySubdivision.includes("negros occidental") ||
        municipality.includes("negros occidental") ||
        freeform.includes("negros occidental") ||
        municipality.includes("bacolod") ||
        freeform.includes("bacolod")
      );
    });

    res.json({
      ...data,
      results: filteredResults,
    });
  } catch (err) {
    console.error("Search-location error:", err.message || err);
    res.status(500).json({ error: "Search failed" });
  }
});

app.get("/api/reverse-geocode", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: "Missing lat or lon" });
  }
  try {
    // Using TomTom Reverse Geocode API
    const { data } = await axios.get(
      `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.JSON`,
      { params: { key: process.env.TOMTOM_API_KEY } }
    );
    // TomTom nests freeformAddress at data.addresses[0].address.freeformAddress
    const address =
      data.addresses &&
      data.addresses[0] &&
      data.addresses[0].address.freeformAddress;
    if (address) {
      res.json({ freeformAddress: address });
    } else {
      res.status(404).json({ error: "No address found" });
    }
  } catch (err) {
    console.error("Reverse geocode error:", err);
    res.status(500).json({ error: "Reverse geocode failed" });
  }
});
