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
      <div className='p-6'>
        <h2>Connected ✅</h2>
        {recording ? (
          <button onClick={stopCaptioning}>
            <Mic size={48}/>
            Stop captioning</button>
        ) : (
          <button onClick={startCaptioning}>Start captioning</button>
        )}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <p style={{ opacity: 0.6 }}>{preview}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>{wantRecordingRef.current ? 'Reconnecting…' : 'Enter room code'}</h2>
      <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={6} />
      <button onClick={manualJoin}>Join</button>
      {status === 'error' && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}