import express from "express";
import cors from "cors";
import http from "http"; // ✅ Needed for socket.io
import { Server } from "socket.io"; // ✅ Socket.IO server
import clientRoute from "./routes/clientRoute.js";
import driverRoute from "./routes/driverRoute.js";
import deliveryRoute from "./routes/deliveryRoute.js";
import reportRoute from "./routes/reportRoute.js";
import authRoute from "./routes/authRoute.js";
import clientDeliveryRoute from "./routes/clientDeliveryRoute.js";
import driverDeliveryRoutes from "./routes/driverDeliveryRoutes.js";
import env from "dotenv";
import axios from "axios";
import { query } from "./db.js";

env.config();

const app = express();
const server = http.createServer(app); // ✅ Wrap express in HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins — customize for production
  },
});

// const PORT = process.env.PORT || 3000;
const PORT = process.env.PORT || 3001;
const tomtomKey = process.env.TOMTOM_API_KEY;

app.use(cors());
app.use(express.json());

app.use("/api", clientRoute);
app.use("/api", driverRoute);
app.use("/api", deliveryRoute);
app.use("/api", reportRoute);
app.use("/api", authRoute);
app.use("/api", clientDeliveryRoute);
app.use("/api", driverDeliveryRoutes);

// Start server using http server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Health check and default routes
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Welcome to Parlfy Backend" });
});

// Location search
app.get("/api/search-location", async (req, res) => {
  const { q, lat, lon } = req.query;
  if (!q)
    return res.status(400).json({ error: "Query parameter q is required" });

  try {
    const params = {
      key: tomtomKey,
      fuzzyLevel: 2,
      limit: 10,
      bbox: "9.5,122.3,11.2,123.0",
    };

    if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
      params.lat = lat;
      params.lon = lon;
    }

    const { data } = await axios.get(
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json`,
      { params }
    );

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

    res.json({ ...data, results: filteredResults });
  } catch (err) {
    console.error("Search-location error:", err.message || err);
    res.status(500).json({ error: "Search failed" });
  }
});

// Reverse geocoding
app.get("/api/reverse-geocode", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon)
    return res.status(400).json({ error: "Missing lat or lon" });

  try {
    const poiRes = await axios.get(
      `https://api.tomtom.com/search/2/nearbySearch/.JSON`,
      {
        params: {
          key: process.env.TOMTOM_API_KEY,
          lat,
          lon,
          radius: 50,
          limit: 1,
        },
      }
    );

    let poiName = null;
    let address = null;

    const poiResult = poiRes.data.results?.[0];
    if (poiResult) {
      poiName = poiResult.poi?.name || null;
      address = poiResult.address || null;
    }

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
        address = reverseAddress;
      } else {
        return res.status(404).json({ error: "No address found" });
      }
    }

    res.json({ poi: { name: poiName }, address });
  } catch (err) {
    console.error("Geocoding error:", err.message || err);
    res.status(500).json({ error: "Geocoding failed" });
  }
});

// Route distance
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
        vehicleMaxSpeed: 60,
      },
    });

    const route = data.routes?.[0];
    if (!route) return res.status(404).json({ error: "No route found." });

    const { lengthInMeters, travelTimeInSeconds, trafficDelayInSeconds } =
      route.summary;

    res.json({
      distanceInMeters: lengthInMeters,
      distanceInKm: (lengthInMeters / 1000).toFixed(2),
      durationInSeconds: travelTimeInSeconds,
      durationInMinutes: Math.ceil(travelTimeInSeconds / 60),
      trafficDelayInSeconds,
      trafficDelayInMinutes: Math.ceil(trafficDelayInSeconds / 60),
    });
  } catch (error) {
    console.error("Route calculation error:", error.message || error);
    res.status(500).json({ error: "Failed to calculate route distance." });
  }
});

io.on("connection", (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  // ✅ Handle start_trip event
  socket.on("start_trip", async ({ delivery_id, etaSeconds }) => {
    const arrivalTime = new Date(Date.now() + etaSeconds * 1000);

    try {
      // Update the delivery record in the database
      await query(
        `UPDATE deliveries SET arrival_time = $1, last_eta_update = NOW(), is_arrived = false WHERE id = $2`,
        [arrivalTime, delivery_id]
      );

      // Emit real-time event to customer or frontend
      io.emit(`delivery_${delivery_id}`, {
        type: "arrival_timer_started",
        arrivalTime,
      });

      console.log(`✅ Arrival time set for delivery ${delivery_id}`);
    } catch (err) {
      console.error(
        `❌ Failed to update delivery ${delivery_id}:`,
        err.message
      );
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});
