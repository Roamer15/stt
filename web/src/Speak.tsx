import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { socket } from '../services/socket';
import { Mic } from 'lucide-react';

export default function Speak() {
  const [params] = useSearchParams();
  const roomRef = useRef<string | null>(
    params.get('room')?.toUpperCase() ?? sessionStorage.getItem('speakRoom'),
  );
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const wantRecordingRef = useRef(false); // the teacher's intent: should we be recording?

  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'joined' | 'error'>('idle');
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState('');

  const releaseMic = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
    setRecording(false);
  };

  // Stops the local recorder WITHOUT telling the server (used when the connection drops)
  const haltLocally = () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.onstop = null;
      rec.stop();
    }
    recorderRef.current = null;
    releaseMic();
  };

  const beginRecording = async () => {
    if (recorderRef.current?.state === 'recording') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      socket.emit('speech:start');

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) socket.emit('audio', e.data);
      };
      recorder.onstop = () => socket.emit('speech:stop');
      recorder.start(250);
      recorderRef.current = recorder;
      setRecording(true);
      setError('');

      wakeLockRef.current =
        (await navigator.wakeLock?.request('screen').catch(() => null)) ?? null;
    } catch {
      setError('Microphone unavailable or permission denied');
    }
  };

  const join = (code: string) => {
    socket.emit('room:join', { code }, (res: { ok: boolean; error?: string }) => {
      if (res.ok) {
        sessionStorage.setItem('speakRoom', code);
        setStatus('joined');
        setError('');
        // Resume automatically if the teacher had been captioning before the drop
        if (wantRecordingRef.current) beginRecording();
      } else {
        setStatus('error');
        setError(res.error ?? 'Could not join');
      }
    });
  };

  useEffect(() => {
    const onConnect = () => { if (roomRef.current) join(roomRef.current); };
    const onDisconnect = () => {
      setStatus('idle');
      haltLocally(); // wantRecordingRef stays true so we resume after reconnecting
    };
    const onCaption = (c: { text: string }) => setPreview(c.text);

    // The wake lock and mic are lost when the page is hidden; restore them on return
    const onVisible = () => {
      if (
        document.visibilityState === 'visible' &&
        wantRecordingRef.current &&
        socket.connected &&
        recorderRef.current?.state !== 'recording'
      ) {
        beginRecording();
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('caption', onCaption);
    document.addEventListener('visibilitychange', onVisible);
    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('caption', onCaption);
      document.removeEventListener('visibilitychange', onVisible);
      haltLocally();
      socket.disconnect();
    };
  }, []);

  const startCaptioning = () => {
    wantRecordingRef.current = true;
    beginRecording();
  };

  const stopCaptioning = () => {
    wantRecordingRef.current = false;
    recorderRef.current?.stop(); // onstop tells the server
    recorderRef.current = null;
    releaseMic();
  };

  const manualJoin = () => {
    roomRef.current = input.trim().toUpperCase();
    join(roomRef.current);
  };

  if (status === 'joined') {
    return (
      <div className="min-h-screen bg-[#f5f5f7] text-slate-900 antialiased">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-5 py-10">
          <div className="w-full max-w-xl rounded-4xl border border-black/5 bg-white/80 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
                  Teacher
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-slate-900">
                  Connected
                </h2>
              </div>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${
                  recording
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-slate-200 bg-slate-100 text-slate-600'
                }`}
              >
                {recording ? 'Live' : 'Ready'}
              </span>
            </div>

            <button
              type="button"
              onClick={recording ? stopCaptioning : startCaptioning}
              className={`flex w-full items-center justify-center gap-3 rounded-[20px] px-5 py-4 text-base font-medium transition-all duration-200 ease-out ${
                recording
                  ? 'bg-slate-900 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] hover:bg-slate-800'
                  : 'border border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full ${
                  recording ? 'bg-white/10 text-white' : 'bg-slate-900 text-white'
                }`}
              >
                <Mic size={20} />
              </span>
              {recording ? 'Stop captioning' : 'Start captioning'}
            </button>

            <div className="mt-6 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Live caption
              </p>
              <p className="min-h-18 text-base leading-7 text-slate-700">
                {preview || 'Waiting for transcript...'}
              </p>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900 antialiased">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-5 py-10">
        <div className="w-full max-w-md rounded-4xl border border-black/5 bg-white/80 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
            Teacher
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-slate-900">
            {wantRecordingRef.current ? 'Reconnecting…' : 'Enter room code'}
          </h2>

          <div className="mt-6 flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={6}
              placeholder="ABC123"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
            <button
              type="button"
              onClick={manualJoin}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Join
            </button>
          </div>

          {status === 'error' && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}