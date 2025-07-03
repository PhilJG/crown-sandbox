export class WaveVisualization {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Data properties
    this.dataPoints = [];
    this.maxDataPoints = 100; // Number of points to show in the chart
    this.probability = 0;
    
    // Visual properties
    this.padding = 20;
    this.lineWidth = 2;
    this.height = canvas.height * 0.3;
    this.offsetY = canvas.height - this.height;
    
    // Initialize with zeros
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
    const width = this.canvas.width;
    const height = this.height;
    const padding = this.padding;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;
    
    // Draw chart background
    this.ctx.fillStyle = "rgba(25, 25, 35, 0.7)";
    this.ctx.fillRect(0, this.offsetY, width, height);
    
    // Draw grid lines
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    this.ctx.lineWidth = 1;
    
    // Horizontal grid lines
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = this.offsetY + padding + (i * chartHeight) / gridLines;
      this.ctx.beginPath();
      this.ctx.moveTo(padding, y);
      this.ctx.lineTo(width - padding, y);
      this.ctx.stroke();
      
      // Draw percentage labels
      if (i > 0) {
        const percentage = Math.round((1 - i / gridLines) * 100);
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`${percentage}%`, 5, y - 2);
      }
    }
    
    // Draw the line chart
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.getColor();
    this.ctx.lineWidth = this.lineWidth;
    
    // Create gradient for the area under the line
    const gradient = this.ctx.createLinearGradient(0, this.offsetY, 0, this.offsetY + height);
    gradient.addColorStop(0, `${this.getColor(0.3)}`);
    gradient.addColorStop(1, `${this.getColor(0)}`);
    
    // Draw the line and area
    this.dataPoints.forEach((value, i) => {
      const x = padding + (i / (this.dataPoints.length - 1)) * chartWidth;
      const y = this.offsetY + height - padding - (value * chartHeight);
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });
    
    // Draw the line
    this.ctx.stroke();
    
    // Draw the filled area
    this.ctx.lineTo(width - padding, this.offsetY + height - padding);
    this.ctx.lineTo(padding, this.offsetY + height - padding);
    this.ctx.closePath();
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // Draw current value text
    this.ctx.fillStyle = 'white';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(
      `Calm: ${Math.round(this.probability * 100)}%`,
      width - padding,
      this.offsetY + 20
    );
  }
  
  onResize() {
    this.height = this.canvas.height * 0.3;
    this.offsetY = this.canvas.height - this.height;
  }

  getColor(alpha = 1) {
    // Return color based on probability with optional alpha
    if (this.probability > 0.4) return `rgba(52, 152, 219, ${alpha})`; // Blue
    if (this.probability > 0.3) return `rgba(46, 204, 113, ${alpha})`; // Green
    if (this.probability > 0.2) return `rgba(230, 126, 34, ${alpha})`; // Orange
    return `rgba(231, 76, 60, ${alpha})`; // Red
  }
}
