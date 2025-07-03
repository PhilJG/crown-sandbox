export class WaveVisualization {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Chart properties
    this.dataPoints = [];
    this.maxDataPoints = 100; // Number of data points to show
    this.probability = 0;

    // Visual properties
    this.height = canvas.height * 0.3; // Take up 30% of the canvas height
    this.offsetY = canvas.height * 0.7; // Start at 70% of the canvas height
    this.padding = 20;

    // Initialize with empty data
    for (let i = 0; i < this.maxDataPoints; i++) {
      this.dataPoints.push(0);
    }
  }

  update(probability) {
    this.probability = probability;

    // Add new data point and remove the oldest one
    this.dataPoints.push(probability);
    if (this.dataPoints.length > this.maxDataPoints) {
      this.dataPoints.shift();
    }
  }

  draw() {
    // Draw the chart background
    this.ctx.fillStyle = "rgba(25, 25, 35, 0.7)";
    this.ctx.fillRect(0, this.offsetY, this.canvas.width, this.height);

    // Draw grid lines
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    this.ctx.lineWidth = 1;

    // Horizontal grid lines
    const gridLineCount = 4;
    for (let i = 0; i <= gridLineCount; i++) {
      const y = this.offsetY + (i / gridLineCount) * this.height;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();

      // Add scale labels (0-100%)
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      this.ctx.font = "10px Arial";
      this.ctx.textAlign = "left";
      this.ctx.fillText(`${100 - (i / gridLineCount) * 100}%`, 5, y - 5);
    }

    // Draw the line chart
    if (this.dataPoints.length > 1) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = this.getColor(0.8);
      this.ctx.lineWidth = 2;
      this.ctx.globalCompositeOperation = "lighter";

      const pointSpacing = this.canvas.width / (this.maxDataPoints - 1);
      const chartHeight = this.height - this.padding * 2;

      this.dataPoints.forEach((value, i) => {
        const x = i * pointSpacing;
        // Invert y so 100% is at the top
        const y = this.offsetY + this.padding + (1 - value) * chartHeight;

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      });

      // Draw the line
      this.ctx.stroke();

      // Add a subtle gradient fill under the line
      this.ctx.globalAlpha = 0.2;
      this.ctx.lineTo(
        this.canvas.width,
        this.offsetY + this.height - this.padding
      );
      this.ctx.lineTo(0, this.offsetY + this.height - this.padding);
      this.ctx.closePath();

      const fillGradient = this.ctx.createLinearGradient(
        0,
        this.offsetY,
        0,
        this.offsetY + this.height
      );
      fillGradient.addColorStop(0, this.getColor(0.3));
      fillGradient.addColorStop(1, this.getColor(0));
      this.ctx.fillStyle = fillGradient;
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    }

    // Draw calm percentage
    this.ctx.fillStyle = "white";
    this.ctx.font = "16px Arial";
    this.ctx.textAlign = "right";
    this.ctx.fillText(
      `Calm: ${Math.round(this.probability * 100)}%`,
      this.canvas.width - 20,
      this.offsetY + 25
    );
  }

  getColor(alpha = 1) {
    // Return color based on probability with optional alpha
    if (this.probability > 0.4) return `rgba(52, 152, 219, ${alpha})`; // Blue
    if (this.probability > 0.3) return `rgba(46, 204, 113, ${alpha})`; // Green
    if (this.probability > 0.2) return `rgba(230, 126, 34, ${alpha})`; // Orange
    return `rgba(231, 76, 60, ${alpha})`; // Red
  }

  onResize() {
    // Update dimensions for new canvas size
    this.height = this.canvas.height * 0.3;
    this.offsetY = this.canvas.height * 0.7; // Always position at 70% of canvas height
  }
}
