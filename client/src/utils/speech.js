import { playHospitalChime, unlockAudioContext } from './soundEffects';

let isSpeechAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;
let speechVoices = [];
let lastSpokenText = '';

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
 * Prioritizes: Female, Zira, Samantha, Google UK English Female, Google US English Female
 */
function findEnglishFemaleVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Exact priority keywords for natural English female voice
  const femaleVoice = voices.find(v => 
    v.lang.startsWith('en') && 
    (v.name.toLowerCase().includes('female') || 
     v.name.includes('Zira') || 
     v.name.includes('Samantha') || 
     v.name.includes('Google UK English Female') || 
     v.name.includes('Google US English Female') ||
     v.name.toLowerCase().includes('natural') ||
     v.name.includes('Victoria') ||
     v.name.includes('Karen'))
  ) || voices.find(v => v.lang.startsWith('en'));

  return femaleVoice;
}

/**
 * Speak text with Web Speech API with slow, clear rate (0.78) and warm pitch (1.05)
 */
function speakText(text, options = {}) {
  const { playChime = true, delayMs = 550 } = options;
  lastSpokenText = text;

  unlockAudioContext();

  if (playChime) {
    playHospitalChime();
  }

  const delay = playChime ? delayMs : 50;

  setTimeout(() => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.rate = 0.78; // Slow, clear, easily understandable
        utterance.pitch = 1.05; // Warm, natural female tone
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

/**
 * High-Clarity Voice Announcement on Token Calling (TV Screen / Doctor Desk)
 * Standard call phrase:
 * "Attention please. Token Number [Token Number]... Patient [Patient Name]... Please proceed to Doctor [Doctor Name]... Room Number [Room Number]."
 */
export function announceTokenCall(tokenNumber, patientName, doctorName, roomNumber, options = {}) {
  const { playChime = true } = options;
  const doc = cleanDoctorName(doctorName);
  const room = extractRoomDigits(roomNumber);
  const patient = patientName || 'Patient';

  const text = `Attention please. Token Number ${tokenNumber}... Patient ${patient}... Please proceed to Doctor ${doc}... Room Number ${room}.`;

  speakText(text, { playChime });
}

/**
 * Automated Voice Announcement on Token Issuance / Booking Generation
 */
export function announceTokenIssuance(tokenNumber, patientName, doctorName, roomNumber, options = {}) {
  const doc = cleanDoctorName(doctorName);
  const room = extractRoomDigits(roomNumber);
  const patient = patientName || 'Patient';

  const text = `Attention please. Token Number ${tokenNumber}... Patient ${patient}... Please proceed to Doctor ${doc}... Room Number ${room}.`;

  speakText(text, { playChime: options.playChime !== false });
}

/**
 * Replay Last Spoken Announcement
 */
export function replayLastAnnouncement() {
  if (lastSpokenText) {
    speakText(lastSpokenText, { playChime: true });
  } else {
    announceTokenCall(101, "Muhammad Ahmad", "Dr. Imran Tahir", "Room 101");
  }
}

export function getLastSpokenText() {
  return lastSpokenText;
}

export function testSpeechAnnouncement() {
  announceTokenCall(104, "Muhammad Tariq", "Dr. Imran Tahir", "Room 101");
}

