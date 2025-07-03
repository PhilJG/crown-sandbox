class ColorFieldSketch {
    constructor() {
        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");
        
        // Color field properties
        this.time = 0;
        this.animationId = null;
        this.calmLevel = 0;
        this.targetCalmLevel = 0;
        this.particles = [];
        this.maxParticles = 50;

        // Setup
        this.setupCanvas();
        this.setupResize();
        this.initializeParticles();
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
        this.initializeParticles();
    }

    initializeParticles() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.addParticle();
        }
    }

    addParticle() {
        const size = Math.random() * 50 + 50;
        this.particles.push({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: size,
            baseSize: size,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            color: this.getRandomColor(),
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02
        });
    }

    getRandomColor() {
        // Generate colors in the blue/teal spectrum
        const hue = 180 + Math.random() * 60; // 180-240 for blue-teal range
        return `hsla(${hue}, 70%, 60%, 0.3)`;
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
        // Smoothly transition to target calm level
        this.targetCalmLevel = probability;
        this.calmLevel += (this.targetCalmLevel - this.calmLevel) * 0.1;
        
        // Adjust particle count based on calm level
        const targetParticles = Math.floor(probability * this.maxParticles * 1.5);
        while (this.particles.length < targetParticles && this.particles.length < this.maxParticles) {
            this.addParticle();
        }
        this.particles = this.particles.slice(0, targetParticles);
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update time
        this.time += 0.01;
        
        // Draw background gradient based on calm level
        this.drawBackground();
        
        // Update and draw particles
        this.updateParticles();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        const hue = 200 - this.calmLevel * 40; // More blue when calmer
        const saturation = 80 + this.calmLevel * 20; // More saturated when calmer
        const lightness = 95 - this.calmLevel * 30; // Darker when calmer
        
        gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`);
        gradient.addColorStop(1, `hsla(${hue + 20}, ${saturation - 20}%, ${lightness - 20}%, 0.8)`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    updateParticles() {
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.rotation += particle.rotationSpeed;
            
            // Bounce off edges
            if (particle.x < 0 || particle.x > this.canvas.width) particle.speedX *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.speedY *= -1;
            
            // Adjust size based on calm level
            const targetSize = particle.baseSize * (0.5 + this.calmLevel);
            particle.size += (targetSize - particle.size) * 0.1;
            
            // Draw particle
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(1, particle.color.replace('0.3', '0'));
            
            this.ctx.fillStyle = gradient;
            this.ctx.globalAlpha = 0.1 + this.calmLevel * 0.2;
            this.ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
            
            this.ctx.restore();
        });
    }
}
