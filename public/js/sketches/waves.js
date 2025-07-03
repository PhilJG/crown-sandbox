class WavesSketch {
    constructor() {
        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");
        
        // Wave properties
        this.waves = [];
        this.time = 0;
        this.animationId = null;
        this.amplitude = 0;
        this.targetAmplitude = 0;

        // Setup
        this.setupCanvas();
        this.setupResize();
        this.initializeWaves();
    }

    setupCanvas() {
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.zIndex = '1';
        this.canvas.style.display = 'none';
        this.resize();
    }

    setupResize() {
        window.addEventListener("resize", () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initializeWaves() {
        // Create multiple waves with different properties
        this.waves = [
            { y: 0.3, speed: 0.003, frequency: 0.002, color: 'rgba(100, 200, 255, 0.6)' },
            { y: 0.5, speed: 0.002, frequency: 0.0015, color: 'rgba(50, 150, 255, 0.4)' },
            { y: 0.7, speed: 0.001, frequency: 0.001, color: 'rgba(0, 100, 200, 0.3)' }
        ];
    }

    show() {
        this.canvas.style.display = 'block';
        if (!this.animationId) {
            this.animate();
        }
    }

    hide() {
        this.canvas.style.display = 'none';
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    update(probability) {
        // Smoothly transition to target amplitude
        this.targetAmplitude = probability * 150;
        this.amplitude += (this.targetAmplitude - this.amplitude) * 0.1;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update time
        this.time += 0.01;
        
        // Draw each wave
        this.waves.forEach((wave, index) => {
            this.drawWave(wave, index);
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawWave(wave, index) {
        const { ctx } = this;
        const height = this.canvas.height;
        const width = this.canvas.width;
        
        // Calculate wave properties based on amplitude and index
        const amplitude = this.amplitude * (1 - index * 0.2);
        const yPos = height * wave.y;
        
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        
        // Draw wave
        for (let x = 0; x <= width; x += 2) {
            // Calculate y position with multiple sine waves for more organic look
            const y = yPos + 
                Math.sin(x * wave.frequency + this.time * wave.speed * 1000) * amplitude +
                Math.sin(x * wave.frequency * 0.7 + this.time * wave.speed * 700) * amplitude * 0.3;
            
            ctx.lineTo(x, y);
        }
        
        // Complete the wave shape
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        
        // Create gradient for wave fill
        const gradient = ctx.createLinearGradient(0, yPos - amplitude, 0, yPos + amplitude);
        const baseColor = wave.color.includes('rgba') ? wave.color.substring(0, wave.color.lastIndexOf(',')) + ')' : wave.color;
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(1, baseColor.replace(')', ', 0.1)'));
        
        // Draw the wave
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}
