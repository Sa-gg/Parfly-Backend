import * as authService from "../services/authServices.js";

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
    const { identifier, password } = req.body; // identifier = email or phone
    const user = await authService.loginUser(identifier, password);
    res.status(200).json(user); // no JWT token
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};
