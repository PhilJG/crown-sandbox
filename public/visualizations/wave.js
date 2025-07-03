export class WaveVisualization {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Wave properties
    this.points = [];
    this.maxPoints = 200; // Increased number of points for smoother wave
    this.amplitude = 30;
    this.frequency = 0.02;
    this.probability = 0;
    this.time = 0;
    this.height = canvas.height * 0.3; // Take up 30% of the canvas height
    this.offsetY = canvas.height - this.height; // Position at the bottom

    // Initialize points
    for (let i = 0; i < this.maxPoints; i++) {
      this.points.push({
        x: (i / (this.maxPoints - 1)) * this.canvas.width,
        y: 0
      });
    }
  }

  update(probability) {
    this.probability = probability;
    this.time += 0.01; // Increment time for animation

    // Update wave properties based on probability
    this.amplitude = 30 + probability * 50;
    this.frequency = 0.02 + probability * 0.08;
  }

  draw() {
    // Draw the wave background
    this.ctx.fillStyle = "rgba(25, 25, 35, 0.7)";
    this.ctx.fillRect(0, this.offsetY, this.canvas.width, this.height);

    // Draw the wave
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.getColor();
    this.ctx.lineWidth = 2;
    this.ctx.globalCompositeOperation = 'lighter';

    const centerY = this.offsetY + this.height / 2;
    
    // Draw the wave
    for (let i = 0; i < this.points.length; i++) {
      const x = (i / (this.maxPoints - 1)) * this.canvas.width;
      const noise = Math.sin(this.time * 2 + i * 0.1) * 3 * (1 - this.probability);
      const y = centerY + Math.sin(this.time + x * this.frequency) * this.amplitude * this.probability + noise;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    // Create a gradient for the wave
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, this.getColor(0.8));
    gradient.addColorStop(1, this.getColor(0.3));
    
    // Draw the filled wave
    this.ctx.strokeStyle = gradient;
    this.ctx.stroke();

    // Draw a subtle reflection
    this.ctx.beginPath();
    this.ctx.globalAlpha = 0.3;
    for (let i = 0; i < this.points.length; i++) {
      const x = (i / (this.maxPoints - 1)) * this.canvas.width;
      const y = centerY + Math.sin(this.time * 0.8 + x * this.frequency * 1.2) * this.amplitude * 0.6 * this.probability;
      
      if (i === 0) {
        this.ctx.moveTo(x, y + 10);
      } else {
        this.ctx.lineTo(x, y + 10);
      }
    }
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
    
    // Draw calm percentage
    this.ctx.fillStyle = 'white';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'right';
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
    this.offsetY = this.canvas.height - this.height;
    
    // Update points for new canvas size
    for (let i = 0; i < this.points.length; i++) {
      this.points[i].x = (i / (this.maxPoints - 1)) * this.canvas.width;
    }
  }
}
