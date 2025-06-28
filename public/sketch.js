// Create a WebSocket connection to the server
const socket = new WebSocket("ws://" + window.location.host);
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

// Set canvas to full window size
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
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
    this.x += this.speedX;
    this.y += this.speedY;
    this.life--;
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
    particles.push(
      new Particle(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        color
      )
    );
  }
}

// Animation loop
function animate() {
  // Clear with semi-transparent black for trail effect
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Update and draw particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();

    // Remove dead particles
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }

  requestAnimationFrame(animate);
}

// Start animation
animate();
