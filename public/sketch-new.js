// Import visualizations and audio
import { CircleVisualization } from "./visualizations/circle.js";
import { WaveVisualization } from "./visualizations/wave.js";
import { AudioManager } from "./audio/audioManager.js";

// Create canvas and context
const canvas = document.createElement("canvas");
document.body.insertBefore(canvas, document.body.firstChild);
const ctx = canvas.getContext("2d");

// Create WebSocket connection
const socket = new WebSocket(`ws://${window.location.hostname}:3000`);

// Visualization instances
let visualizations = {};
let activeVisualizations = [];

// Audio
let audioManager;
let lastNoteTime = 0;
const NOTE_INTERVAL = 300; // ms between notes

// Initialize visualizations
function initVisualizations() {
  // Create and store all visualizations
  visualizations = {
    circle: new CircleVisualization(canvas, ctx),
    wave: new WaveVisualization(canvas, ctx),
  };

  // Set both visualizations as active by default
  activeVisualizations = [visualizations.circle, visualizations.wave];

  // Update button states
  updateMenuButtons();

  // Initialize status
  const statusElement = document.getElementById("status");
  if (statusElement) {
    statusElement.textContent = "Connecting to Neurosity...";
  }
}

// Update menu button states
function updateMenuButtons() {
  document.querySelectorAll(".menu-button").forEach((button) => {
    const vizName = button.dataset.sketch;
    if (activeVisualizations.includes(visualizations[vizName])) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

// Setup menu event listeners
function setupMenu() {
  // Toggle sound button
  const soundToggle = document.getElementById("soundToggle");
  if (soundToggle && audioManager) {
    // Set initial state
    soundToggle.textContent = audioManager.enabled ? "🔊" : "🔇";
    soundToggle.setAttribute(
      "title",
      audioManager.enabled ? "Sound On" : "Sound Off"
    );

    soundToggle.addEventListener("click", () => {
      const isSoundOn = audioManager.toggle();
      soundToggle.textContent = isSoundOn ? "🔊" : "🔇";
      soundToggle.setAttribute("title", isSoundOn ? "Sound On" : "Sound Off");
    });
  }

  // Toggle visualization buttons
  const menuButtons = document.querySelectorAll(".menu-button");
  menuButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active button
      menuButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Toggle visualization
      const visualizationName = button.dataset.sketch;
      if (visualizations[visualizationName]) {
        const viz = visualizations[visualizationName];
        const index = activeVisualizations.indexOf(viz);
        if (index === -1) {
          activeVisualizations.push(viz);
          button.classList.add("active");
        } else {
          activeVisualizations.splice(index, 1);
          button.classList.remove("active");
        }
        // Clear canvas when toggling visualizations
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  });
}

// Set canvas to full window size
function resizeCanvas() {
  const menu = document.getElementById("menu");
  const menuHeight = menu ? menu.offsetHeight : 0;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - menuHeight;

  // Notify all visualizations about resize
  if (visualizations) {
    Object.values(visualizations).forEach((viz) => {
      if (viz && typeof viz.onResize === "function") {
        viz.onResize();
      }
    });
  }
}

// Handle WebSocket messages
socket.onmessage = function(event) {
  const data = JSON.parse(event.data);
  if (data.type === "calm") {
    const probability = data.probability;

    // Update all active visualizations
    activeVisualizations.forEach((viz) => {
      if (viz && typeof viz.update === "function") {
        viz.update(probability);
      }
    });

    // Update status text if element exists
    const statusElement = document.getElementById("status");
    if (statusElement) {
      statusElement.textContent = `Calm level: ${(probability * 100).toFixed(
        1
      )}%`;
    }

    // Handle audio separately
    if (audioManager && audioManager.enabled) {
      const currentTime = Date.now();
      if (currentTime - lastNoteTime > NOTE_INTERVAL) {
        audioManager.playNoteForProbability(probability);
        lastNoteTime = currentTime;
      }
    }
  }
};

// Animation loop
function animate() {
  // Clear the entire canvas with a dark background
  ctx.fillStyle = "#0a0a14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Only proceed if visualizations are initialized
  if (visualizations && Object.keys(visualizations).length > 0) {
    // Draw circle visualization in the top 70% if active
    if (
      visualizations.circle &&
      activeVisualizations.includes(visualizations.circle)
    ) {
      ctx.save();
      const circleAreaHeight = canvas.height * 0.7;
      ctx.rect(0, 0, canvas.width, circleAreaHeight);
      ctx.clip();
      visualizations.circle.draw();
      ctx.restore();
    }

    // Draw wave visualization in the bottom 30% if active
    if (
      visualizations.wave &&
      activeVisualizations.includes(visualizations.wave)
    ) {
      ctx.save();
      const waveAreaTop = canvas.height * 0.7;
      const waveAreaHeight = canvas.height * 0.3;
      ctx.rect(0, waveAreaTop, canvas.width, waveAreaHeight);
      ctx.clip();
      visualizations.wave.draw();
      ctx.restore();
    }
  }

  requestAnimationFrame(animate);
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize audio manager
  audioManager = new AudioManager();

  // Initialize visualizations and UI
  initVisualizations();
  setupMenu();
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  animate();
});
