import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './dock-connector.js';

async function init() {
  const data = {};
  // Dummy data loading logic for local development
  try {
    
    const dataModules = import.meta.glob('./data/*.json', { eager: true });
    Object.keys(dataModules).forEach(filePath => {
        const fileName = filePath.split('/').pop().replace('.json', '');
        const fileData = dataModules[filePath].default;
        data[fileName] = Array.isArray(fileData) ? fileData : fileData;
    });
    
    // Ensure section_order and site_settings are present
    if (!data.section_order) data.section_order = [];
    if (!data.site_settings) data.site_settings = {};
    if (window.athenaScan) window.athenaScan(data);
  } catch (e) {
    console.error("Data laad fout:", e);
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App data={data} />
    </React.StrictMode>
  );
}

init();
