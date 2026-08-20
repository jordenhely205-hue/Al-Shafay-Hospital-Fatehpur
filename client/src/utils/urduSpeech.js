import { playHospitalChime } from './soundEffects';

// Number to Urdu Words Converter (1 to 999)
const urduUnits = [
  '', 'ایک', 'دو', 'تین', 'چار', 'پانچ', 'چھ', 'سات', 'آٹھ', 'نو',
  'دس', 'گیارہ', 'بارہ', 'تیرہ', 'چودہ', 'پندرہ', 'سولہ', 'سترہ', 'اٹھارہ', 'انیس'
];

const urduTens = [
  '', '', 'بیس', 'تیس', 'چالیس', 'پچاس', 'سٹھ', 'ستر', 'اسی', 'نوے'
];

const urduCompound20to99 = {
  21: 'اکیس', 22: 'بائیس', 23: 'تیئیس', 24: 'چوبیس', 25: 'پچیس', 26: 'چھبیس', 27: 'ستائیس', 28: 'اٹھائیس', 29: 'انتیس',
  31: 'اکتیس', 32: 'بتیس', 33: 'تینتیس', 34: 'چونتیس', 35: 'پینتیس', 36: 'چھتیس', 37: 'سینتیس', 38: 'اڑتیس', 39: 'انتالیس',
  41: 'اکتالیس', 42: 'بیالیس', 43: 'تینتالیس', 44: 'چوالیس', 45: 'پینتالیس', 46: 'چھیاالیس', 47: 'سینتالیس', 48: 'اڑتالیس', 49: 'انچاس',
  51: 'اکیاون', 52: 'باون', 53: 'ترپین', 54: 'چون', 55: 'پچپن', 56: 'چھپن', 57: 'ستاون', 58: 'اٹھاون', 59: 'انسٹھ',
  61: 'اکسٹھ', 62: 'باسٹھ', 63: 'تریسٹھ', 64: 'چونسٹھ', 65: 'پینسٹھ', 66: 'چھیاسٹھ', 67: 'ستاسٹھ', 68: 'اٹھاسٹھ', 69: 'انہتر',
  71: 'اکہتر', 72: 'بہتر', 73: 'تہتر', 74: 'چوہتر', 75: 'پچہتر', 76: 'چھہتر', 77: 'ستتر', 78: 'اٹھتر', 79: 'اناسی',
  81: 'اکیاسی', 82: 'بیاسی', 83: 'تراسی', 84: 'چوراسی', 85: 'پچاسی', 86: 'چھیاسی', 87: 'ستاسی', 88: 'اٹھاسی', 89: 'نواسی',
  91: 'اکیانوے', 92: 'بانوے', 93: 'ترانوے', 94: 'چورانوے', 95: 'پچانوے', 96: 'چھیانوے', 97: 'ستانوے', 98: 'اٹھانوے', 99: 'نناوے'
};

export function convertNumberToUrdu(num) {
  const n = parseInt(num, 10);
  if (isNaN(n) || n === 0) return 'صفر';
  if (n < 20) return urduUnits[n];
  if (n < 100) {
    if (urduCompound20to99[n]) return urduCompound20to99[n];
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return ones === 0 ? urduTens[tens] : `${urduTens[tens]} ${urduUnits[ones]}`;
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rem = n % 100;
    const hundredWord = hundreds === 1 ? 'ایک سو' : `${urduUnits[hundreds]} سو`;
    return rem === 0 ? hundredWord : `${hundredWord} ${convertNumberToUrdu(rem)}`;
  }
  return String(num);
}

// Convert Room Number to Urdu
export function convertRoomToUrdu(roomStr) {
  if (!roomStr) return 'کمرہ نمبر ایک';
  const digits = roomStr.replace(/\D/g, '');
  if (digits) {
    return `کمرہ نمبر ${convertNumberToUrdu(digits)}`;
  }
  return roomStr;
}

// Play Urdu speech with dual-mode (Web Speech ur-PK + Google TTS stream fallback)
export function speakUrduAnnouncement(urduText, options = {}) {
  const { playChime = true, onEnd } = options;

  if (playChime) {
    playHospitalChime();
  }

  const delay = playChime ? 650 : 50;

  setTimeout(() => {
    try {
      // 1. Try Browser Native Web Speech API
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const voices = window.speechSynthesis.getVoices();
        const urduVoice = voices.find(v => 
          v.lang.startsWith('ur') || 
          v.lang === 'ur-PK' || 
          v.lang === 'ur-IN' || 
          v.name.toLowerCase().includes('urdu')
        );

        if (urduVoice) {
          const utterance = new SpeechSynthesisUtterance(urduText);
          utterance.voice = urduVoice;
          utterance.lang = urduVoice.lang || 'ur-PK';
          utterance.rate = 0.88;
          utterance.pitch = 1.0;
          if (onEnd) utterance.onend = onEnd;
          window.speechSynthesis.speak(utterance);
          return;
        }
      }

      // 2. Fallback: Google Translate Urdu TTS Audio Stream
      const encodedText = encodeURIComponent(urduText);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=ur&client=tw-ob`;
      
      const audio = new Audio(audioUrl);
      audio.playbackRate = 0.95;
      audio.onended = () => {
        if (onEnd) onEnd();
      };
      audio.onerror = (err) => {
        console.warn("Urdu audio stream error, falling back to standard voice synth:", err);
        // Fallback to standard voice if network fails
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const fallbackUtterance = new SpeechSynthesisUtterance(urduText);
          fallbackUtterance.rate = 0.85;
          window.speechSynthesis.speak(fallbackUtterance);
        }
      };
      audio.play().catch(e => {
        console.warn("Audio play prevented:", e);
      });

    } catch (e) {
      console.error("Urdu speech announcement error:", e);
    }
  }, delay);
}

// Generate Urdu Announcement for Standard OPD Call
export function announceUrduTokenCall(tokenNumber, patientName, doctorName, roomNumber, options = {}) {
  const urduNum = convertNumberToUrdu(tokenNumber);
  const urduRoom = convertRoomToUrdu(roomNumber);
  
  const text = `توجہ فرمائیے۔ ٹوکن نمبر ${urduNum}، مریض ${patientName}، برائے مہربانی ${doctorName}، ${urduRoom} میں تشریف لے جائیں۔`;
  speakUrduAnnouncement(text, options);
}

// Generate Urdu Announcement for Doctor-to-Doctor Referral Call
export function announceUrduReferralCall(tokenNumber, patientName, targetDoctorName, targetRoomNumber, options = {}) {
  const urduNum = convertNumberToUrdu(tokenNumber);
  const urduRoom = convertRoomToUrdu(targetRoomNumber);

  const text = `توجہ فرمائیے۔ ٹوکن نمبر ${urduNum}، مریض ${patientName}، برائے مہربانی اگلے چیک اپ کے لیے ${targetDoctorName}، ${urduRoom} میں تشریف لے جائیں۔`;
  speakUrduAnnouncement(text, options);
}
