// Import visualizations
import { CircleVisualization } from './visualizations/circle.js';
import { WaveVisualization } from './visualizations/wave.js';

// Create canvas and context
const canvas = document.createElement("canvas");
document.body.insertBefore(canvas, document.body.firstChild);
const ctx = canvas.getContext("2d");

// Create WebSocket connection
const socket = new WebSocket("ws://" + window.location.host);

// Visualization instances
let visualizations = {};
let currentVisualization = null;

// Initialize visualizations
function initVisualizations() {
  visualizations = {
    circle: new CircleVisualization(canvas, ctx),
    wave: new WaveVisualization(canvas, ctx)
  };
  
  // Set default visualization
  currentVisualization = visualizations.circle;
  
  // Initialize status
  const statusElement = document.getElementById("status");
  if (statusElement) {
    statusElement.textContent = "Waiting for calm data...";
  }
}

// Setup menu event listeners
function setupMenu() {
  const menuButtons = document.querySelectorAll('.menu-button');
  menuButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active button
      menuButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Set current visualization
      const visualizationName = button.dataset.sketch;
      if (visualizations[visualizationName]) {
        currentVisualization = visualizations[visualizationName];
        // Clear canvas when switching visualizations
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  });
}

// Set canvas to full window size
function resizeCanvas() {
  const menu = document.getElementById('menu');
  const menuHeight = menu ? menu.offsetHeight : 0;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - menuHeight;
  
  // Notify all visualizations about resize
  if (visualizations) {
    Object.values(visualizations).forEach(viz => {
      if (viz && typeof viz.onResize === 'function') {
        viz.onResize();
      }
    });
  }
}

// Handle WebSocket messages
socket.onmessage = function(event) {
  const data = JSON.parse(event.data);
  if (data.type === "calm" && currentVisualization) {
    // Update all visualizations with new probability
    Object.values(visualizations).forEach(viz => {
      if (viz && typeof viz.update === 'function') {
        viz.update(data.probability);
      }
    });
  }
};

// Animation loop
function animate() {
  // Let the current visualization handle the drawing
  if (currentVisualization && typeof currentVisualization.draw === 'function') {
    currentVisualization.draw();
  }
  
  requestAnimationFrame(animate);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initVisualizations();
  setupMenu();
  resizeCanvas();
  animate();
});

// Handle window resize
window.addEventListener('resize', () => {
  resizeCanvas();
});
