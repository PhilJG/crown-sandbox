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
    this.life = 1000; // Increased from 100 to 110
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
        // Stop vertical movement
        this.speedY = 0;
      }
    } else {
      // Find the lowest y-position where this bubble won't overlap with others
      let lowestY = square.y + square.padding + this.size; // Start at the top of the square
      
      // Check all other bubbles at the top
      for (const other of particles) {
        if (other === this || !other.atTop) continue;
        
        // Calculate distance between this bubble and the other bubble
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (this.size + other.size) * 0.9; // 90% of combined size
        
        // If bubbles are overlapping vertically and horizontally
        if (distance < minDistance) {
          // Calculate where this bubble needs to be to not overlap
          const newY = other.y - Math.sqrt(minDistance * minDistance - dx * dx);
          if (newY < lowestY) {
            lowestY = newY;
          }
        }
      }
      
      // Update position to not overlap with any other bubbles
      this.accumulatedY = Math.min(this.accumulatedY, lowestY - 1);
      this.y = this.accumulatedY;
      
      // Prevent horizontal movement at the top for cleaner stacking
      this.oscillation = 0;
      this.speedX = 0;
    }

    // Keep bubbles within bounds
    this.x = Math.max(leftBoundary + this.size, Math.min(rightBoundary - this.size, this.x));
    this.y = Math.max(topBoundary + this.size, Math.min(bottomBoundary + this.size, this.y));

    // Only decrease life if not at the top and not already at max life
    if (!this.atTop && this.life > 0) {
      this.life--;
      
      // If bubble runs out of life before reaching top, remove it
      if (this.life <= 0) {
        // Find and remove this bubble from the particles array
        const index = particles.indexOf(this);
        if (index > -1) {
          particles.splice(index, 1);
          return false; // Indicate this particle was removed
        }
      }
    }
    return true; // Indicate this particle is still active
  }

  draw() {
    // Slightly adjust size based on y-position for depth effect
    const depthScale = 0.8 + (this.y / (square.size * 2));
    const displaySize = this.size * (this.atTop ? 1 : depthScale);
    
    // Bubble with gradient and highlight for more realistic look
    const gradient = ctx.createRadialGradient(
      this.x - displaySize * 0.3, 
      this.y - displaySize * 0.3, 
      displaySize * 0.1,
      this.x, 
      this.y, 
      displaySize
    );
    
    // Semi-transparent fill with depth-based opacity
    const opacity = this.atTop ? 'cc' : 'aa';
    const color = this.color + opacity;
    gradient.addColorStop(0, `#ffffff${opacity}`);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, this.color + opacity);

    // Draw bubble
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, displaySize, 0, Math.PI * 2);
    ctx.fill();
    
    // Add highlight (smaller for a more subtle effect)
    ctx.fillStyle = this.atTop ? '#ffffff99' : '#ffffff66';
    ctx.beginPath();
    ctx.arc(
      this.x - displaySize * 0.25, 
      this.y - displaySize * 0.25, 
      displaySize * 0.15, 
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
      const topBubbleIndex = particles.findIndex((p) => p.atTop);
      if (topBubbleIndex !== -1) {
        particles.splice(topBubbleIndex, 1);
      } else {
        particles.shift();
      }
    }
    // Create particles within the square bounds (with padding)
    // Create bubble at the bottom of the square
    const bubble = new Particle(
      square.x +
        square.padding +
        Math.random() * (square.size - 2 * square.padding),
      square.y + square.size - square.padding - 10, // Start near bottom
      color
    );

    // Adjust size based on calmness
    bubble.size = (Math.random() * 8 + 4) * sizeMultiplier;

    // Randomize initial horizontal position and speed
    bubble.x =
      square.x +
      square.padding +
      Math.random() * (square.size - 2 * square.padding);
    bubble.speedX = (Math.random() - 0.5) * 0.5;

    particles.push(bubble);
  }
}

// Animation loop
function animate() {
  // Clear with semi-transparent background for trail effect
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Set up clipping region for the square
  ctx.save();
  ctx.beginPath();
  ctx.rect(square.x, square.y, square.size, square.size);
  ctx.clip();

  // Draw square border
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(square.x, square.y, square.size, square.size);

  // Update and draw particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const isAlive = particles[i].update();
    if (isAlive) {
      particles[i].draw();
    } else {
      particles.splice(i, 1);
    }
  }

  // Restore the clipping region
  ctx.restore();

  requestAnimationFrame(animate);
}

// Start animation
animate();
