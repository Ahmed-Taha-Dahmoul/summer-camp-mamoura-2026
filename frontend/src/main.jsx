import React from 'react'
import ReactDOM from 'react-dom/client'
import './axiosSetup.js' // Global axios 401 interceptor — must be before App
import App from './App.jsx'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
