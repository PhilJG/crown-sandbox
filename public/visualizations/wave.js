export class WaveVisualization {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Wave properties
    this.points = [];
    this.maxPoints = 100;
    this.amplitude = 50;
    this.frequency = 0.05;
    this.probability = 0;

    // Initialize points
    for (let i = 0; i < this.maxPoints; i++) {
      this.points.push({
        x: (i / (this.maxPoints - 1)) * this.canvas.width,
        y: this.canvas.height / 2,
      });
    }
  }

  update(probability) {
    this.probability = probability;

    // Update wave properties based on probability
    this.amplitude = 20 + probability * 100;
    this.frequency = 0.02 + probability * 0.1;
  }

  draw() {
    // Clear with a slight fade effect
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw the wave
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.getColor();
    this.ctx.lineWidth = 3;

    const time = Date.now() * 0.001; // Current time in seconds
    const centerY = this.canvas.height / 2;

    // Draw the wave
    for (let i = 0; i < this.points.length; i++) {
      const x = this.points[i].x;
      // Add some noise to the wave based on probability
      const noise = Math.sin(time * 2 + i * 0.1) * 5 * (1 - this.probability);
      const y =
        centerY + Math.sin(time + x * this.frequency) * this.amplitude + noise;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.stroke();

    // Draw info text
    this.ctx.fillStyle = "white";
    this.ctx.font = "20px Arial";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`Calm: ${Math.round(this.probability * 100)}%`, 20, 40);
  }

  getColor() {
    // Return color based on probability
    if (this.probability > 0.4) return "#3498db"; // Blue
    if (this.probability > 0.3) return "#2ecc71"; // Green
    if (this.probability > 0.2) return "#e67e22"; // Orange
    return "#e74c3c"; // Red
  }

  onResize() {
    // Update points for new canvas size
    for (let i = 0; i < this.points.length; i++) {
      this.points[i].x = (i / (this.maxPoints - 1)) * this.canvas.width;
    }
  }
}
