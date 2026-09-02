import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/exo-2'
import '@fontsource-variable/noto-sans-jp'
import '@fontsource-variable/noto-sans-sc'
import '@fontsource-variable/noto-sans-tc'
import '@fontsource-variable/syne'
import { App } from './app/App'
import './app/styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
