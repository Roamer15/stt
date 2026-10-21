import { io } from 'socket.io-client';

// Uses whatever host the page was opened from, so it works on localhost and on your LAN IP
export const socket = io(`http://${window.location.hostname}:3000`, { autoConnect: false });