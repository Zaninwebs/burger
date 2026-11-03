import '@fontsource/cormorant-garamond/300.css'
import '@fontsource/cormorant-garamond/300-italic.css'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource-variable/manrope'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/base.css'
import './styles/sections.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
