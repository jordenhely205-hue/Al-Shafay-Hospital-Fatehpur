import React, { useState } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  Download, 
  Printer, 
  Sliders, 
  Contrast, 
  Eye, 
  FileText 
} from 'lucide-react';

export default function ScanLightboxModal({ images = [], initialIndex = 0, title = 'Diagnostic Radiology Scan', patientName = '', onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isInverted, setIsInverted] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setIsInverted(false);
    setBrightness(100);
    setContrast(100);
  };

  const handlePrint = () => {
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(`
        <html>
          <head>
            <title>${title} - ${patientName}</title>
            <style>
              body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; }
              img { max-width: 95%; max-height: 85vh; object-fit: contain; }
              .header { margin-top: 20px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Al-Shafay Hospital Fatehpur - Diagnostic Radiology</h2>
              <p>Patient: <strong>${patientName}</strong> | Scan: <strong>${title}</strong></p>
            </div>
            <img src="${currentImage}" />
          </body>
        </html>
      `);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
        printWin.close();
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl text-white select-none">
      
      {/* Top Header Bar */}
      <div className="h-16 px-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
              Radiology Viewer
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white uppercase">{title}</h2>
          </div>
          {patientName && (
            <p className="text-xs text-slate-400">Patient: <strong className="text-white uppercase">{patientName}</strong> • Scan {currentIndex + 1} of {images.length}</p>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            title="Zoom In (+)"
          >
            <ZoomIn size={18} />
          </button>

          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            title="Zoom Out (-)"
          >
            <ZoomOut size={18} />
          </button>

          <button
            onClick={handleRotate}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            title="Rotate 90° Clockwise"
          >
            <RotateCw size={18} />
          </button>

          <button
            onClick={() => setIsInverted(!isInverted)}
            className={`p-2 rounded-xl border transition ${
              isInverted ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            title="Invert Contrast (X-Ray Negative Mode)"
          >
            <Contrast size={18} />
          </button>

          <button
            onClick={handleReset}
            className="hidden sm:flex p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Reset Transform"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition"
            title="Print Radiology Scan"
          >
            <Printer size={18} />
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1"></div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition"
            title="Close Lightbox"
          >
            <X size={20} />
          </button>

        </div>
      </div>

      {/* Main Image Stage */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center p-4">
        
        <div 
          className="transition-transform duration-150 ease-out max-w-full max-h-full flex items-center justify-center"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            filter: `invert(${isInverted ? '1' : '0'}) brightness(${brightness}%) contrast(${contrast}%)`
          }}
        >
          <img
            src={currentImage}
            alt={title}
            className="max-h-[75vh] max-w-[85vw] object-contain rounded-lg shadow-2xl border border-slate-800 cursor-grab active:cursor-grabbing"
            draggable={false}
          />
        </div>

        {/* Floating Zoom Indicator */}
        <div className="absolute bottom-6 left-6 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-teal-300 font-bold backdrop-blur-md">
          {Math.round(zoom * 100)}% • {rotation}° {isInverted ? '• Negative View' : ''}
        </div>

      </div>

      {/* Bottom Filmstrip (if multiple scans attached) */}
      {images.length > 1 && (
        <div className="h-20 bg-slate-950/90 border-t border-slate-800 px-6 flex items-center gap-3 overflow-x-auto shrink-0 z-10">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                handleReset();
              }}
              className={`h-14 w-20 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                currentIndex === idx ? 'border-teal-400 scale-105 shadow-lg shadow-teal-500/30' : 'border-slate-800 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
