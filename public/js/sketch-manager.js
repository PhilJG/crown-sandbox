class SketchManager {
  constructor() {
    this.currentSketch = null;
    this.sketches = {};
    this.calmProbability = 0;
    this.setupWebSocket();
    this.setupUI();
    this.initializeSketches();
  }

  setupWebSocket() {
    // Connect to Socket.IO server
    this.socket = io();

    this.socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      document.getElementById("status").textContent = "Connected to server";
    });

    this.socket.on("message", (dataStr) => {
      try {
        const data = JSON.parse(dataStr);
        if (data.type === "calmProbability") {
          this.calmProbability = data.probability;
          document.getElementById("calm-prob").textContent = Math.round(
            this.calmProbability * 100
          );

          if (this.currentSketch && this.currentSketch.update) {
            this.currentSketch.update(this.calmProbability);
          }
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
      document.getElementById("status").textContent = "Connection error";
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket.IO disconnected:", reason);
      document.getElementById("status").textContent = "Disconnected";
      // Socket.IO will handle reconnection automatically
    });
  }

  setupUI() {
    const buttons = document.querySelectorAll(".menu-button");
    buttons.forEach((button) => {
      button.addEventListener("click", () =>
        this.setActiveSketch(button.dataset.sketch)
      );
    });
  }

  initializeSketches() {
    // Initialize all sketch classes if they exist
    if (typeof ParticlesSketch !== "undefined") {
      this.sketches.particles = new ParticlesSketch();
    }
    if (typeof WavesSketch !== "undefined") {
      this.sketches.waves = new WavesSketch();
    }
    if (typeof ColorFieldSketch !== "undefined") {
      this.sketches.colorfield = new ColorFieldSketch();
    }

    // Set default active sketch
    this.setActiveSketch("particles");
  }

  setActiveSketch(sketchName) {
    // Hide current sketch if exists
    if (this.currentSketch && this.currentSketch.hide) {
      this.currentSketch.hide();
    }

    // Update UI
    document.querySelectorAll(".menu-button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.sketch === sketchName);
    });

    // Show new sketch
    if (this.sketches[sketchName]) {
      this.currentSketch = this.sketches[sketchName];
      if (this.currentSketch.show) {
        this.currentSketch.show();
      }
      if (this.currentSketch.update) {
        this.currentSketch.update(this.calmProbability);
      }
    } else {
      console.warn(`Sketch '${sketchName}' not found`);
    }
  }
}

// Initialize the sketch manager when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  window.sketchManager = new SketchManager();
});
