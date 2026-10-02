import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/libre-franklin'
import '@fontsource-variable/rokkitt'
import './styles/global.css'
import App from './App.tsx'

// We scroll to the board ourselves on load (see App) — don't restore old positions.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
