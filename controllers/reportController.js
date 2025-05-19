import * as reportService from "../services/reportServices.js";

export const getTransactions = async (req, res) => {
  try {
    const statusQuery = req.query.status;
    const statusArray = Array.isArray(statusQuery)
      ? statusQuery
      : statusQuery
      ? [statusQuery]
      : null;

    const startDate = req.query.startDate || "2000-01-01";
    const endDate = req.query.endDate || "2999-12-31";

    const transactions = await reportService.getTransactions({
      status: statusArray,
      startDate,
      endDate,
    });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transaction", error);
    res.status(500).json({ message: error.message });
  }
};

export const getDeliveryStatus = async (req, res) => {
  try {
    const getDeliveryStatus = await reportService.getDeliveryStatus();
    res.status(200).json(getDeliveryStatus);
  } catch (error) {
    console.error("Error fetching Delivery Status", error);
    res.status(500).json({ message: error.message });
  }
};
