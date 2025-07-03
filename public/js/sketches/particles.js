class ParticlesSketch {
    constructor() {
        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");
        
        // Square properties
        this.square = {
            x: 0,
            y: 0,
            size: 0,
            padding: 20
        };

        // Particle system
        this.particles = [];
        this.maxParticles = 100;
        this.animationId = null;

        // Setup
        this.setupCanvas();
        this.setupResize();
    }

    setupCanvas() {
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.zIndex = '1';
        this.resize();
    }

    setupResize() {
        window.addEventListener("resize", () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Calculate square size (80% of the smaller dimension)
        const minDimension = Math.min(this.canvas.width, this.canvas.height);
        this.square.size = minDimension * 0.8;
        
        // Center the square
        this.square.x = (this.canvas.width - this.square.size) / 2;
        this.square.y = (this.canvas.height - this.square.size) / 2;
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
        this.createParticles(probability);
    }

    createParticles(probability) {
        // Clear existing particles if probability is very low
        if (probability < 0.1) {
            this.particles = [];
            return;
        }

        // Create new particles based on probability
        const particleCount = Math.floor(probability * this.maxParticles);
        
        // Adjust number of particles
        while (this.particles.length < particleCount && this.particles.length < this.maxParticles) {
            const x = this.square.x + Math.random() * this.square.size;
            const y = this.square.y + Math.random() * this.square.size;
            const hue = Math.random() * 60 + 180; // Blue to cyan range
            this.particles.push(new Particle(x, y, `hsl(${hue}, 80%, 60%)`));
        }
        
        // Remove excess particles
        this.particles = this.particles.slice(-this.maxParticles);
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw square boundary
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.strokeRect(
            this.square.x - this.square.padding,
            this.square.y - this.square.padding,
            this.square.size + (this.square.padding * 2),
            this.square.size + (this.square.padding * 2)
        );

        // Update and draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // Draw particle
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 100;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1.0;
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

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
        
        // Apply some random movement
        this.speedX += (Math.random() - 0.5) * 0.5;
        this.speedY += (Math.random() - 0.5) * 0.5;
        
        // Limit speed
        const maxSpeed = 3;
        const speed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
        if (speed > maxSpeed) {
            this.speedX = (this.speedX / speed) * maxSpeed;
            this.speedY = (this.speedY / speed) * maxSpeed;
        }
    }
}
