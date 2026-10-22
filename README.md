# Vcribe

Real-time classroom captions. A teacher speaks into a phone, and the words
appear live on a TV or computer screen, so students who are deaf, hard of
hearing, or struggling with fast speech and accents can follow the lesson.

**Live demo:** <https://vcribe.vercel.app>


## How it works

1. Open `/display` on a TV or computer. It shows a QR code and a 6-character
   room code.
2. The teacher scans the QR code (or types the code) on their phone at
   `/speak`, taps **Start captioning**, and speaks.
3. The phone streams microphone audio to the server over Socket.IO.
4. The server relays the audio to Deepgram's streaming speech-to-text API and
   broadcasts the transcripts to everyone in the room.
5. The display shows captions as they arrive: interim text in grey, replaced
   by the final text once each phrase is complete.

```
Phone (/speak) --audio--> NestJS server --audio--> Deepgram
                               |  <------ transcripts ------
Display (/display) <-- captions (Socket.IO room)
```

## Features

- Pairing by QR code or room code, with no accounts and no installs
- Phone side is a web page, so the teacher needs no app
- Live interim and final captions with large, high-contrast text for TVs
- Automatic reconnect and resume after a dropped connection
- Deepgram API key stays on the server and is never exposed to the browser

## Tech stack

- **Client:** React, Vite, TypeScript, React Router, Socket.IO client
- **Server:** NestJS, Socket.IO, `ws`, TypeScript
- **Speech-to-text:** Deepgram streaming API (Nova-3)

## Project structure

```
captionify/
├── client/                 # React app (display + phone pages)
│   └── src/
│       ├── App.tsx
│       ├── Display.tsx     # TV/computer page: room code, QR, captions
│       ├── Speak.tsx       # Teacher's phone page: join + capture mic
│       └── socket.ts
└── server/                 # NestJS app
    └── src/captions/
        ├── caption.gateway.ts        # Socket.IO events
        ├── rooms.service.ts          # Room code generation
        └── transcription.service.ts  # Deepgram relay
```

## Getting started

### Prerequisites

- Node.js 20+ and pnpm
- A [Deepgram](https://deepgram.com) API key

### Install

```bash
git clone git@github.com:Roamer15/vcribe.git
cd vcribe

cd server && pnpm install
cd ../client && pnpm install
```

### Configure

Create `server/.env`:

```
DEEPGRAM_API_KEY=your_key_here
```

### Run

```bash
# Terminal 1
cd server && pnpm start:dev

# Terminal 2
cd client && pnpm dev
```

### Try it on one computer

1. Open `http://localhost:5173/display` and note the room code.
2. In another tab, open `http://localhost:5173/speak`, enter the code, and
   tap **Start captioning**.
3. Speak, and captions should appear in the display tab.

`localhost` counts as a secure context, so the microphone works without
HTTPS.

### Try it with a real phone

Browsers only allow microphone access on HTTPS. Expose the dev server with a
tunnel such as ngrok (`ngrok http 5173`), open the HTTPS URL's `/display` on
your computer, and scan the QR code with your phone.

## Deployment

- Host the client as a static site. Because the app uses client-side routing,
  configure a rewrite so every path serves `index.html` (otherwise `/speak`
  returns a 404 when opened from the QR code).
- Host the server somewhere that supports long-lived WebSocket connections.
- Everything must be served over HTTPS for the microphone to work.
- Keep `DEEPGRAM_API_KEY` in the server's environment variables only.

## Known limitations

- **Phone must stay awake and in the foreground.** Mobile browsers suspend the
  microphone when the screen locks. Captioning resumes automatically when the
  page returns to the foreground.
- **iOS Safari is untested.** It records in a different audio format than
  Android Chrome. A raw PCM capture path would be needed for reliable iOS
  support.
- **Rooms are stored in server memory.** A server restart clears them. A
  persistent store such as Redis is planned.
- **Smart TV browsers can be unreliable.** Many ship with old browser engines.
  The most dependable setup is a laptop or streaming stick connected to the TV
  by HDMI, opening `/display` in a current browser.
- **Accuracy depends on microphone placement and classroom noise.** A phone
  near the teacher or a clip-on microphone works much better than a phone
  across the room.

## Roadmap

- [ ] Classroom testing and feedback from students
- [ ] French and mixed English/French lessons
- [ ] Persistent rooms and room expiry
- [ ] Caption history the student can scroll back through
- [ ] Adjustable text size and colours on the display
- [ ] iOS support via raw PCM audio capture

## Author

Built by [Ian Langeh](https://x.com/Bel78709)

## License

[MIT](./LICENSE)