import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { clearChunkReloadAttempt } from './utils/lazyImport';
import './index.css';

clearChunkReloadAttempt();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
