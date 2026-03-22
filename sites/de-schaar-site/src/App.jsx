import { HashRouter as Router } from 'react-router-dom';
import { DisplayConfigProvider } from './components/DisplayConfigContext';
import React, { useMemo, useState, useEffect } from 'react';
import Header from './components/Header';
import Section from './components/Section';
import Footer from './components/Footer';
import StyleInjector from './components/StyleInjector';
import Hero from './components/Hero';

const App = ({ data: initialData }) => {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const handleMessage = (event) => {
      const { type, file, index, key, value, config, section } = event.data;

      if (type === 'DOCK_REQUEST_SYNC') {
        const sourceFile = file || 'site_settings';
        const sourceData = data[sourceFile];
        const row = Array.isArray(sourceData) ? sourceData[index || 0] : sourceData;
        
        window.parent.postMessage({
          type: 'SITE_SYNC_RESPONSE',
          key,
          value: row ? row[key] : null,
          fullRow: row
        }, '*');
      }

      if (type === 'DOCK_UPDATE_TEXT' || type === 'DOCK_UPDATE_COLOR') {
        setData(prev => {
          const newData = { ...prev };
          const targetFile = file || (key.startsWith('header_') ? 'header_settings' : 'site_settings');
          
          if (!newData[targetFile]) {
            newData[targetFile] = (index !== undefined) ? [] : {};
          }

          if (Array.isArray(newData[targetFile])) {
            newData[targetFile] = [...newData[targetFile]];
            newData[targetFile][index || 0] = { ...newData[targetFile][index || 0], [key]: value };
          } else {
            newData[targetFile] = { ...newData[targetFile], [key]: value };
          }
          return newData;
        });
      }

      if (type === 'DOCK_UPDATE_SECTION_CONFIG') {
        setData(prev => {
          const newData = { ...prev };
          newData.display_config = {
            ...newData.display_config,
            sections: {
              ...(newData.display_config?.sections || {}),
              [file]: config
            }
          };
          return newData;
        });
      }

      if (type === 'DOCK_UPDATE_SECTION_VISIBILITY') {
          setData(prev => {
              const newData = { ...prev };
              const settings = [...(newData.section_settings || [])];
              const target = section || file;
              const idx = settings.findIndex(s => s.id === target);
              if (idx !== -1) {
                  settings[idx] = { ...settings[idx], visible: value };
                  newData.section_settings = settings;
              }
              return newData;
          });
      }

      if (type === 'DOCK_UPDATE_SECTION_PADDING') {
          setData(prev => {
              const newData = { ...prev };
              const settings = [...(newData.section_settings || [])];
              const target = section || file;
              const idx = settings.findIndex(s => s.id === target);
              if (idx !== -1) {
                  settings[idx] = { ...settings[idx], padding: value };
                  newData.section_settings = settings;
              }
              return newData;
          });
      }

      if (type === 'DOCK_UPDATE_SECTION_DATA') {
          setData(prev => {
             const newData = { ...prev };
             const settings = [...(newData.section_settings || [])];
             const idx = settings.findIndex(s => s.id === section);
             if (idx !== -1) {
                 settings[idx] = { ...settings[idx], [key]: value };
                 newData.section_settings = settings;
             }
             return newData;
          });
      }

      if (type === 'DOCK_UPDATE_LAYOUT') {
          setData(prev => {
             const newData = { ...prev };
             const target = section || file;
             
             if (Array.isArray(newData.layout_settings)) {
                 const settings = [...newData.layout_settings];
                 settings[0] = { ...settings[0], [target]: value };
                 newData.layout_settings = settings;
             } else {
                 newData.layout_settings = { ...(newData.layout_settings || {}), [target]: value };
             }
             return newData;
          });
      }

      if (type === 'DOCK_UPDATE_SECTION_ORDER') {
          setData(prev => {
              const newData = { ...prev };
              newData.section_order = value;
              return newData;
          });
      }

      if (type === 'DOCK_UPDATE_DATA') {
          setData(prev => ({
              ...prev,
              [file]: value
          }));
      }

      if (type === 'DOCK_FORCE_REFRESH') {
          console.log("⚓ Athena Dock triggered Hard Refresh...");
          window.location.reload();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [data]);

  useEffect(() => {
    if (window.athenaScan) {
      window.athenaScan(data);
    }
  }, [data]);

  const primaryTable = data['footer'] || [];
  
  return (
    <DisplayConfigProvider data={data}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] transition-colors duration-500">
          <StyleInjector data={data} />
          
          <Header 
            primaryTable={primaryTable} 
            tableName="footer" 
            hero={data['hero']} 
            siteSettings={data['site_settings']}
            headerSettings={data['header_settings']}
            headerData={data['header']}
            navData={data['navbar']}
          />
          
          <Hero data={data['hero']} />
          
          <main>
            <Section data={data} />
          </main>

          <Footer 
            primaryTable={data['footer']} 
            socialData={data['social_media']}
            openingData={data['openingsuren']}
            locationData={data['locatie']}
          />
        </div>
      </Router>
    </DisplayConfigProvider>
  );
};

export default App;
