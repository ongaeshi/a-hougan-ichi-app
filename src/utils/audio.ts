let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playCorrectSound = () => {
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
  osc.frequency.exponentialRampToValueAtTime(1108.73, ctx.currentTime + 0.1); // C#6
  
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

export const playIncorrectSound = () => {
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
  
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

export const playPerfectSound = () => {
  const ctx = initAudio();
  
  // A simple fanfare sequence: C5, E5, G5, C6
  const notes = [
    { freq: 523.25, time: 0, duration: 0.15 },    // C5
    { freq: 659.25, time: 0.15, duration: 0.15 }, // E5
    { freq: 783.99, time: 0.3, duration: 0.15 },  // G5
    { freq: 1046.50, time: 0.45, duration: 0.4 }  // C6
  ];
  
  notes.forEach(note => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);
    
    // Envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime + note.time);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + note.time + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + note.time + note.duration);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(ctx.currentTime + note.time);
    osc.stop(ctx.currentTime + note.time + note.duration);
  });
};
