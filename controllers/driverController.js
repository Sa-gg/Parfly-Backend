import * as driverService from "../services/driverServices.js";

export const getDrivers = async (req, res) => {
  try {
    const drivers = await driverService.getDrivers();
    res.status(200).json(drivers);
  } catch (error) {
    console.error("Error fetching driver", error);
    res.status(500).json({ message: error.message });
  }
};

export const createDriver = async (req, res) => {
  try {
    const driverData = req.body;
    const drivers = await driverService.createDriver(driverData);
    res.status(200).json(drivers);
  } catch (error) {
    console.error("Error creating driver", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateDriver = async (req, res) => {
  try {
    const driverData = req.body;
    const driverId = req.params.id;
    const updatedDriver = await driverService.updateDriver(
      driverData,
      driverId
    );

    if (!updatedDriver) {
      res.status(404).json({ message: "Driver not found" });
      return;
    }
    res.status(200).json(updatedDriver);
  } catch (error) {
    console.error("Error updating driver", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteDriver = async (req, res) => {
  try {
    const driverId = req.params.id;
    const deletedDriver = await driverService.deleteDriver(driverId);
    if (!deletedDriver) {
      res.status(404).json({ message: "Driver not found" });
      return;
    }
    res.status(200).send();
  } catch (error) {
    console.error("Error deleting driver", error);
    res.status(500).json({ message: error.message });
  }
};

export const searchDrivers = async (req, res) => {
  try {
    const searchTerm = req.query.q;
    const drivers = await driverService.searchDrivers(searchTerm);
    res.status(200).json(drivers);
  } catch (error) {
    console.error("Error searching drivers", error);
    res.status(500).json({ message: error.message });
  }
}

