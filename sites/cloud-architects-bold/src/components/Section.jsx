import React, { useState, useEffect } from 'react';
import EditableText from './EditableText';
import EditableMedia from './EditableMedia';

const Section = ({ data }) => {
  const getImageUrl = (url) => {
    if (!url) return '';
    if (typeof url === 'object') url = url.text || url.url || '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const base = import.meta.env.BASE_URL || '/';
    return (base + '/images/' + url).replace(new RegExp('/+', 'g'), '/');
  };

  const resolveContent = (item, type) => {
    if (!item) return '';
    switch (type) {
      case 'title': return item.titel || item.title || item.project_title || item.package_name || item.naam || '';
      case 'subtitle': return item.subtitel || item.subtitle || item.client_name || item.boven_titel || '';
      case 'text': return item.tekst || item.text || item.description || item.beschrijving || item.summary || item.result || '';
      case 'image': return item.afbeelding || item.image || item.image_url || item.foto || item.bg_image || '';
      default: return '';
    }
  };

  const sectionOrder = data.section_order?.length > 0 ? data.section_order : ['hero', 'expertise', 'packages', 'projects'];

  useEffect(() => {
    if (window.athenaScan) {
      window.athenaScan(data);
    }
  }, [data, sectionOrder]);

  return (
    <div className="flex flex-col">
      {sectionOrder.map((sectionName, idx) => {
        const items = data[sectionName] || [];
        if (items.length === 0 && sectionName !== 'hero') return null;

        // Geavanceerde Sectie-instellingen (v8.6+)
        const allSettings = data.section_settings || [];
        let settingIndex = -1;
        let settings = {};

        if (Array.isArray(allSettings)) {
          settingIndex = allSettings.findIndex(s => s.id === sectionName);
          settings = settingIndex !== -1 ? allSettings[settingIndex] : {};
        } else {
          settings = allSettings[sectionName] || {};
        }

        const sectionStyles = {
          backgroundColor: settings.bg_color || undefined,
          '--color-card-bg': settings.card_bg_color || undefined,
          paddingTop: settings.use_custom_padding ? `${settings.padding}px` : undefined,
          paddingBottom: settings.use_custom_padding ? `${settings.padding}px` : undefined,
        };

        const sectionClasses = `relative ${settings.text_white ? 'text-white' : 'text-[var(--color-text)]'}`;

        // --- 1. HERO SECTION ---
        if (sectionName === 'hero') {
          const hero = items[0] || data.basis?.[0] || {};
          const title = resolveContent(hero, 'title');
          const subtitle = resolveContent(hero, 'subtitle') || resolveContent(hero, 'text');
          const img = resolveContent(hero, 'image');

          return (
            <section
              key={idx}
              data-dock-section="hero"
              className={`${sectionClasses} min-h-[90vh] flex items-center justify-center overflow-hidden bg-black pt-24`}
              style={sectionStyles}
            >
              <div className="absolute inset-0 z-0">
                <EditableMedia 
                   src={getImageUrl(img)} 
                   className="w-full h-full object-cover opacity-60" 
                   cmsBind={{ file: 'hero', index: 0, key: 'afbeelding' }} 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
              </div>
              <div className="relative z-10 text-center px-6 max-w-6xl">
                <div className="inline-block px-4 py-1.5 bg-accent text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-12 animate-fade-in">
                   <EditableText value={resolveContent(hero, 'subtitle') || 'Future Proof'} cmsBind={{ file: 'hero', index: 0, key: 'boven_titel' }} />
                </div>
                <h1 className="text-6xl md:text-9xl font-serif font-black mb-12 leading-[0.9] tracking-tighter uppercase transition-all duration-700">
                  <EditableText value={title} cmsBind={{ file: 'hero', index: 0, key: 'titel' }} />
                </h1>
                <div className="flex flex-col items-center gap-12">
                  <p className="text-xl md:text-3xl max-w-3xl mx-auto leading-relaxed font-light italic opacity-90">
                    <EditableText value={subtitle} cmsBind={{ file: 'hero', index: 0, key: 'subtitel' }} />
                  </p>
                  <div className="flex flex-wrap justify-center gap-6">
                    <button className="bg-accent text-white px-10 py-5 rounded-full font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-transform shadow-2xl shadow-accent/40">
                       <EditableText value={hero.knop_tekst || 'Start Project'} cmsBind={{ file: 'hero', index: 0, key: 'knop_tekst' }} />
                    </button>
                    <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-full font-black uppercase tracking-[0.2em] text-xs hover:bg-white/20 transition-all">
                       Expertise
                    </button>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        // --- 2. PACKAGES SECTION ---
        if (sectionName === 'packages') {
          return (
            <section key={idx} id={sectionName} data-dock-section={sectionName} className={`${sectionClasses} py-32 px-6`} style={sectionStyles}>
               <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24">
                  <h2 className="text-5xl md:text-7xl font-serif font-black tracking-tighter uppercase mb-6">
                     <EditableText value={settings.title || 'Solutions'} cmsBind={{ file: 'section_settings', index: settingIndex, key: 'title' }} />
                  </h2>
                  <div className="h-2 w-24 bg-accent mx-auto"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {items.map((item, index) => {
                    const isPopular = item.popular === true || item.popular === 'true';
                    const title = resolveContent(item, 'title');
                    const subtitle = resolveContent(item, 'subtitle');
                    const price = item.prijs || item.price || '';

                    return (
                      <div key={index} className={`flex flex-col h-full p-12 rounded-none border-4 transition-all duration-500 hover:-translate-y-2 ${isPopular ? 'bg-secondary border-black text-black shadow-[12px_12px_0px_#000]' : 'bg-[var(--color-card-bg)] border-[var(--color-text)] shadow-[8px_8px_0px_var(--color-text)]'}`}>
                        <div className="mb-12">
                          <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">
                            <EditableText value={title} cmsBind={{ file: sectionName, index, key: 'titel' }} />
                          </h3>
                          <p className="text-sm font-bold uppercase tracking-widest opacity-60">
                            <EditableText value={subtitle} cmsBind={{ file: sectionName, index, key: 'subtitel' }} />
                          </p>
                        </div>
                        <div className="mb-12 flex items-baseline gap-2">
                           <span className="text-6xl font-black tracking-tighter">
                             <EditableText value={price} cmsBind={{ file: sectionName, index, key: 'prijs' }} />
                           </span>
                           <span className="text-xs font-black uppercase tracking-widest opacity-60">/{item.periode || 'mo'}</span>
                        </div>
                        <ul className="space-y-4 mb-12 flex-1">
                          {(item.vinkjes || '').split(';').map((vink, vIdx) => (
                            <li key={vIdx} className="flex items-start gap-4 text-sm font-bold">
                              <i className="fa-solid fa-bolt text-accent mt-1"></i>
                              <span>{vink}</span>
                            </li>
                          ))}
                        </ul>
                        <button className={`w-full py-5 font-black uppercase tracking-widest text-xs transition-all ${isPopular ? 'bg-black text-white hover:bg-black/90' : 'bg-accent text-white hover:bg-accent/90'}`}>
                           Get Started
                        </button>
                      </div>
                    );
                  })}
                </div>
               </div>
            </section>
          );
        }

        // --- 3. GENERIC GRID SECTION (Expertise, Projects) ---
        return (
          <section key={idx} id={sectionName} data-dock-section={sectionName} className={`${sectionClasses} py-32 px-6`} style={sectionStyles}>
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col items-center mb-24 text-center">
                <h2 className="text-5xl md:text-7xl font-serif font-black tracking-tighter uppercase mb-6">
                  <EditableText value={settings.title || sectionName} cmsBind={{ file: 'section_settings', index: settingIndex, key: 'title' }} />
                </h2>
                <div className="h-2 w-24 bg-accent"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
                {items.map((item, index) => {
                  const title = resolveContent(item, 'title');
                  const text = resolveContent(item, 'text');
                  const img = resolveContent(item, 'image');

                  return (
                    <div key={index} className="flex flex-col items-start p-0 rounded-none overflow-hidden group">
                      {img && (
                        <div className="w-full aspect-video overflow-hidden mb-10 border-4 border-black shadow-[8px_8px_0px_#000] rotate-1 group-hover:rotate-0 transition-transform duration-500">
                          <EditableMedia 
                             src={getImageUrl(img)} 
                             className="w-full h-full object-cover" 
                             cmsBind={{ file: sectionName, index, key: 'afbeelding' }} 
                          />
                        </div>
                      )}
                      <h3 className="text-3xl font-black uppercase tracking-tighter mb-6 group-hover:text-accent transition-colors">
                        <EditableText value={title} cmsBind={{ file: sectionName, index, key: 'titel' }} />
                      </h3>
                      <div className="text-lg leading-relaxed font-bold opacity-70">
                        <EditableText value={text} cmsBind={{ file: sectionName, index, key: 'tekst' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default Section;