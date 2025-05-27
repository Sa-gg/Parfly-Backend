import * as authService from "../services/authServices.js";
import { generateToken } from "../services/auth.js";

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
