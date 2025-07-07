export class CircleVisualization {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Circle state
    this.circle = {
      x: 0,
      y: 0,
      radius: 0,
      targetRadius: 100,
      color: "#3498db",
      currentProbability: 0,
    };

    this.updateCircle();
  }

  updateCircle() {
    this.circle.x = this.canvas.width / 2;
    this.circle.y = this.canvas.height / 2;
    this.circle.radius = Math.min(this.canvas.width, this.canvas.height) * 0.1;
  }

  update(probability) {
    this.circle.currentProbability = probability;

    // Map probability (0-1) to color
    if (probability > 0.4) {
      this.circle.color = "#3498db"; // Blue - calm
    } else if (probability > 0.3) {
      this.circle.color = "#2ecc71"; // Green
    } else if (probability > 0.2) {
      this.circle.color = "#e67e22"; // Orange
    } else {
      this.circle.color = "#e74c3c"; // Red - least calm
    }

    // Map probability to size (10% to 60% of maximum size)
    const minSize = Math.min(this.canvas.width, this.canvas.height) * 0.1;
    const maxSize = Math.min(this.canvas.width, this.canvas.height) * 0.6;
    this.circle.targetRadius = minSize + (maxSize - minSize) * probability;
  }

  draw() {
    // Smoothly interpolate the current radius
    this.circle.radius += (this.circle.targetRadius - this.circle.radius) * 0.1;

    // Draw the circle
    this.ctx.beginPath();
    this.ctx.arc(
      this.circle.x,
      this.circle.y,
      this.circle.radius,
      0,
      Math.PI * 2
    );

    // Create gradient
    const gradient = this.ctx.createRadialGradient(
      this.circle.x,
      this.circle.y,
      0,
      this.circle.x,
      this.circle.y,
      this.circle.radius
    );

    // Add color stops based on the current color
    if (this.circle.color === "#3498db") {
      gradient.addColorStop(0, "#64b5f6");
      gradient.addColorStop(1, "#1565c0");
    } else if (this.circle.color === "#2ecc71") {
      gradient.addColorStop(0, "#69f0ae");
      gradient.addColorStop(1, "#1b5e20");
    } else if (this.circle.color === "#e67e22") {
      gradient.addColorStop(0, "#ffb74d");
      gradient.addColorStop(1, "#e65100");
    } else {
      gradient.addColorStop(0, "#ff8a80");
      gradient.addColorStop(1, "#b71c1c");
    }

    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Draw the probability text
    this.ctx.fillStyle = "white";
    this.ctx.font = "24px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      `Calm: ${Math.round(this.circle.currentProbability * 100)}%`,
      this.circle.x,
      this.circle.y + 10
    );
  }

  onResize() {
    this.updateCircle();
  }
}
