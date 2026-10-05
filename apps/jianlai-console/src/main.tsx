import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouterProvider } from '@/router'
import { AuthProvider } from '@/data/auth'
import { DataProvider } from '@/data/store'
import '@/index.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root not found')

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <DataProvider>
        <AppRouterProvider />
      </DataProvider>
    </AuthProvider>
  </StrictMode>,
)
