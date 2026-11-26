import '@fontsource/cormorant-garamond/300.css'
import '@fontsource/cormorant-garamond/300-italic.css'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import '@fontsource-variable/manrope'
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Cursor } from '../components/Cursor'
import { Footer } from '../components/Footer'
import { Nav } from '../components/Nav'
import { initSmoothScroll } from '../lib/motion'
import '../styles/base.css'
import '../styles/sections.css'
import { Datenschutz } from './Datenschutz'
import { Impressum } from './Impressum'

function LegalPage() {
  useEffect(() => {
    initSmoothScroll()
  }, [])
  const page = document.body.dataset.page
  return (
    <>
      <Cursor />
      <Nav home={false} />
      <main className="legal">
        <div className="wrap">{page === 'impressum' ? <Impressum /> : <Datenschutz />}</div>
      </main>
      <Footer home={false} />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LegalPage />
  </StrictMode>,
)
