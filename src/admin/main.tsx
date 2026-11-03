import '@fontsource/cormorant-garamond/400.css'
import '@fontsource-variable/manrope'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/base.css'
import '../styles/sections.css'
import './admin.css'
import { AdminApp } from './AdminApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
)
