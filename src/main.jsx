import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import KinkDareApp from './KinkDareApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <KinkDareApp />
  </StrictMode>,
)
