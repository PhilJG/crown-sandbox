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
let activeVisualizations = [];

// Initialize visualizations
function initVisualizations() {
  // Create and store all visualizations
  visualizations = {
    circle: new CircleVisualization(canvas, ctx),
    wave: new WaveVisualization(canvas, ctx)
  };
  
  // Set both visualizations as active by default
  activeVisualizations = [visualizations.circle, visualizations.wave];
  
  // Update button states
  document.querySelectorAll('.menu-button').forEach(button => {
    const vizName = button.dataset.sketch;
    if (activeVisualizations.includes(visualizations[vizName])) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  // Initialize status
  const statusElement = document.getElementById("status");
  if (statusElement) {
    statusElement.textContent = "Connecting to Neurosity...";
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
      
      // Toggle visualization
      const visualizationName = button.dataset.sketch;
      if (visualizations[visualizationName]) {
        const viz = visualizations[visualizationName];
        const index = activeVisualizations.indexOf(viz);
        if (index === -1) {
          activeVisualizations.push(viz);
          button.classList.add('active');
        } else {
          activeVisualizations.splice(index, 1);
          button.classList.remove('active');
        }
        // Clear canvas when toggling visualizations
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
  if (data.type === "calm") {
    // Update all visualizations with new probability
    activeVisualizations.forEach(viz => {
      if (viz && typeof viz.update === 'function') {
        viz.update(data.probability);
      }
    });
    
    // Update status text if element exists
    const statusElement = document.getElementById("status");
    if (statusElement) {
      statusElement.textContent = `Calm level: ${(data.probability * 100).toFixed(1)}%`;
    }
  }
};

// Animation loop
function animate() {
  // Clear the entire canvas with a dark background
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw all active visualizations
  activeVisualizations.forEach(viz => {
    if (viz && typeof viz.draw === 'function') {
      // Save the current context state
      ctx.save();
      
      // Adjust the canvas for the current visualization
      if (viz instanceof WaveVisualization) {
        // Let the wave visualization handle its own positioning
        viz.draw();
      } else {
        // For circle and other visualizations, use the top 70% of the screen
        const circleAreaHeight = canvas.height * 0.7;
        ctx.rect(0, 0, canvas.width, circleAreaHeight);
        ctx.clip();
        viz.draw();
      }
      
      // Restore the context state
      ctx.restore();
    }
  });
  
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
