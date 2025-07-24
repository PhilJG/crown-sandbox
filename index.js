// Dependencies
import { Neurosity } from "@neurosity/sdk";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import {
  getSelectedDatasetPath,
  setSelectedDatasetPath,
  broadcast,
} from "./server.js";

dotenv.config();

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

<<<<<<< HEAD
// Application state
let useDummyData = false;
let dummyDataPath = null;
let currentDatasetTitle = "";
let streamInterval = null;
let currentDummyData = [];

// Function to set the dummy data path
export const setDummyDataPath = (path) => {
  dummyDataPath = path;
  useDummyData = true;
  setSelectedDatasetPath(path);
  console.log(`Using dummy data from: ${dummyDataPath}`);
  updateDatasetTitle(`Dataset: ${path.split("/").pop()}`);
};

// Update dataset title and broadcast to clients
const updateDatasetTitle = (title) => {
  currentDatasetTitle = title;
  broadcast({ type: "datasetTitle", title });
};
=======
// Add this line after your imports
let currentDatasetTitle = "";

// Setup readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});
>>>>>>> 1ca1b82 (revert to working local server)

// Authentication
const deviceId = process.env.DEVICE_ID || "";
const email = process.env.EMAIL || "";
const password = process.env.PASSWORD || "";

const verifyEnvs = (email, password, deviceId) => {
  const invalidEnv = (env) => env === "" || env === 0;
  if (invalidEnv(email) || invalidEnv(password) || invalidEnv(deviceId)) {
    console.error(
      "Please verify deviceId, email and password are in .env file, quitting..."
    );
    process.exit(1);
  }
};

// Instantiating a notion
const notion = new Neurosity({
  deviceId,
});

// List available dummy data files with categories
const getDummyDataFiles = () => {
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
    console.error("Error reading dummy data directory:", err);
  }

  return result;
};

// Group files by category
const groupByCategory = (files) => {
  return files.reduce((groups, file) => {
    const category = file.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(file);
    return groups;
  }, {});
};

// Get emoji based on probability value
const getEmoji = (probability) => {
  if (probability >= 0.7) return "🟦"; // High probability
  if (probability >= 0.4) return "🟩"; // Medium probability
  if (probability >= 0.1) return "🟧"; // Low probability
  return "🟥"; // Very low probability
};

// Function to start streaming data
const startStreaming = (dummyData) => {
  // Clear any existing interval
  if (streamInterval) {
    clearInterval(streamInterval);
  }

  let index = 0;

  const sendDataPoint = () => {
    if (index >= dummyData.length) {
      console.log("End of dataset reached. Restarting from beginning...");
      index = 0;
    }

    const dataPoint = dummyData[index++];
    const timestamp = new Date().toLocaleTimeString();
    const probability = dataPoint.probability;
    const emoji = getEmoji(probability);

    // Log to console
    console.log(`[${timestamp}] ${probability.toFixed(10)} ${emoji}`);

    // Broadcast to all WebSocket clients
    broadcast({
      type: "calm",
      data: {
        probability,
        timestamp,
        emoji,
        rawValue: dataPoint.value, // Include the raw value if needed
      },
    });
  };

  // Send first data point immediately
  sendDataPoint();

  // Then set up the interval for subsequent points
  return setInterval(sendDataPoint, 1000);
};

// Process and transform dummy data to match Notion SDK format
const processDummyData = (samples) => {
  if (!Array.isArray(samples)) {
    console.error("Invalid data format: expected array of samples");
    throw new Error("Invalid data format: expected array of samples");
  }

  return samples.map((sample, index) => {
    // If sample is just a number, use it as probability
    if (typeof sample === "number") {
      return {
        value: sample,
        probability: sample,
        timestamp: Date.now() + index * 1000, // Add timestamp if not present
        label: "calm",
      };
    }

    // If sample is an object with data array
    if (sample.data && Array.isArray(sample.data)) {
      return {
        ...sample,
        value: sample.data[0] || 0, // Use first channel value as raw value
        probability: sample.probability || 0.5, // Default probability if not present
        timestamp: sample.timestamp || Date.now() + index * 1000,
        label: sample.label || "calm",
      };
    }

    // If sample is an object with probability
    if (sample.probability !== undefined) {
      return {
        ...sample,
        value: sample.value || sample.probability,
        timestamp: sample.timestamp || Date.now() + index * 1000,
        label: sample.label || "calm",
      };
    }

    // Fallback for any other format
    return {
      value: 0.5,
      probability: 0.5,
      timestamp: Date.now() + index * 1000,
      label: "calm",
      ...sample,
    };
  });
};

// Read and parse dummy data
const readDummyData = (filepath) => {
  try {
    const filePath = path.join(__dirname, filepath);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const rawData = JSON.parse(fileContent);

    // Support both direct array and object with samples property
    const samples = Array.isArray(rawData) ? rawData : rawData.samples || [];

    if (!samples.length) {
      console.error("No samples found in the data");
      return [];
    }

    return processDummyData(samples);
  } catch (error) {
    console.error("Error reading dummy data:", error);
    throw error; // Re-throw to handle it in the calling function
  }
};

// Function to load and start streaming a dataset
export const loadAndStreamDataset = async (datasetPath) => {
  try {
    console.log(`\nLoading dataset: ${datasetPath}`);

    // Clear any existing interval
    if (streamInterval) {
      clearInterval(streamInterval);
      streamInterval = null;
    }

    // Read and process the data
    const processedData = readDummyData(datasetPath);

    if (!processedData || processedData.length === 0) {
      throw new Error("No valid data found in the dataset");
    }

    console.log(
      `Loaded ${processedData.length} data points from ${path.basename(
        datasetPath
      )}`
    );
    console.log(
      "Streaming data. Send a WebSocket message to change dataset.\n"
    );

    // Store the current dataset
    currentDummyData = processedData;

    // Start streaming the data
    streamInterval = startStreaming(processedData);

    return true;
  } catch (error) {
    console.error("Error loading dataset:", error.message);

    // Broadcast error to clients
    broadcast({
      type: "error",
      message: `Failed to load dataset: ${error.message}`,
      datasetPath,
    });

    return false;
  }
};

const handleCalmData = (calm) => {
  const timestamp = new Date().toLocaleTimeString();
  const emoji = getEmoji(calm.probability);

  console.log(`[${timestamp}]`, calm.probability.toFixed(10), emoji);

  // Broadcast to all connected WebSocket clients
  broadcast({
    type: "calm",
    data: {
      probability: calm.probability,
      timestamp,
      emoji,
    },
  });
};

const main = async () => {
  try {
    console.log("Neurosity Emulator - WebSocket Server");
    console.log("===================================\n");

    // Verify environment variables
    verifyEnvs(email, password, deviceId);
    console.log(`${email} attempting to authenticate to ${deviceId}`);

    // Start with the first available dataset
    const files = getDummyDataFiles();
    if (files.length > 0) {
      await loadAndStreamDataset(files[0].path);
    } else {
      console.error("No dataset files found in dummy-data directory");
      process.exit(1);
    }

    console.log(
      "\nWebSocket server is running. Connect to ws://localhost:3000 to control the emulator."
    );
    console.log(
      "Send a WebSocket message with the following format to change datasets:"
    );
    console.log('{ "type": "selectDataset", "datasetIndex": 1 }');

    // Keep the process running
    await new Promise(() => {});
  } catch (error) {
    console.error("Error in main:", error);
    process.exit(1);
  }
};

// Initialize the application but don't start streaming yet
console.log("Neurosity Emulator - WebSocket Server");
console.log("===================================\n");

// Verify environment variables
verifyEnvs(email, password, deviceId);

// Start the server
import("./server.js").then(() => {
  console.log(
    "\nWebSocket server is running. Connect to ws://localhost:3000 to control the emulator."
  );
  console.log(
    "Send a WebSocket message with the following format to start streaming:"
  );
  console.log('{ "type": "selectDataset", "datasetIndex": 1 }');
});
