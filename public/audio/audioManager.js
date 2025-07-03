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
    // A minor pentatonic scale
    const notes = [
      [4, 'C'], [4, 'D'], [4, 'E'], [4, 'G'], [4, 'A'],
      [5, 'C'], [5, 'D'], [5, 'E'], [5, 'G'], [5, 'A']
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

  playFrequency(frequency, duration = 0.5) {
    if (!this.audioContext || !this.enabled) return;

    this.oscillator = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.05);
    this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

    this.oscillator.start();
    this.oscillator.stop(this.audioContext.currentTime + duration);
  }

  playNoteForProbability(probability) {
    if (!this.scale.length || !this.enabled) return;
    
    const noteIndex = Math.min(Math.floor(probability * this.scale.length), this.scale.length - 1);
    const frequency = this.scale[noteIndex];
    
    if (frequency) {
      this.playFrequency(frequency, 0.5);
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
