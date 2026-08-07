import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ImproApp from './ImproApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ImproApp />
  </StrictMode>,
)
