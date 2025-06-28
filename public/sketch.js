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
  padding: 20, // Space between square edge and particles
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
    this.size = Math.random() * 10 + 5; // Smaller size range for bubbles
    this.color = color;
    this.speedX = (Math.random() - 0.5) * 0.5; // Very slow horizontal movement
    this.speedY = -1 - Math.random() * 2; // Upward movement
    this.life = 100;
    this.oscillation = Math.random() * Math.PI * 2; // For slight horizontal wobble
    this.oscillationSpeed = Math.random() * 0.02 + 0.01;
    this.oscillationAmplitude = 0.5; // How much side-to-side movement
    this.atTop = false;
    this.accumulatedY = y; // Track where the bubble accumulates at the top
  }

  update() {
    const topBoundary = square.y + square.padding;
    const bottomBoundary = square.y + square.size - square.padding;
    const leftBoundary = square.x + square.padding;
    const rightBoundary = square.x + square.size - square.padding;
    
    if (!this.atTop) {
      // Apply upward movement with slight horizontal oscillation
      this.oscillation += this.oscillationSpeed;
      this.x += Math.sin(this.oscillation) * this.oscillationAmplitude;
      this.y += this.speedY;
      
      // Check if bubble has reached the top
      if (this.y - this.size <= topBoundary) {
        this.atTop = true;
        this.accumulatedY = topBoundary + this.size;
        this.y = this.accumulatedY;
      }
    } else {
      // If at top, stack on top of other bubbles
      this.accumulatedY -= this.size * 0.5; // Slight overlap for stacking
      this.y = this.accumulatedY;
      
      // Slight horizontal movement at the top
      this.oscillation += this.oscillationSpeed * 0.5;
      this.x += Math.sin(this.oscillation) * this.oscillationAmplitude * 0.5;
    }
    
    // Keep bubbles within horizontal bounds
    this.x = Math.max(leftBoundary + this.size, Math.min(rightBoundary - this.size, this.x));
    
    // Decrease life only if not at the top
    if (!this.atTop) {
      this.life--;
    }
  }

  draw() {
    // Bubble with gradient and highlight for more realistic look
    const gradient = ctx.createRadialGradient(
      this.x - this.size * 0.3, 
      this.y - this.size * 0.3, 
      this.size * 0.1,
      this.x, 
      this.y, 
      this.size
    );
    
    // Semi-transparent fill
    const color = this.color + 'cc';
    gradient.addColorStop(0, '#ffffff66');
    gradient.addColorStop(0.8, color);
    gradient.addColorStop(1, this.color);
    
    // Draw bubble
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Add highlight
    ctx.fillStyle = '#ffffff99';
    ctx.beginPath();
    ctx.arc(
      this.x - this.size * 0.3, 
      this.y - this.size * 0.3, 
      this.size * 0.2, 
      0, 
      Math.PI * 2
    );
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
  // Map probability to color and determine bubble count and size
  let color, count, sizeMultiplier;
  
  if (probability > 0.4) {
    color = "#3498db"; // Blue - calm
    count = 1;
    sizeMultiplier = 1.2; // Slightly larger bubbles when calm
  } else if (probability > 0.3) {
    color = "#2ecc71"; // Green
    count = 2;
    sizeMultiplier = 1.0;
  } else if (probability > 0.2) {
    color = "#e67e22"; // Orange
    count = 3;
    sizeMultiplier = 0.8;
  } else {
    color = "#e74c3c"; // Red - least calm
    count = 5;
    sizeMultiplier = 0.6; // More, smaller bubbles when less calm
  }

  // Create bubbles at the bottom of the square
  for (let i = 0; i < count; i++) {
    if (particles.length > maxParticles) {
      // Remove the oldest bubble that's already at the top
      const topBubbleIndex = particles.findIndex(p => p.atTop);
      if (topBubbleIndex !== -1) {
        particles.splice(topBubbleIndex, 1);
      } else {
        particles.shift();
      }
    }
    // Create particles within the square bounds (with padding)
    // Create bubble at the bottom of the square
    const bubble = new Particle(
      square.x + square.padding + Math.random() * (square.size - 2 * square.padding),
      square.y + square.size - square.padding - 10, // Start near bottom
      color
    );
    
    // Adjust size based on calmness
    bubble.size = (Math.random() * 8 + 4) * sizeMultiplier;
    
    // Randomize initial horizontal position and speed
    bubble.x = square.x + square.padding + Math.random() * (square.size - 2 * square.padding);
    bubble.speedX = (Math.random() - 0.5) * 0.5;
    
    particles.push(bubble);
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
