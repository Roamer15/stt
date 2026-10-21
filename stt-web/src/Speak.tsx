// import { useEffect, useRef, useState } from 'react';
// import { useSearchParams } from 'react-router-dom';
// import { socket } from '../services/socket';

// export default function Speak() {
//   const [params] = useSearchParams();
//   const roomRef = useRef<string | null>(
//     params.get('room')?.toUpperCase() ?? sessionStorage.getItem('speakRoom'),
//   );
//   const [input, setInput] = useState('');
//   const [status, setStatus] = useState<'idle' | 'joined' | 'error'>('idle');
//   const [error, setError] = useState('');

//   const join = (code: string) => {
//     socket.emit('room:join', { code }, (res: { ok: boolean; error?: string }) => {
//       if (res.ok) {
//         sessionStorage.setItem('speakRoom', code);
//         setStatus('joined');
//         setError('');
//       } else {
//         setStatus('error');
//         setError(res.error ?? 'Could not join');
//       }
//     });
//   };

//   useEffect(() => {
//     // Joins from the QR code, and rejoins automatically after a dropped connection
//     const onConnect = () => { if (roomRef.current) join(roomRef.current); };
//     const onDisconnect = () => setStatus('idle');

//     socket.on('connect', onConnect);
//     socket.on('disconnect', onDisconnect);
//     socket.connect();

//     return () => {
//       socket.off('connect', onConnect);
//       socket.off('disconnect', onDisconnect);
//       socket.disconnect();
//     };
//   }, []);

//   const manualJoin = () => {
//     roomRef.current = input.trim().toUpperCase();
//     join(roomRef.current);
//   };

//   if (status === 'joined') {
//     return (
//       <div style={{ padding: 24 }}>
//         <h2>Connected ✅</h2>
//         <button onClick={() => socket.emit('caption:test', { text: 'Hello from the teacher' })}>
//           Send test caption
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: 24 }}>
//       <h2>Enter room code</h2>
//       <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={6} />
//       <button onClick={manualJoin}>Join</button>
//       {status === 'error' && <p style={{ color: 'red' }}>{error}</p>}
//     </div>
//   );
// }
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { socket } from '../services/socket';

export default function Speak() {
  const [params] = useSearchParams();
  const roomRef = useRef<string | null>(
    params.get('room')?.toUpperCase() ?? sessionStorage.getItem('speakRoom'),
  );
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'joined' | 'error'>('idle');
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState('');

  const join = (code: string) => {
    socket.emit('room:join', { code }, (res: { ok: boolean; error?: string }) => {
      if (res.ok) {
        sessionStorage.setItem('speakRoom', code);
        setStatus('joined');
        setError('');
      } else {
        setStatus('error');
        setError(res.error ?? 'Could not join');
      }
    });
  };

  const releaseMic = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
    setRecording(false);
  };

  useEffect(() => {
    const onConnect = () => { if (roomRef.current) join(roomRef.current); };
    const onDisconnect = () => {
      setStatus('idle');
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      releaseMic(); // the teacher taps Start again after reconnecting
    };
    const onCaption = (c: { text: string }) => setPreview(c.text);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('caption', onCaption);
    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('caption', onCaption);
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      releaseMic();
      socket.disconnect();
    };
  }, []);

  const startCaptioning = async () => {
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
      // Tell the server to stop only after the last chunk has been sent
      recorder.onstop = () => socket.emit('speech:stop');
      recorder.start(250); // one chunk every 250 ms
      recorderRef.current = recorder;
      setRecording(true);

      // Keep the screen on, otherwise the browser suspends the mic
      wakeLockRef.current = (await navigator.wakeLock?.request('screen').catch(() => null)) ?? null;
    } catch {
      setError('Microphone unavailable or permission denied');
    }
  };

  const stopCaptioning = () => {
    recorderRef.current?.stop();
    releaseMic();
  };

  const manualJoin = () => {
    roomRef.current = input.trim().toUpperCase();
    join(roomRef.current);
  };

  if (status === 'joined') {
    return (
      <div style={{ padding: 24 }}>
        <h2>Connected ✅</h2>
        {recording ? (
          <button onClick={stopCaptioning}>Stop captioning</button>
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
      <h2>Enter room code</h2>
      <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={6} />
      <button onClick={manualJoin}>Join</button>
      {status === 'error' && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}