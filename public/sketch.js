// Create a WebSocket connection to the server
const socket = new WebSocket("ws://" + window.location.host);
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

// Square properties
let square = {
  x: 0,
  y: 0,
  size: 0,
  padding: 20 // Space between square edge and particles
};

// Set canvas to full window size and calculate square dimensions
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Calculate square size (80% of the smaller dimension)
  const minDimension = Math.min(canvas.width, canvas.height);
  square.size = minDimension * 0.8;
  
  // Center the square
  square.x = (canvas.width - square.size) / 2;
  square.y = (canvas.height - square.size) / 2;
}
window.addEventListener("resize", resize);
resize();

// Particle system
const particles = [];
const maxParticles = 100;

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 15 + 5;
    this.color = color;
    this.speedX = Math.random() * 3 - 1.5;
    this.speedY = Math.random() * 3 - 1.5;
    this.life = 100;
  }

  update() {
    // Update position
    this.x += this.speedX;
    this.y += this.speedY;
    this.life--;
    
    // Get square boundaries (with padding)
    const left = square.x + square.padding;
    const right = square.x + square.size - square.padding;
    const top = square.y + square.padding;
    const bottom = square.y + square.size - square.padding;
    
    // Check horizontal boundaries
    if (this.x - this.size < left || this.x + this.size > right) {
      this.speedX *= -0.8; // Reverse and dampen horizontal speed
      // Ensure particle doesn't get stuck outside the boundary
      this.x = Math.max(left + this.size, Math.min(right - this.size, this.x));
    }
    
    // Check vertical boundaries
    if (this.y - this.size < top || this.y + this.size > bottom) {
      this.speedY *= -0.8; // Reverse and dampen vertical speed
      // Ensure particle doesn't get stuck outside the boundary
      this.y = Math.max(top + this.size, Math.min(bottom - this.size, this.y));
    }
    
    // Apply some friction
    this.speedX *= 0.99;
    this.speedY *= 0.99;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Handle WebSocket messages
socket.onmessage = function(event) {
  const data = JSON.parse(event.data);
  if (data.type === "calm") {
    createParticles(data.probability);
  }
};

function createParticles(probability) {
  // Map probability to color
  let color;
  if (probability > 0.4) {
    color = "#3498db"; // Blue
  } else if (probability > 0.3) {
    color = "#2ecc71"; // Green
  } else if (probability > 0.2) {
    color = "#e67e22"; // Orange
  } else {
    color = "#e74c3c"; // Red
  }

  // Create particles at random positions
  for (let i = 0; i < 5; i++) {
    if (particles.length > maxParticles) {
      particles.shift();
    }
    // Create particles within the square bounds (with padding)
    particles.push(
      new Particle(
        square.x + square.padding + Math.random() * (square.size - 2 * square.padding),
        square.y + square.padding + Math.random() * (square.size - 2 * square.padding),
        color
      )
    );
  }
}

// Animation loop
function animate() {
  // Clear with semi-transparent black for trail effect
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw the square boundary
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(square.x, square.y, square.size, square.size);
  
  // Set clipping region to the square
  ctx.save();
  ctx.beginPath();
  ctx.rect(square.x, square.y, square.size, square.size);
  ctx.clip();

  // Update and draw particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();

    // Remove dead particles
    if (particles[i].life <= 0) {
        particles.splice(i, 1);
    }
  }
  
  // Restore the clipping region
  ctx.restore();

  requestAnimationFrame(animate);
}

// Start animation
animate();
