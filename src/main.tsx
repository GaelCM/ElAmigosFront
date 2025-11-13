import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router'
import { rutas } from './rutas.tsx'
import { Toaster} from 'sonner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster richColors position='top-center' />
    <RouterProvider router={rutas}/>
  </StrictMode>,
)
