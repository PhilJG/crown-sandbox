// Dependencies
const { Notion } = require("@neurosity/sdk");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const fs = require("fs");
const readline = require("readline");
require("dotenv").config();

// Setup readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Authentication
const deviceId = process.env.DEVICE_ID || "";
const email = process.env.EMAIL || "";
const password = process.env.PASSWORD || "";

const verifyEnvs = (email, password, deviceId) => {
  const invalidEnv = (env) => {
    return env === "" || env === 0;
  };
  if (invalidEnv(email) || invalidEnv(password) || invalidEnv(deviceId)) {
    console.error(
      "Please verify deviceId, email and password are in .env file, quitting..."
    );
    process.exit(0);
  }
};

verifyEnvs(email, password, deviceId);
console.log(`${email} attempting to authenticate to ${deviceId}`);

// Setup Express server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Instantiating a notion
const notion = new Notion({
  deviceId,
});

// Store connected WebSocket clients
const clients = new Set();

let currentDatasetTitle = "Not Connected";

wss.on("connection", (ws) => {
  console.log("New client connected");
  clients.add(ws);

  // Send the current dataset title to the newly connected client
  ws.send(
    JSON.stringify({
      type: "datasetTitle",
      title: currentDatasetTitle,
    })
  );

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });
});

const broadcast = (data) => {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// List available dummy data files with categories
const getDummyDataFiles = () => {
  const dummyDataDir = path.join(__dirname, "dummy-data copy");
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
            path: path.join(category, file),
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

// Process and transform dummy data to match Notion SDK format
const processDummyData = (rawData) => {
  if (!rawData || !rawData.samples || !Array.isArray(rawData.samples)) {
    throw new Error("Invalid dummy data format");
  }

  // Calculate probabilities from the first channel for simplicity
  // In a real app, you might want to process the EEG data more thoroughly
  return rawData.samples.map((sample) => ({
    label: "calm",
    metric: "awareness",
    probability: Math.min(
      0.9,
      Math.max(
        0.1,
        0.5 + parseFloat(sample.data[0]) / 100 // Normalize the first channel value to 0.1-0.9 range
      )
    ),
    timestamp: sample.timestamp,
  }));
};

// Read and parse dummy data
const readDummyData = (filepath) => {
  try {
    const filePath = path.join(__dirname, "dummy-data copy", filepath);
    const rawData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return processDummyData(rawData);
  } catch (error) {
    console.error("Error reading dummy data:", error);
    return null;
  }
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

// Prompt user to choose data source
const promptDataSource = () => {
  return new Promise((resolve) => {
    const dummyFiles = getDummyDataFiles();
    const filesByCategory = groupByCategory(dummyFiles);
    const flatFilesList = [];
    let optionNumber = 2; // Start from 2 (1 is for Neurosity device)

    console.log("\n=== Data Source Selection ===");
    console.log("1. Connect to Neurosity device");

    if (dummyFiles.length > 0) {
      Object.entries(filesByCategory).forEach(([category, files]) => {
        console.log(`\n${category}:`);
        files.forEach((file) => {
          const name = file.filename
            .replace(".json", "")
            .replace(/([A-Z])/g, " $1")
            .trim();
          console.log(`  ${optionNumber}. ${name}`);
          flatFilesList.push(file);
          optionNumber++;
        });
      });
    } else {
      console.log("\nNo dummy data files found in dummy-data/ directory");
    }

    rl.question("\nSelect data source (1 for Neurosity device): ", (answer) => {
      const choice = parseInt(answer);
      if (choice === 1) {
        resolve({ type: "notion" });
      } else if (choice >= 2 && choice < optionNumber) {
        const selectedFile = flatFilesList[choice - 2];
        resolve({
          type: "dummy",
          filename: selectedFile.path,
          displayName: `${
            selectedFile.category
          } - ${selectedFile.filename.replace(".json", "")}`,
        });
      } else {
        console.log("Invalid choice. Defaulting to Neurosity device.");
        resolve({ type: "notion" });
      }
    });
  });
};

const main = async () => {
  try {
    const dataSource = await promptDataSource();

    if (dataSource.type === "notion") {
      await notion.login({
        email,
        password,
      });
      console.log("Successfully connected to Neurosity device");

      // Update dataset title
      updateDatasetTitle("Neurosity Device (Live Data)");

      notion.calm().subscribe(handleCalmData);
    } else {
      const dummyData = readDummyData(dataSource.filename);
      if (dummyData && dummyData.length > 0) {
        const datasetName =
          dataSource.displayName ||
          dataSource.filename
            .replace(".json", "")
            .replace(/([A-Z])/g, " $1")
            .trim();

        console.log(`Using dummy data: ${datasetName}`);
        console.log(`Found ${dummyData.length} data points`);

        // Update dataset title with the display name
        updateDatasetTitle(datasetName);

        // Sort data by timestamp to ensure chronological order
        dummyData.sort((a, b) => a.timestamp - b.timestamp);

        // Stream data with 1-second intervals
        let index = 0;
        const streamNext = () => {
          if (index < dummyData.length) {
            handleCalmData(dummyData[index]);
            index++;

            // Use a fixed 1-second delay between data points
            setTimeout(streamNext, 1000);
          } else {
            console.log("End of dummy data reached");
          }
        };

        // Start streaming
        streamNext();
      } else {
        throw new Error("Failed to load dummy data");
      }
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

const handleCalmData = (calm) => {
  const timestamp = new Date().toLocaleTimeString();

  // Log to console with color indicators
  if (calm.probability > 0.4) {
    console.log(`[${timestamp}]`, calm.probability.toFixed(10), "🟦");
  } else if (calm.probability > 0.3) {
    console.log(`[${timestamp}]`, calm.probability.toFixed(10), "🟩");
  } else if (calm.probability > 0.2) {
    console.log(`[${timestamp}]`, calm.probability.toFixed(10), "🟧");
  } else {
    console.log(`[${timestamp}]`, calm.probability.toFixed(10), "🟥");
  }

  // Broadcast to all connected WebSocket clients
  broadcast({
    type: "calm",
    probability: calm.probability,
  });
};

// Function to update the dataset title in the UI
const updateDatasetTitle = (title) => {
  // Update the current title
  currentDatasetTitle = title;
  // Broadcast the title update to all connected clients
  broadcast({
    type: "datasetTitle",
    title: title,
  });
};

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Waiting for calm data...");
});

// Start the application
main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});
