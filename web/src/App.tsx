import { Link, Route, Routes } from 'react-router-dom';
import Display from './Display';
import Speak from './Speak';

function Home() {
  return (
    <div style={{ padding: 24 }}>
      <h1 className='text-6xl mb-4'>Live Captions</h1>
      <p className='text-blue-500 text-2xl'><Link to="/display">TV / computer (display)</Link></p>
      <p className='text-blue-500 text-2xl'><Link to="/speak">Teacher (phone)</Link></p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/display" element={<Display />} />
      <Route path="/speak" element={<Speak />} />
    </Routes>
  );
}