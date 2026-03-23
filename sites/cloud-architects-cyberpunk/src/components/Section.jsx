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
    <div className="flex flex-col bg-black">
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
        const sectionClasses = `relative py-24 px-6 border-b border-primary/10 ${settings.text_white ? 'text-white' : ''}`;

        // --- 1. HERO SECTION (NEO-TECH) ---
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
              className="relative w-full min-h-screen flex items-center justify-center pt-20 overflow-hidden"
              style={sectionStyle}
            >
              {/* Grid Background Effect */}
              <div className="absolute inset-0 opacity-20 pointer-events-none" 
                   style={{backgroundImage: 'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)', backgroundSize: '40px 40px'}}>
              </div>
              
              <div className="absolute inset-0 z-0">
                <EditableMedia
                  src={getImageUrl(img || "hero-cyberpunk.jpg")}
                  cmsBind={{ file: 'hero', index: 0, key: 'afbeelding' }}
                  className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
              </div>

              <div className="relative z-10 text-center max-w-6xl px-6">
                <div className="inline-block py-2 px-8 bg-black border-l-4 border-primary mb-12 animate-glitch shadow-[10px_0_0_rgba(188,0,255,0.3)]">
                  <span className="text-primary font-mono text-sm tracking-[0.5em] font-bold">
                    <EditableText bind="hero.0.boven_titel" value={hero.boven_titel} />
                  </span>
                </div>
                
                <h1 className="text-7xl md:text-9xl font-serif font-black text-white mb-10 leading-[0.9] uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(0,243,255,0.4)]">
                   <EditableText bind="hero.0.titel" value={title} />
                </h1>

                <div className="flex flex-col md:flex-row items-center justify-center gap-12 mt-16">
                  <p className="text-xl text-slate-300 max-w-xl text-center md:text-left font-mono border-r-2 border-primary/30 pr-8 italic leading-relaxed">
                    <EditableText bind="hero.0.ondertitel" value={subtitle} />
                  </p>
                  <button className="group relative px-12 py-6 bg-transparent border-2 border-primary text-primary font-black uppercase tracking-[0.3em] hover:bg-primary hover:text-black transition-all">
                    <span className="relative z-10">
                      <EditableText bind="hero.0.button_text" value={hero.button_text || 'Enter System'} />
                    </span>
                    <div className="absolute -top-2 -left-2 w-4 h-4 bg-primary group-hover:bg-secondary"></div>
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-secondary group-hover:bg-primary"></div>
                  </button>
                </div>
              </div>
            </section>
          );
        }

        // --- 2. EXPERTISE (SYSTEM_CAPACITIES) ---
        if (sectionName === 'expertise') {
          return (
            <section key={idx} id={sectionName} data-dock-section={sectionName} className={sectionClasses} style={sectionStyle}>
              <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-24 border-b-2 border-primary/20 pb-8">
                   <h2 className="text-5xl md:text-7xl font-serif font-black text-white uppercase italic tracking-tighter">
                     <span className="text-primary">Sys.</span>{sectionName}
                   </h2>
                   <span className="text-xs font-mono text-primary animate-pulse hidden md:block">STATUS: OPTIMIZED_LOAD // 00:03:12</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                  {items.map((item, index) => {
                    const title = resolveContent(item, 'title');
                    const text = resolveContent(item, 'text');
                    return (
                      <div 
                        key={index} 
                        className="group p-12 bg-black border border-primary/10 hover:border-primary transition-all relative overflow-hidden"
                        style={{ backgroundColor: settings.card_bg_color || undefined }}
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all">
                          <i className={`fa-solid ${item.icon ? (item.icon === 'zap' ? 'fa-bolt' : `fa-${item.icon}`) : 'fa-gear'} text-primary text-6xl`}></i>
                        </div>
                        
                        <div className="relative z-10 space-y-6">
                          <span className="text-xs font-mono text-secondary font-bold tracking-widest block">0X0{index+1}</span>
                          <h3 className="text-3xl font-black text-white leading-tight uppercase group-hover:text-primary transition-colors">
                            <EditableText bind={`${sectionName}.${index}.titel`} value={title} />
                          </h3>
                          <p className="text-slate-400 font-mono text-sm leading-relaxed border-l border-primary/20 pl-6 group-hover:border-primary transition-colors">
                            <EditableText bind={`${sectionName}.${index}.tekst`} value={text} />
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        }

        // --- 3. PROJECTS (VOID_RECORDS) ---
        if (sectionName === 'projects') {
          return (
            <section key={idx} id={sectionName} data-dock-section={sectionName} className={sectionClasses} style={sectionStyle}>
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-12 mb-24">
                   <h2 className="text-5xl md:text-7xl font-serif font-black text-white uppercase italic tracking-tighter shrink-0 border-r-8 border-primary pr-12">
                     {sectionName}
                   </h2>
                   <div className="h-0.5 flex-1 bg-gradient-to-r from-primary to-transparent opacity-30"></div>
                </div>

                <div className="space-y-48">
                  {items.map((item, index) => {
                    const title = resolveContent(item, 'title');
                    const text = resolveContent(item, 'text');
                    const img = resolveContent(item, 'image');
                    return (
                      <div key={index} className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-20 group`}>
                        <div className="w-full md:w-3/5 bg-black border-4 border-primary relative">
                          <div className="absolute -top-1 -left-1 px-4 py-1 bg-primary text-black font-black text-[10px] uppercase">Record_0{index}</div>
                          <EditableMedia
                            src={getImageUrl(img)}
                            cmsBind={{ file: sectionName, index: index, key: item.afbeelding ? 'afbeelding' : 'foto' }}
                            className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-700 brightness-75 group-hover:brightness-100"
                          />
                          <div className="absolute inset-0 border border-primary pointer-events-none -m-4 opacity-0 group-hover:opacity-100 transition-all"></div>
                        </div>
                        <div className="w-full md:w-2/5 space-y-10">
                          <h3 className="text-5xl font-black text-white leading-none uppercase tracking-tighter italic">
                            <EditableText bind={`${sectionName}.${index}.titel`} value={title} />
                          </h3>
                          <p className="text-xl text-slate-400 font-mono border-b border-primary/10 pb-10">
                            <EditableText bind={`${sectionName}.${index}.beschrijving`} value={text} />
                          </p>
                          <button className="flex items-center gap-6 text-primary font-black uppercase tracking-[0.4em] text-xs hover:text-secondary transition-colors group/btn">
                            [EXECUTE_READ]
                            <div className="w-12 h-12 border border-primary flex items-center justify-center group-hover/btn:bg-primary group-hover/btn:text-black transition-all">
                               <i className="fa-solid fa-code"></i>
                            </div>
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

        // Default Generic Section
        return (
          <section key={idx} id={sectionName} data-dock-section={sectionName} className={sectionClasses} style={sectionStyle}>
            <div className="max-w-4xl mx-auto border-2 border-primary/20 p-20 bg-black/50 backdrop-blur-sm">
              <h2 className="text-4xl font-black mb-12 uppercase italic text-primary tracking-tighter">{sectionName}</h2>
              <p className="text-slate-500 font-mono text-sm leading-relaxed border-l-4 border-secondary pl-8">SYSTEM_MSG: NO SPECIFIC RENDERER DETECTED FOR THIS SECTOR. OUTPUTTING RAW DATA FALLBACK.</p>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default Section;