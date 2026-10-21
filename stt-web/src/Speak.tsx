import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { socket } from '../services/socket';

export default function Speak() {
  const [params] = useSearchParams();
  const roomRef = useRef<string | null>(
    params.get('room')?.toUpperCase() ?? sessionStorage.getItem('speakRoom'),
  );
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'joined' | 'error'>('idle');
  const [error, setError] = useState('');

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

  useEffect(() => {
    // Joins from the QR code, and rejoins automatically after a dropped connection
    const onConnect = () => { if (roomRef.current) join(roomRef.current); };
    const onDisconnect = () => setStatus('idle');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
    };
  }, []);

  const manualJoin = () => {
    roomRef.current = input.trim().toUpperCase();
    join(roomRef.current);
  };

  if (status === 'joined') {
    return (
      <div style={{ padding: 24 }}>
        <h2>Connected ✅</h2>
        <button onClick={() => socket.emit('caption:test', { text: 'Hello from the teacher' })}>
          Send test caption
        </button>
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