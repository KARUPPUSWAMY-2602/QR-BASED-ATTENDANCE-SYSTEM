import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { ScanLine, CheckCircle, XCircle, Camera, CameraOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

export default function ScanQR() {
  const { profile } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [message, setMessage] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  function stopCamera() {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  async function startScanning() {
    setCameraError('');
    setScanState('scanning');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        tick();
      }
    } catch {
      setCameraError('Camera access denied. Please allow camera permission and try again.');
      setScanState('idle');
    }
  }

  function tick() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });
    if (code) {
      stopCamera();
      processQR(code.data);
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  }

  async function processQR(data: string) {
    setScanState('processing');
    try {
      const payload = JSON.parse(data) as { sessionId: string; token: string };
      if (!payload.sessionId || !payload.token) throw new Error('Invalid QR code');

      const { data: session, error: sessErr } = await supabase
        .from('qr_sessions')
        .select('id, expires_at, is_active, subjects(subject_name)')
        .eq('id', payload.sessionId)
        .eq('qr_token', payload.token)
        .maybeSingle();

      if (sessErr || !session) throw new Error('QR code not found. It may have been invalidated.');
      if (!session.is_active) throw new Error('This QR session is no longer active.');
      if (new Date(session.expires_at) < new Date()) throw new Error('QR code has expired. Ask your faculty to generate a new one.');

      const { error: insertErr } = await supabase.from('attendance_records').insert({
        session_id: session.id,
        student_id: profile!.id,
        status: 'present',
      });

      if (insertErr) {
        if (insertErr.code === '23505') throw new Error('Attendance already marked for this session!');
        throw new Error(insertErr.message);
      }

      setSubjectName((session as any).subjects?.subject_name ?? 'Unknown Subject');
      setMessage('Attendance marked successfully!');
      setScanState('success');
    } catch (err) {
      setMessage((err as Error).message);
      setScanState('error');
    }
  }

  function reset() {
    setScanState('idle');
    setMessage('');
    setSubjectName('');
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <ScanLine size={18} className="text-blue-600" />
          <h3 className="font-semibold text-slate-800">Scan QR Code</h3>
        </div>

        <div className="p-5">
          {scanState === 'idle' && (
            <div className="text-center space-y-5">
              {cameraError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm text-left">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  {cameraError}
                </div>
              )}
              <div className="w-40 h-40 mx-auto border-4 border-dashed border-slate-200 rounded-2xl flex items-center justify-center">
                <Camera size={48} className="text-slate-300" />
              </div>
              <div>
                <p className="text-slate-600 text-sm">Point your camera at the QR code shown by your faculty to mark attendance.</p>
              </div>
              <button
                onClick={startScanning}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ScanLine size={18} />
                Start Camera
              </button>
            </div>
          )}

          {scanState === 'scanning' && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-400 opacity-70 animate-pulse" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-500 text-center">Scanning for QR code...</p>
              <button
                onClick={() => { stopCamera(); setScanState('idle'); }}
                className="w-full border border-slate-200 text-slate-700 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CameraOff size={16} />
                Stop Camera
              </button>
            </div>
          )}

          {scanState === 'processing' && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto animate-pulse">
                <ScanLine size={28} className="text-blue-600" />
              </div>
              <p className="text-slate-600 font-medium">Processing QR code...</p>
              <p className="text-slate-400 text-sm">Please wait</p>
            </div>
          )}

          {scanState === 'success' && (
            <div className="text-center space-y-4 py-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle size={40} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-700">Attendance Marked!</p>
                <p className="text-slate-600 text-sm mt-1">{message}</p>
                {subjectName && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-1.5 rounded-full">
                    <CheckCircle size={14} />
                    {subjectName}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400">{new Date().toLocaleString('en-IN')}</p>
              <button onClick={reset} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition-colors">
                Scan Another
              </button>
            </div>
          )}

          {scanState === 'error' && (
            <div className="text-center space-y-4 py-6">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <XCircle size={40} className="text-red-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-red-600">Failed</p>
                <p className="text-slate-600 text-sm mt-1">{message}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={reset} className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium">
                  Cancel
                </button>
                <button onClick={() => { setScanState('idle'); setMessage(''); startScanning(); }} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold">
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-xs text-blue-700 font-medium mb-2">How to mark attendance:</p>
        <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
          <li>Tap "Start Camera" above</li>
          <li>Point camera at the QR code shown by your faculty</li>
          <li>Hold steady — attendance is marked automatically</li>
          <li>You'll see a success confirmation</li>
        </ol>
      </div>
    </div>
  );
}
