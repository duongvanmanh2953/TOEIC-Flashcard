import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const staleChunkReloadKey = 'vocabflow_stale_chunk_reload_at';
window.addEventListener('vite:preloadError', (event) => {
  const lastReloadAt = Number(sessionStorage.getItem(staleChunkReloadKey) || 0);
  if (Date.now() - lastReloadAt < 10_000) return;

  event.preventDefault();
  sessionStorage.setItem(staleChunkReloadKey, String(Date.now()));
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
