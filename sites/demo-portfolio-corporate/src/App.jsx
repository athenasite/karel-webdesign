import StyleInjector from './components/StyleInjector';
import React, { useMemo } from 'react';
import { HashRouter as Router } from 'react-router-dom';

import Header from './components/Header';
import Section from './components/Section';
import Footer from './components/Footer';

import { DisplayConfigProvider } from './components/DisplayConfigContext';

const App = ({ data }) => {
  const [currentData, setCurrentData] = React.useState(data);
  const primaryTable = Object.keys(currentData)[0];

  React.useEffect(() => {
    const handleMessage = (e) => {
      if (e.data.type === 'DATA_UPDATE') {
        console.log("⚓ Athena v33 Sync:", e.data.payload);
        setCurrentData(prev => ({ ...prev, ...e.data.payload }));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  /* Old Design Engine Removed */

  const content = (
    <DisplayConfigProvider data={currentData}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] transition-colors duration-500">
          <StyleInjector siteSettings={currentData['site_settings']} />
          <Header siteSettings={currentData['site_settings']} navigationData={currentData['navigation']} />

          <main>
            <Section data={currentData} />
          </main>

          <Footer data={currentData} />
        </div>
      </Router>
    </DisplayConfigProvider>
  );

  return content;
};

export default App;