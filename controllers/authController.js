import * as authService from "../services/authServices.js";
import { generateToken } from "../services/auth.js";

// Generic registration
export const registerUser = async (req, res) => {
  try {
    const userData = req.body;
    const newUser = await authService.registerUser(userData);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: error.message });
  }
};

// Driver-specific registration
export const registerDriver = async (req, res) => {
  try {
    const userData = { ...req.body, role: "driver" };
    const newUser = await authService.registerUser(userData);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error registering driver:", error);
    res.status(500).json({ message: error.message });
  }
};

// Customer-specific registration
export const registerCustomer = async (req, res) => {
  try {
    const userData = { ...req.body, role: "customer" };
    const newUser = await authService.registerUser(userData);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error registering customer:", error);
    res.status(500).json({ message: error.message });
  }
};

// Generic login
export const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await authService.loginUser(identifier, password);
    const token = generateToken(user);
    res.status(200).json({ user, token });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

// Driver-specific login (with role check)
export const loginDriver = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await authService.loginUser(identifier, password);

    if (user.role !== "driver") {
      return res.status(403).json({ message: "Not authorized as driver" });
    }

    const token = generateToken(user);
    res.status(200).json({ user, token });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

// Customer-specific login
export const loginCustomer = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await authService.loginUser(identifier, password);

    if (user.role !== "customer") {
      return res.status(403).json({ message: "Not authorized as customer" });
    }

    const token = generateToken(user);
    res.status(200).json({ user, token });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};
