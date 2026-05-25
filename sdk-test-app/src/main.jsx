import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import ErrorLens from "errorlens-sdk";

ErrorLens.init({
  apiKey: "10057565a4a327781b023bcaf9b73328fbb1d6f3c043695c"
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)