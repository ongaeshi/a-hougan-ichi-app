export const speak = (text: string) => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.9; // Slightly slower for kids
  utterance.pitch = 1.1; // Slightly higher pitch

  // Try to find a female/child-like Japanese voice if available
  const voices = window.speechSynthesis.getVoices();
  const jaVoices = voices.filter(v => v.lang.includes('ja') || v.lang.includes('JP'));
  if (jaVoices.length > 0) {
    utterance.voice = jaVoices[0];
  }

  window.speechSynthesis.speak(utterance);
};
