import * as clientService from "../services/clientServices.js";

export const getClients = async (req, res) => {
  try {
    const clients = await clientService.getClients();
    res.status(200).json(clients);
  } catch (error) {
    console.error("Error fetching client", error);
    res.status(500).json({ message: error.message });
  }
};

export const createClient = async (req, res) => {
  try {
    const clientData = req.body;
    const clients = await clientService.createClient(clientData);
    res.status(200).json(clients);
  } catch (error) {
    console.error("Error creating client", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateClient = async (req, res) => {
  try {
    const clientData = req.body;
    const clientId = req.params.id;
    const updatedClient = await clientService.updateClient(
      clientData,
      clientId
    );

    if (!updatedClient) {
      res.status(404).json({ message: "Client not found" });
      return;
    }
    res.status(200).json(updatedClient);
  } catch (error) {
    console.error("Error updating client", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    const deletedClient = await clientService.deleteClient(clientId);
    if (!deletedClient) {
      res.status(404).json({ message: "Client not found" });
      return;
    }
    res.status(200).send();
  } catch (error) {
    console.error("Error deleting client", error);
    res.status(500).json({ message: error.message });
  }
};

export const searchClients = async (req, res) => {
  try {
    const searchTerm = req.query.q;
    const clients = await clientService.searchClients(searchTerm);
    res.status(200).json(clients);
  } catch (error) {
    console.error("Error searching clients", error);
    res.status(500).json({ message: error.message });
  }
}

