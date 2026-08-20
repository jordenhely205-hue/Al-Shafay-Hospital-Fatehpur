import { playHospitalChime } from './soundEffects';

let isSpeechAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;
let speechVoices = [];

if (isSpeechAvailable) {
  const loadVoices = () => {
    speechVoices = window.speechSynthesis.getVoices();
  };
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

// Clean Room formatting helper
function extractRoomDigits(roomStr) {
  if (!roomStr) return '101';
  const clean = roomStr.replace(/[^0-9]/g, '');
  return clean || roomStr.replace(/^room\s*/i, '');
}

// Clean Doctor name
function cleanDoctorName(docStr) {
  if (!docStr) return 'Imran Tahir';
  return docStr.replace(/^Dr\.?\s*/i, '').replace(/^Doctor\s*/i, '');
}

/**
 * Filter and select a high-clarity natural English Female voice
 */
function findEnglishFemaleVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Filter criteria for female voice
  const femaleVoice = voices.find(v => 
    v.lang.startsWith('en') && 
    (v.name.toLowerCase().includes('female') || 
     v.name.includes('Zira') || 
     v.name.includes('Samantha') || 
     v.name.includes('Google UK English Female') || 
     v.name.includes('Google US English Female') ||
     v.name.includes('Natural'))
  ) || voices.find(v => v.lang.startsWith('en'));

  return femaleVoice;
}

/**
 * High-Clarity Female Voice TTS Engine
 * Speech Parameters:
 * - Speed rate = 0.78 (Slow, clear, easily understandable)
 * - Pitch = 1.05 (Crisp, warm female tone)
 * 
 * Phrasing:
 * - Standard Calling:
 *   "Attention please. Token Number [X]... Patient [Name]... Please go to Doctor [Doc]... Room Number [Room]."
 * - Patient Transfer / Referral:
 *   "Attention please. Token Number [X]... Patient [Name]... Please proceed for your follow-up checkup with Doctor [Doc]... Room Number [Room]."
 */
export function announceTokenCall(tokenNumber, patientName, doctorName, roomNumber, options = {}) {
  const { isReferral = false, playChime = true } = options;

  if (playChime) {
    playHospitalChime();
  }

  const doc = cleanDoctorName(doctorName);
  const room = extractRoomDigits(roomNumber);
  const patient = patientName || 'Patient';

  // Exact Requested Phrasing
  const text = isReferral
    ? `Attention please. Token Number ${tokenNumber}... Patient ${patient}... Please proceed for your follow-up checkup with Doctor ${doc}... Room Number ${room}.`
    : `Attention please. Token Number ${tokenNumber}... Patient ${patient}... Please go to Doctor ${doc}... Room Number ${room}.`;

  const delay = playChime ? 650 : 50;

  setTimeout(() => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.rate = 0.78; // Slow, clear, easily understandable
        utterance.pitch = 1.05; // Crisp, warm female tone
        utterance.lang = 'en-US';

        const femaleVoice = findEnglishFemaleVoice();
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }

        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("Speech synthesis announcement error:", e);
    }
  }, delay);
}

export function testSpeechAnnouncement() {
  announceTokenCall(104, "Muhammad Tariq", "Dr. Imran Tahir", "Room 101", { isReferral: false });
}
