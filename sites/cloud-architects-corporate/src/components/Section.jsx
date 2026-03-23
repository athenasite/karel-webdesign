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

  const sectionOrder = data.section_order?.length > 0 ? data.section_order : ['hero', 'expertise', 'packages', 'projects'];
  const sectionSettings = data.section_settings || {};

  useEffect(() => {
    if (window.athenaScan) {
      window.athenaScan(data);
    }
  }, [data, sectionOrder]);

  return (
    <div className="flex flex-col">
      {sectionOrder.map((sectionName, idx) => {
        const items = data[sectionName] || [];
        const allSettings = data.section_settings || [];
        let settingIndex = -1;
        let settings = {};

        if (Array.isArray(allSettings)) {
          settingIndex = allSettings.findIndex(s => s.id === sectionName);
          settings = settingIndex !== -1 ? allSettings[settingIndex] : {};
        } else {
          settings = allSettings[sectionName] || {};
        }
        
        const sectionStyle = {
          backgroundColor: settings.bg_color || undefined
        };
        const sectionClasses = `relative py-24 px-6 ${settings.text_white ? 'text-white' : ''}`;

        // --- 1. HERO SECTION (PROFESSIONAL) ---
        if (sectionName === 'hero') {
          const hero = items[0] || data.basis?.[0] || {};
          const title = resolveContent(hero, 'title');
          const subtitle = resolveContent(hero, 'subtitle') || resolveContent(hero, 'text');
          const img = resolveContent(hero, 'image');

          return (
            <section
              key={idx}
              id="hero"
              data-dock-section="hero"
              className="relative w-full min-h-[80vh] flex items-center pt-24 overflow-hidden"
              style={sectionStyle}
            >
              <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-br from-white via-slate-50 to-white -z-10"></div>
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10 w-full">
                <div className="space-y-8 animate-reveal">
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-[var(--color-primary)]/10 rounded-full text-[var(--color-primary)] text-[10px] font-bold tracking-widest uppercase">
                    <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-pulse"></span>
                    <EditableText value={hero.boven_titel || 'Strategic Solutions'} cmsBind={{ file: 'hero', index: 0, key: 'boven_titel' }} />
                  </div>
                  <h1 className="text-5xl md:text-7xl font-sans font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                    <EditableText value={title || 'Excellence in Cloud Architecture'} cmsBind={{ file: 'hero', index: 0, key: 'titel' }} />
                  </h1>
                  <p className="text-xl text-slate-600 max-w-xl leading-relaxed font-light">
                    <EditableText value={subtitle} cmsBind={{ file: 'hero', index: 0, key: 'subtitel' }} />
                  </p>
                  <div className="flex flex-wrap gap-4 pt-4">
                    <button className="px-10 py-4 bg-[var(--color-primary)] text-white font-bold rounded-lg shadow-xl shadow-blue-900/10 hover:shadow-2xl transition-all">
                      <EditableText value={hero.button_text || hero.knop_tekst || 'Start Today'} cmsBind={{ file: 'hero', index: 0, key: 'knop_tekst' }} />
                    </button>
                    <button className="px-10 py-4 border-2 border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-all">
                      Learn More
                    </button>
                  </div>
                </div>
                <div className="relative group perspective-1000 hidden lg:block">
                  <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-[12px] border-white transition-transform duration-700 hover:scale-[1.02]">
                    <EditableMedia
                      src={getImageUrl(img || "hero-corporate.jpg")}
                      cmsBind={{ file: 'hero', index: 0, key: 'afbeelding' }}
                      className="w-full h-auto min-h-[400px] object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl -z-10"></div>
                </div>
              </div>
            </section>
          );
        }

        // --- 2. EXPERTISE (GRID) ---
        if (sectionName === 'expertise') {
          return (
            <section key={idx} id={sectionName} data-dock-section={sectionName} className={sectionClasses} style={sectionStyle}>
              <div className="max-w-7xl mx-auto">
                <div className="mb-20 text-center lg:text-left">
                   <h2 className="text-4xl md:text-5xl font-sans font-bold text-slate-900 mb-6">
                     <EditableText value={settings.title || 'Expertise'} cmsBind={{ file: 'section_settings', index: settingIndex, key: 'title' }} />
                   </h2>
                   <div className="w-20 h-1.5 bg-[var(--color-primary)] rounded-full mx-auto lg:mx-0"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {items.map((item, index) => {
                    const title = resolveContent(item, 'title');
                    const text = resolveContent(item, 'text');
                    return (
                      <div 
                        key={index} 
                        className="p-10 bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-[var(--color-primary)]/20 transition-all group"
                        style={{ backgroundColor: settings.card_bg_color || undefined, borderRadius: 'var(--radius-custom, 12px)' }}
                      >
                        <div className="w-16 h-16 bg-slate-50 flex items-center justify-center mb-8 text-[var(--color-primary)] text-3xl group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all rounded-xl">
                          <i className={`fa-solid ${item.icon ? (item.icon === 'zap' ? 'fa-bolt' : `fa-${item.icon}`) : 'fa-gear'}`}></i>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
                          <EditableText value={title} cmsBind={{ file: sectionName, index, key: 'titel' }} />
                        </h3>
                        <p className="text-slate-500 leading-relaxed">
                          <EditableText value={text} cmsBind={{ file: sectionName, index, key: 'tekst' }} />
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        }

        // --- 3. PROJECTS (CASE STUDIES) ---
        if (sectionName === 'projects') {
          return (
            <section key={idx} id={sectionName} data-dock-section={sectionName} className={sectionClasses} style={sectionStyle}>
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24">
                   <h2 className="text-4xl md:text-5xl font-sans font-bold text-slate-900 mb-6">
                     <EditableText value={settings.title || 'Innovative Results'} cmsBind={{ file: 'section_settings', index: settingIndex, key: 'title' }} />
                   </h2>
                   <div className="w-20 h-1.5 bg-[var(--color-primary)] rounded-full mx-auto mb-6"></div>
                   <p className="text-lg text-slate-500 max-w-2xl mx-auto font-light">
                     Optimizing infrastructure for global enterprises through strategic architecture.
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  {items.map((item, index) => {
                    const title = resolveContent(item, 'title');
                    const text = resolveContent(item, 'text');
                    const img = resolveContent(item, 'image');
                    return (
                      <div key={index} className="group relative overflow-hidden rounded-2xl bg-white shadow-lg flex flex-col border border-slate-100">
                        <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                          <EditableMedia
                            src={getImageUrl(img)}
                            cmsBind={{ file: sectionName, index: index, key: 'afbeelding' }}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-1000"
                          />
                        </div>
                        <div className="p-10 flex-1 flex flex-col">
                          <h3 className="text-2xl font-bold text-slate-900 mb-4">
                            <EditableText value={title} cmsBind={{ file: sectionName, index: index, key: 'titel' }} />
                          </h3>
                          <p className="text-slate-600 leading-relaxed font-light mb-8 flex-1">
                            <EditableText value={text} cmsBind={{ file: sectionName, index: index, key: 'beschrijving' }} />
                          </p>
                          <div className="pt-6 border-t border-slate-50">
                            <button className="text-[var(--color-primary)] font-bold text-sm tracking-widest uppercase flex items-center gap-2 hover:gap-4 transition-all">
                              View Case Study <i className="fa-solid fa-arrow-right"></i>
                            </button>
                          </div>
                        </div>
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
          <section key={idx} id={sectionName} data-dock-section={sectionName} className={`${sectionClasses} border-t border-slate-50`} style={sectionStyle}>
            <div className="max-w-4xl mx-auto p-16 bg-white shadow-xl shadow-slate-200/50 border border-slate-100 rounded-3xl text-center">
              <h2 className="text-3xl font-bold mb-4 text-slate-900 uppercase tracking-tight">
                <EditableText value={settings.title || sectionName} cmsBind={{ file: 'section_settings', index: settingIndex, key: 'title' }} />
              </h2>
              <div className="w-12 h-1 bg-[var(--color-primary)] mx-auto mb-8 rounded-full"></div>
              <p className="text-slate-400 font-medium italic">Discover or configure this enterprise data block via the Athena Dock.</p>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default Section;