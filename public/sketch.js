// Create a WebSocket connection to the server
const socket = new WebSocket("ws://" + window.location.host);
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

// Set canvas to full window size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Circle state
let circle = {
  x: 0,
  y: 0,
  radius: 0,
  targetRadius: 100,
  color: "#3498db",
  lastProbability: 0,
  currentProbability: 0,
};

// Update initial status
document.addEventListener("DOMContentLoaded", () => {
  const statusElement = document.getElementById("status");
  if (statusElement) {
    statusElement.textContent = "Waiting for calm data...";
  }
});

// Update circle position based on canvas size
function updateCircle() {
  circle.x = canvas.width / 2;
  circle.y = canvas.height / 2;
  circle.radius = Math.min(canvas.width, canvas.height) * 0.1; // 10% of smaller dimension
}

// Handle WebSocket messages
socket.onmessage = function(event) {
  const data = JSON.parse(event.data);
  if (data.type === "calm") {
    updateCircleState(data.probability);
  }
};

function updateCircleState(probability) {
  // Store current probability for display
  circle.currentProbability = probability;

  // Map probability (0-1) to color
  if (probability > 0.4) {
    circle.color = "#3498db"; // Blue - calm
  } else if (probability > 0.3) {
    circle.color = "#2ecc71"; // Green
  } else if (probability > 0.2) {
    circle.color = "#e67e22"; // Orange
  } else {
    circle.color = "#e74c3c"; // Red - least calm
  }

  // Map probability to size (20% to 80% of maximum size)
  const minSize = Math.min(canvas.width, canvas.height) * 0.2;
  const maxSize = Math.min(canvas.width, canvas.height) * 0.8;
  circle.targetRadius = minSize + (maxSize - minSize) * probability;

  // Store last probability for smooth transitions
  circle.lastProbability = probability;
}

// Animation loop
function animate() {
  // Clear canvas with a semi-transparent black for trail effect
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Smoothly interpolate the current radius towards the target radius
  circle.radius += (circle.targetRadius - circle.radius) * 0.1;

  // Draw the circle
  ctx.beginPath();
  ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);

  // Create a simple centered gradient
  const gradient = ctx.createRadialGradient(
    circle.x, circle.y, 0,  // Start at center with 0 radius
    circle.x, circle.y, circle.radius  // End at full radius
  );
  
  // Add color stops based on the current color
  if (circle.color === '#3498db') { // Blue (calm)
    gradient.addColorStop(0, '#64b5f6');
    gradient.addColorStop(1, '#1565c0');
  } else if (circle.color === '#2ecc71') { // Green
    gradient.addColorStop(0, '#69f0ae');
    gradient.addColorStop(1, '#1b5e20');
  } else if (circle.color === '#e67e22') { // Orange
    gradient.addColorStop(0, '#ffb74d');
    gradient.addColorStop(1, '#e65100');
  } else { // Red
    gradient.addColorStop(0, '#ff8a80');
    gradient.addColorStop(1, '#b71c1c');
  }
  
  // Draw the circle with gradient
  ctx.fillStyle = gradient;
  ctx.fill();

  // Update the status element with current probability
  const statusElement = document.getElementById("status");
  if (statusElement) {
    statusElement.textContent = `Calm: ${(
      circle.currentProbability * 100
    ).toFixed(1)}%`;
  }

  requestAnimationFrame(animate);
}

// Initialize and start animation
updateCircle();
animate();

// Update circle on window resize
window.addEventListener("resize", () => {
  resizeCanvas();
  updateCircle();
});
