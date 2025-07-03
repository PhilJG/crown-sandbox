export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.oscillator = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.currentNote = null;
    this.scale = [];
    this.enabled = false;
    this.initAudio();
  }

  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.setupScale();
    } catch (e) {
      console.error('Web Audio API is not supported in this browser', e);
    }
  }

  setupScale() {
    // Expanded scale with more notes for better resolution in the target range
    const notes = [
      [3, 'A'], [3, 'B'], [4, 'C'], [4, 'D'], [4, 'E'], [4, 'F#'], [4, 'G'], [4, 'A'], 
      [4, 'B'], [5, 'C'], [5, 'D'], [5, 'E'], [5, 'F#'], [5, 'G'], [5, 'A'], [5, 'B']
    ];
    
    this.scale = notes.map(([octave, note]) => {
      return this.noteToFrequency(note, octave);
    });
  }

  noteToFrequency(note, octave) {
    const notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    const keyNumber = notes.indexOf(note);
    if (keyNumber < 0) return null;
    
    const A4 = 440;
    const A4_KEY_NUMBER = 9;
    const A4_OCTAVE = 4;
    
    const distance = (octave - A4_OCTAVE) * 12 + (keyNumber - A4_KEY_NUMBER);
    return A4 * Math.pow(2, distance / 12);
  }

  playFrequency(frequency, duration = 0.5, volume = 0.2) {
    if (!this.audioContext || !this.enabled) return;

    this.oscillator = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // Make volume proportional to the probability
    const minGain = 0.1;
    const maxGain = 0.3;
    const gain = minGain + (volume * (maxGain - minGain));

    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(gain, this.audioContext.currentTime + 0.05);
    this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

    this.oscillator.start();
    this.oscillator.stop(this.audioContext.currentTime + duration);
  }

  playNoteForProbability(probability) {
    if (!this.scale.length || !this.enabled) return;
    
    // Apply a non-linear mapping to be more sensitive in the 0.2-0.45 range
    // This will expand the middle range and compress the extremes
    let mappedProbability;
    if (probability < 0.2) {
      // Compress the lower range
      mappedProbability = probability * 0.5;
    } else if (probability > 0.45) {
      // Compress the upper range
      mappedProbability = 0.7 + (probability - 0.45) * 0.3;
    } else {
      // Expand the middle range (0.2-0.45)
      mappedProbability = 0.5 + (probability - 0.2) * 0.8;
    }
    
    // Ensure we're within bounds
    mappedProbability = Math.max(0, Math.min(1, mappedProbability));
    
    // Map to note index with some overlap between octaves for smoother transitions
    const noteIndex = Math.min(
      Math.floor(mappedProbability * (this.scale.length + 2)) - 1,
      this.scale.length - 1
    );
    
    if (noteIndex >= 0 && noteIndex < this.scale.length) {
      this.playFrequency(this.scale[noteIndex], 0.4, probability);
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.enabled;
  }

  stop() {
    if (this.oscillator) {
      this.oscillator.stop();
    }
  }
}
