// server.js - WebSocket and API endpoint server
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Store connected WebSocket clients
const clients = new Set();

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Store the selected dataset path
let selectedDatasetPath = null;

// Broadcast to all connected clients
export const broadcast = (data) => {
  const message = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
};

// Set the selected dataset path
export const setSelectedDatasetPath = (path) => {
  selectedDatasetPath = path;
  if (path) {
    console.log(`Selected dataset: ${path}`);
    broadcast({ type: "datasetSelected", path });
  }
  return path;
};

// Get the selected dataset path
export const getSelectedDatasetPath = () => selectedDatasetPath;

// Store available datasets
let availableDatasets = [];

// Function to load available datasets
const loadAvailableDatasets = () => {
  const dummyDataDir = path.join(__dirname, "dummy-data");
  const result = [];

  try {
    if (fs.existsSync(dummyDataDir)) {
      // Get all category directories
      const categories = fs
        .readdirSync(dummyDataDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      // For each category, get all JSON files
      categories.forEach((category) => {
        const categoryPath = path.join(dummyDataDir, category);
        const files = fs
          .readdirSync(categoryPath)
          .filter((file) => file.endsWith(".json"))
          .map((file) => ({
            filename: file,
            path: path.join("dummy-data", category, file),
            category: category
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" "),
          }));

        result.push(...files);
      });
    }
  } catch (err) {
    console.error("Error loading datasets:", err);
  }

  return result;
};

// Load datasets on startup
availableDatasets = loadAvailableDatasets();

// Group datasets by category for display
const groupDatasetsByCategory = (datasets) => {
  return datasets.reduce((groups, dataset) => {
    const category = dataset.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(dataset);
    return groups;
  }, {});
};

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("New client connected");
  clients.add(ws);

  // Send current dataset info to the new client
  if (selectedDatasetPath) {
    ws.send(
      JSON.stringify({
        type: "status",
        message: "Connected to data stream",
        currentDataset: selectedDatasetPath.split("/").pop(),
      })
    );
  }

  // Send current dataset and available datasets to the client
  ws.send(
    JSON.stringify({
      type: "init",
      currentDataset: selectedDatasetPath,
      availableDatasets: groupDatasetsByCategory(availableDatasets),
    })
  );

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
    console.log(`Remaining clients: ${clients.size}`);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    clients.delete(ws);
  });

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Received:", data);

      if (data.type === "selectDataset") {
        const { datasetIndex } = data;
        const dataset = availableDatasets[datasetIndex - 1];

        if (dataset) {
          // Import the necessary functions from index.js
          const { setDummyDataPath, loadAndStreamDataset } = await import('./index.js');
          
          // Set and load the dataset
          setDummyDataPath(dataset.path);
          loadAndStreamDataset(dataset.path);
          
          // Notify all clients
          broadcast({
            type: "datasetSelected",
            path: dataset.path,
            name: dataset.filename,
            message: `Started streaming dataset: ${dataset.filename}`
          });
          
          console.log(`Selected and started streaming dataset: ${dataset.path}`);
        }
      }
    } catch (error) {
      console.error("Error handling message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: error.message,
        })
      );
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// API endpoint to get available datasets
app.get("/api/datasets", (req, res) => {
  try {
    const datasets = availableDatasets.map((dataset, index) => ({
      id: index + 1,
      name: dataset.filename,
      path: dataset.path,
      category: dataset.category,
    }));

    res.json({
      success: true,
      data: datasets,
    });
  } catch (error) {
    console.error("Error getting datasets:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load datasets",
    });
  }
});

// API endpoint to select a dataset
app.post("/api/select-dataset", (req, res) => {
  try {
    const { datasetId } = req.body;

    if (datasetId === undefined) {
      return res.status(400).json({
        success: false,
        error: "datasetId is required in the request body",
      });
    }

    const datasetIndex = parseInt(datasetId, 10) - 1;
    const dataset = availableDatasets[datasetIndex];

    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: `Dataset with ID ${datasetId} not found`,
      });
    }

    // Update the selected dataset
    setSelectedDatasetPath(dataset.path);

    // Broadcast the change to all WebSocket clients
    broadcast({
      type: "datasetSelected",
      path: dataset.path,
      name: dataset.filename,
    });

    res.json({
      success: true,
      message: `Selected dataset: ${dataset.filename}`,
      data: {
        id: datasetIndex + 1,
        name: dataset.filename,
        path: dataset.path,
        category: dataset.category,
      },
    });
  } catch (error) {
    console.error("Error selecting dataset:", error);
    res.status(500).json({
      success: false,
      error: "Failed to select dataset",
    });
  }
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  console.log(`\nAvailable API endpoints:`);
  console.log(`- GET  http://localhost:${PORT}/api/datasets`);
  console.log(`- POST http://localhost:${PORT}/api/select-dataset`);
});
