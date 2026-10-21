import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { socket } from '../services/socket';

export default function Display() {
  const [code, setCode] = useState<string | null>(null);
  const [speakerOnline, setSpeakerOnline] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    // Runs on first connect AND every reconnect; resumes the same code if we have one
    const createRoom = () => {
      const saved = sessionStorage.getItem('roomCode') ?? undefined;
      socket.emit('room:create', { code: saved }, (res: { code: string }) => {
        sessionStorage.setItem('roomCode', res.code);
        setCode(res.code);
      });
    };
    const onSpeakerOn = () => setSpeakerOnline(true);
    const onSpeakerOff = () => setSpeakerOnline(false);
    const onCaption = (c: { text: string }) => setLines((l) => [...l.slice(-20), c.text]);

    socket.on('connect', createRoom);
    socket.on('speaker:connected', onSpeakerOn);
    socket.on('speaker:disconnected', onSpeakerOff);
    socket.on('caption', onCaption);
    socket.connect();

    return () => {
      socket.off('connect', createRoom);
      socket.off('speaker:connected', onSpeakerOn);
      socket.off('speaker:disconnected', onSpeakerOff);
      socket.off('caption', onCaption);
      socket.disconnect();
    };
  }, []);

  if (!code) return <p>Connecting…</p>;

  if (!speakerOnline) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h1>Scan to start captioning</h1>
        <QRCodeSVG value={`${window.location.origin}/speak?room=${code}`} size={240} />
        <h2 style={{ fontSize: 64, letterSpacing: 12 }}>{code}</h2>
        <p>Or open this site on your phone and type the code</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, fontSize: 48 }}>
      {lines.map((line, i) => <p key={i}>{line}</p>)}
    </div>
  );
}