import * as reportService from "../services/reportServices.js";

export const getTransactions = async (req, res) => {
  try {
    const getTransactions = await reportService.getTransactions();
    res.status(200).json(getTransactions);
  } catch (error) {
    console.error("Error fetching transaction", error);
    res.status(500).json({ message: error.message });
  }
};