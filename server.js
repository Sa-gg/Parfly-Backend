import express from "express";
import cors from "cors";
import clientRoute from "./routes/clientRoute.js";
import driverRoute from "./routes/driverRoute.js";
import deliveryRoute from "./routes/deliveryRoute.js";
import reportRoute from "./routes/reportRoute.js";
import authRoute from "./routes/authRoute.js";
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
app.use("/api",  authRoute)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Welcome to Parlfy Backend" });
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
    // Step 1: Try nearby POI search
    const poiRes = await axios.get(
      `https://api.tomtom.com/search/2/nearbySearch/.JSON`,
      {
        params: {
          key: process.env.TOMTOM_API_KEY,
          lat,
          lon,
          radius: 50, // 50 meters search radius
          limit: 1,
        },
      }
    );

    let poiName = null;
    let streetName = null;
    let freeformAddress = null;

    const poiResult = poiRes.data.results?.[0];

    if (poiResult) {
      poiName = poiResult.poi?.name || null;
      streetName = poiResult.address?.streetName || null;
      freeformAddress = poiResult.address?.freeformAddress || null;
    }

    // Step 2: If no POI found, fallback to reverse geocode for freeform address
    if (!poiResult) {
      const reverseRes = await axios.get(
        `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.JSON`,
        {
          params: {
            key: process.env.TOMTOM_API_KEY,
          },
        }
      );

      const reverseAddress = reverseRes.data.addresses?.[0]?.address;

      if (reverseAddress) {
        freeformAddress = reverseAddress.freeformAddress || null;
        streetName = reverseAddress.streetName || null;
      } else {
        return res.status(404).json({ error: "No address found" });
      }
    }

    res.json({
      poi: {
        name: poiName,
      },
      address: {
        streetName,
        freeformAddress,
      },
    });
  } catch (err) {
    console.error("Geocoding error:", err.message || err);
    res.status(500).json({ error: "Geocoding failed" });
  }
});

app.get("/api/route-distance", async (req, res) => {
  const { pickup_lat, pickup_lon, dropoff_lat, dropoff_lon } = req.query;

  if (!pickup_lat || !pickup_lon || !dropoff_lat || !dropoff_lon) {
    return res.status(400).json({ error: "All coordinates are required." });
  }

  try {
    const routeUrl = `https://api.tomtom.com/routing/1/calculateRoute/${pickup_lat},${pickup_lon}:${dropoff_lat},${dropoff_lon}/json`;

    const { data } = await axios.get(routeUrl, {
      params: {
        key: tomtomKey,
        travelMode: "motorcycle",
        routeType: "fastest",
        traffic: true,
        vehicleMaxSpeed: 60, // optional: specify motorcycle speed
      },
    });

    const route = data.routes?.[0];
    if (!route) {
      return res.status(404).json({ error: "No route found." });
    }

    const { lengthInMeters, travelTimeInSeconds, trafficDelayInSeconds } =
      route.summary;

    res.json({
      distanceInMeters: lengthInMeters,
      distanceInKm: (lengthInMeters / 1000).toFixed(2),
      durationInSeconds: travelTimeInSeconds,
      durationInMinutes: Math.ceil(travelTimeInSeconds / 60),
      trafficDelayInSeconds, // Additional time caused by traffic
      trafficDelayInMinutes: Math.ceil(trafficDelayInSeconds / 60),
    });
  } catch (error) {
    console.error("Route calculation error:", error.message || error);
    res.status(500).json({ error: "Failed to calculate route distance." });
  }
});
