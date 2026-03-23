import React, { useEffect } from 'react';
import EditableText from './EditableText';
import EditableMedia from './EditableMedia';

const Section = ({ data }) => {
  const getImageUrl = (url) => {
    if (!url) return '';
    if (typeof url === 'object') url = url.text || url.url || '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const base = import.meta.env.BASE_URL || '/';
    return (base + '/images/' + url).replace(/\/+/g, '/');
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

  const iconMap = {
    'table': 'fa-table-columns',
    'zap': 'fa-bolt-lightning',
    'smartphone': 'fa-mobile-screen-button',
    'laptop': 'fa-laptop',
    'gear': 'fa-gear',
    'check': 'fa-circle-check',
    'star': 'fa-star',
    'globe': 'fa-globe',
    'users': 'fa-users',
    'rocket': 'fa-rocket'
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
              className={`${sectionClasses} min-h-[90vh] flex items-center justify-center overflow-hidden pt-24 bg-slate-900`}
              style={sectionStyles}
            >
              <div className="absolute inset-0 z-0 opacity-40">
                <EditableMedia
                   src={getImageUrl(img || "hero-glass.jpg")}
                   className="w-full h-full object-cover"
                   cmsBind={{ file: 'hero', index: 0, key: 'afbeelding' }}
                />
              </div>
              <div className="relative z-10 text-center px-6 max-w-4xl">
                <div className="glass p-12 rounded-3xl border border-white/20 backdrop-blur-2xl">
                  <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight text-white">
                    <EditableText value={title} cmsBind={{ file: 'hero', index: 0, key: 'titel' }} />
                  </h1>
                  <p className="text-xl md:text-2xl mb-12 text-white/80 leading-relaxed font-light">
                    <EditableText value={subtitle} cmsBind={{ file: 'hero', index: 0, key: 'subtitel' }} />
                  </p>
                  <div className="flex flex-wrap justify-center gap-6">
                    <button className="glass-button px-10 py-4 rounded-full font-bold text-white hover:bg-white/10 transition-all">
                       <EditableText value={hero.knop_tekst || 'Explore Now'} cmsBind={{ file: 'hero', index: 0, key: 'knop_tekst' }} />
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
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                     <EditableText value={settings.title || 'Solutions'} cmsBind={{ file: 'section_settings', index: settingIndex, key: 'title' }} />
                  </h2>
                  <div className="h-1.5 w-24 bg-white/20 mx-auto rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {items.map((item, index) => {
                    const isPopular = item.popular === true || item.popular === 'true';
                    const title = resolveContent(item, 'title');
                    const subtitle = resolveContent(item, 'subtitle');
                    const price = item.prijs || item.price || '';

                    return (
                      <div key={index} className={`flex flex-col h-full p-10 rounded-3xl border transition-all duration-300 ${isPopular ? 'glass-featured border-white/40' : 'glass border-white/10'}`}>
                        <div className="mb-10">
                          <h3 className="text-2xl font-bold mb-2">
                            <EditableText value={title} cmsBind={{ file: sectionName, index, key: 'titel' }} />
                          </h3>
                          <p className="text-sm font-medium opacity-60">
                            <EditableText value={subtitle} cmsBind={{ file: sectionName, index, key: 'subtitel' }} />
                          </p>
                        </div>
                        <div className="mb-10 flex items-baseline gap-1">
                           <span className="text-5xl font-bold">
                             <EditableText value={price} cmsBind={{ file: sectionName, index, key: 'prijs' }} />
                           </span>
                           <span className="text-sm opacity-60">/{item.periode || 'mo'}</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1">
                          {(item.vinkjes || '').split(';').map((vink, vIdx) => (
                            <li key={vIdx} className="flex items-start gap-3 text-sm opacity-80">
                              <i className="fa-solid fa-check text-blue-400 mt-1"></i>
                              <span>{vink}</span>
                            </li>
                          ))}
                        </ul>
                        <button className="w-full py-4 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 transition-all border border-white/10">
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

        // --- 3. PROJECTS / LIST SECTIONS ---
        if (sectionName === 'projects') {
          const sectionStyle = sectionStyles; // Renamed to avoid conflict with sectionStyles
          return (
            <section key={idx} id={sectionName} data-dock-section={sectionName} className={sectionClasses} style={sectionStyle}>
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col items-center mb-20 text-center">
                   <h2 className="text-4xl md:text-6xl font-serif font-bold text-primary mb-6 capitalize">
                     <EditableText value={settings.title || sectionName} cmsBind={{ file: 'section_settings', index: settingIndex, key: 'title' }} />
                   </h2>
                   <div className="w-24 h-1.5 bg-accent rounded-full opacity-50"></div>
                </div>

                <div className="space-y-32">
                  {items.map((item, index) => {
                    const title = resolveContent(item, 'title');
                    const text = resolveContent(item, 'text');
                    const img = resolveContent(item, 'image');
                    return (
                      <div key={index} className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-16 md:gap-24 group`}>
                        <div className="w-full md:w-1/2 aspect-[16/10] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white/50 backdrop-blur-md relative">
                          <EditableMedia
                            src={getImageUrl(img)}
                            cmsBind={{ file: sectionName, index: index, key: item.afbeelding ? 'afbeelding' : 'foto' }}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        </div>
                        <div className="w-full md:w-1/2 space-y-8">
                          <h3 className="text-4xl md:text-5xl font-serif font-bold text-primary leading-tight">
                            <EditableText bind={`${sectionName}.${index}.titel`} value={title} />
                          </h3>
                          <p className="text-xl text-slate-600 leading-relaxed font-light italic">
                            <EditableText bind={`${sectionName}.${index}.beschrijving`} value={text} />
                          </p>
                          <button className="flex items-center gap-4 text-primary font-bold tracking-widest uppercase text-sm group/btn">
                            View Case Study
                            <span className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-md border border-white/40 flex items-center justify-center group-hover/btn:translate-x-2 transition-transform shadow-sm">
                              <i className="fa-solid fa-arrow-right"></i>
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        }

        // --- 4. GENERIC GRID SECTION (e.g., Expertise) ---
        // This section handles 'expertise' and other sections that might use a grid layout.
        // It replaces the previous 'Default Generic Section' and the 'expertise' specific block.
        if (sectionName === 'expertise') { // Explicitly handle expertise here, or make it truly generic
          const sectionStyle = sectionStyles; // Renamed to avoid conflict with sectionStyles
          return (
            <section key={idx} id={sectionName} data-dock-section={sectionName} className={`${sectionClasses} py-32 px-6`} style={sectionStyle}>
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col items-center mb-20 text-center">
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                    <EditableText value={settings.title || sectionName} cmsBind={{ file: 'section_settings', index: settingIndex, key: 'title' }} />
                  </h2>
                  <div className="h-1.5 w-24 bg-white/20 rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {items.map((item, index) => {
                    const title = resolveContent(item, 'title');
                    const text = resolveContent(item, 'text');
                    const img = resolveContent(item, 'image'); // For image-based cards
                    const icon = item.icon || 'star'; // Assuming icon is a direct property

                    return (
                      <div key={index} className="flex flex-col items-start glass p-8 rounded-3xl border border-white/10 group hover:border-white/30 transition-all">
                        {img ? (
                          <div className="w-full aspect-video overflow-hidden mb-8 rounded-2xl relative">
                            <EditableMedia
                               src={getImageUrl(img)}
                               className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                               cmsBind={{ file: sectionName, index, key: 'afbeelding' }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-8 text-3xl text-blue-400">
                            <i className={`fa-solid ${iconMap[icon.toLowerCase()] || 'fa-star'}`}></i>
                          </div>
                        )}
                        <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-400 transition-colors">
                          <EditableText value={title} cmsBind={{ file: sectionName, index, key: 'titel' }} />
                        </h3>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        }

        // Default Generic Section
        return (
          <section key={idx} id={sectionName} data-dock-section={sectionName} className={sectionClasses} style={sectionStyles}>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8 capitalize">{sectionName}</h2>
              <div className="p-12 rounded-[2.5rem] bg-white/30 backdrop-blur-lg border border-white/40 shadow-lg">
                <p className="text-slate-500 italic">No specific layout for this section.</p>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default Section;