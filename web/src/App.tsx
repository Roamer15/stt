import { Link, Route, Routes } from 'react-router-dom';
import Display from './Display';
import Speak from './Speak';
import Speaktest from './Speaktest';

function Home() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Live Captions</h1>
      <p><Link to="/display">TV / computer (display)</Link></p>
      <p><Link to="/speak">Teacher (phone)</Link></p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/display" element={<Display />} />
      <Route path="/speak" element={<Speak />} />
      <Route path='/speak-test' element={<Speaktest/>}/>
    </Routes>
  );
}