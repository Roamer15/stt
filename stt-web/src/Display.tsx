// import { useEffect, useState, useRef } from "react";
// import { QRCodeSVG } from "qrcode.react";
// import { socket } from "../services/socket";

// export default function Display() {
//   const [code, setCode] = useState<string | null>(null);
//   const [speakerOnline, setSpeakerOnline] = useState(false);
//   const [lines, setLines] = useState<string[]>([]);
//   const [interim, setInterim] = useState("");
//   const [paired, setPaired] = useState(false);

//   useEffect(() => {
//     // Runs on first connect AND every reconnect; resumes the same code if we have one
//     const createRoom = () => {
//       const saved = sessionStorage.getItem("roomCode") ?? undefined;
//       socket.emit("room:create", { code: saved }, (res: { code: string }) => {
//         sessionStorage.setItem("roomCode", res.code);
//         setCode(res.code);
//       });
//     };
//     const onSpeakerOn = () => {
//       setSpeakerOnline(true);
//       setPaired(true);
//     };
//     const onSpeakerOff = () => setSpeakerOnline(false);
//     const onCaption = (c: { text: string; isFinal: boolean }) => {
//       if (c.isFinal) {
//         setLines((l) => [...l.slice(-20), c.text]);
//         setInterim("");
//       } else {
//         setInterim(c.text);
//       }
//     };
//     socket.on("connect", createRoom);
//     socket.on("speaker:connected", onSpeakerOn);
//     socket.on("speaker:disconnected", onSpeakerOff);
//     socket.on("caption", onCaption);
//     socket.connect();

//     return () => {
//       socket.off("connect", createRoom);
//       socket.off("speaker:connected", onSpeakerOn);
//       socket.off("speaker:disconnected", onSpeakerOff);
//       socket.off("caption", onCaption);
//       socket.disconnect();
//     };
//   }, []);

//   const bottomRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [lines, interim]);

//   if (!code) return <p>Connecting…</p>;

//   if (!paired) {
//     return (
//       <div style={{ textAlign: "center", padding: 40 }}>
//         <h1>Scan to start captioning</h1>
//         <QRCodeSVG
//           value={`${window.location.origin}/speak?room=${code}`}
//           size={240}
//         />
//         <h2 style={{ fontSize: 64, letterSpacing: 12 }}>{code}</h2>
//         <p>Or open this site on your phone and type the code</p>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: 40, fontSize: 48, lineHeight: 1.3 }}>
//       {!speakerOnline && (
//         <div
//           style={{
//             position: "fixed",
//             top: 12,
//             right: 12,
//             fontSize: 18,
//             opacity: 0.7,
//           }}
//         >
//           Teacher disconnected, reconnecting…
//         </div>
//       )}
//       {lines.map((line, i) => (
//         <p key={i}>{line}</p>
//       ))}
//       {interim && <p style={{ opacity: 0.55 }}>{interim}</p>}
//       <div ref={bottomRef} />
//     </div>
//   );
// }
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { socket } from '../services/socket';
import './Display.css';

export default function Display() {
  const [code, setCode] = useState<string | null>(null);
  const [paired, setPaired] = useState(false);
  const [speakerOnline, setSpeakerOnline] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [interim, setInterim] = useState('');

  useEffect(() => {
    const createRoom = () => {
      const saved = sessionStorage.getItem('roomCode') ?? undefined;
      socket.emit('room:create', { code: saved }, (res: { code: string }) => {
        sessionStorage.setItem('roomCode', res.code);
        setCode(res.code);
      });
    };
    const onSpeakerOn = () => { setSpeakerOnline(true); setPaired(true); };
    const onSpeakerOff = () => setSpeakerOnline(false);
    const onCaption = (c: { text: string; isFinal: boolean }) => {
      setPaired(true); // also covers a TV page reload while the teacher is mid-lesson
      if (c.isFinal) {
        setLines((l) => [...l.slice(-11), c.text]);
        setInterim('');
      } else {
        setInterim(c.text);
      }
    };

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

  if (!code) {
    return (
      <div className="tv">
        <div className="tv-pair"><p className="tv-hint">Connecting…</p></div>
      </div>
    );
  }

  if (!paired) {
    return (
      <div className="tv">
        <div className="tv-pair">
          <h1>Scan to start captioning</h1>
          <div className="tv-qr">
            <QRCodeSVG value={`${window.location.origin}/speak?room=${code}`} size={256} />
          </div>
          <div className="tv-code">{code}</div>
          <p className="tv-hint">Or open this site on your phone and type the code</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tv">
      {!speakerOnline && <div className="tv-status">Teacher disconnected, reconnecting…</div>}
      <div className="tv-captions">
        {lines.map((line, i) => <p key={i} className="tv-line">{line}</p>)}
        {interim && <p className="tv-line tv-interim">{interim}</p>}
      </div>
    </div>
  );
}