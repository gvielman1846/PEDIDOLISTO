import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { getFirebaseApp } from '@pedido-listo/firebase'
import './index.css'
import App from './App.tsx'

getFirebaseApp()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
