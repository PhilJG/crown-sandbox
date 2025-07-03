// Dependencies
const { Notion } = require("@neurosity/notion");
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require("dotenv").config();

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
const io = new Server(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve socket.io client
app.get('/socket.io/socket.io.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'node_modules/socket.io/client-dist/socket.io.js'));
});

// Instantiating a notion
const notion = new Notion({
  deviceId,
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Broadcast to all connected clients
function broadcast(data) {
  io.emit('message', JSON.stringify(data));
};

const main = async () => {
  try {
    await notion.login({
      email,
      password,
    });

    console.log('Successfully connected to Neurosity device');

    notion.calm().subscribe((calm) => {
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
        type: 'calm',
        probability: calm.probability
      });
    });

    // Start the server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('Waiting for calm data from Neurosity device...');
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

main();
