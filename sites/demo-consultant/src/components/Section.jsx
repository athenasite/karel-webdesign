import React, { useState, useEffect } from 'react';


const Section = ({ data }) => {
        const getImageUrl = (url) => {
    if (!url) return '';
    if (typeof url === 'object') url = url.text || url.url || '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const base = import.meta.env.BASE_URL || '/';
    if (url.startsWith(base) && base !== '/') return url;
    const isRootPublic = url.startsWith('./') || url.endsWith('.svg') || url.endsWith('.ico') || url === 'site-logo.svg' || url === 'athena-icon.svg';
    const hasImagesPrefix = url.includes('/images/') || url.startsWith('images/');
    const pathPrefix = (isRootPublic || hasImagesPrefix) ? '' : 'images/';
    return (base + pathPrefix + url.replace('./', '')).replace(new RegExp('/+', 'g'), '/');
  };

  const sectionOrder = data.section_order || [];
  const layoutSettings = data.layout_settings || {};

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

  useEffect(() => {
    if (window.athenaScan) {
      window.athenaScan(data);
    }
  }, [data, sectionOrder]);

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col">
      {sectionOrder.filter(name => name !== 'site_settings').map((sectionName, idx) => {
        const items = data[sectionName] || [];
        if (items.length === 0) return null;

        const currentLayout = layoutSettings[sectionName] || 'list';

        if (sectionName === 'basisgegevens' || sectionName === 'hero') {
          const hero = items[0];
          const heroTitle = hero.title || hero.titel || hero.hero_header || hero.site_naam;
          const heroSubtitle = hero.subtitle || hero.ondertitel || hero.introductie;
          const titleKey = Object.keys(hero).find(k => /title|titel|naam|header|site_naam/i.test(k)) || 'title';
          const subtitleKey = Object.keys(hero).find(k => /subtitle|ondertitel|introductie/i.test(k)) || 'subtitle';
          const imgKey = Object.keys(hero).find(k => /foto|afbeelding|url|image|img/i.test(k)) || 'image';
          
          return (
            <section 
              key={idx} 
              id="hero" 
              data-dock-section={sectionName} 
              className="relative w-full h-auto min-h-[var(--hero-height,85vh)] max-h-[var(--hero-max-height,150vh)] aspect-[var(--hero-aspect-ratio,16/9)] flex items-center justify-center overflow-hidden bg-[var(--color-hero-bg)]"
            >
              <div className="absolute inset-0 z-0">
                <img src={getImageUrl(hero[imgKey])} className="w-full h-full object-cover object-top" data-dock-type="media" data-dock-bind={`${sectionName}.0.${imgKey}`} />
                <div className="absolute inset-0 z-20 pointer-events-none" style={{ 
                  backgroundImage: 'linear-gradient(to bottom, var(--hero-overlay-start, rgba(0,0,0,0.6)), var(--hero-overlay-end, rgba(0,0,0,0.6)))' 
                }}></div>
              </div>
              <div className="relative z-10 text-center px-6 max-w-5xl">
                <h1 className="text-5xl md:text-8xl font-serif font-bold text-white mb-8 leading-tight drop-shadow-2xl">
                  <span data-dock-type="text" data-dock-bind={`${sectionName}.0.${titleKey}`}>{heroTitle}</span>
                </h1>
                <div className="h-2 w-32 bg-accent mx-auto mb-10 rounded-full shadow-lg shadow-accent/50"></div>
                                    <div className="flex flex-col items-center gap-12">
                                    <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-lg font-light italic">
                                       <span data-dock-type="text" data-dock-bind={`${sectionName}.0.${subtitleKey}`}>{heroSubtitle}</span>
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        <button onClick={(e) => { 
                if (e.shiftKey) return; 
                const target = document.getElementById("contact");
                if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth" }); }
            }} data-dock-type="link" data-dock-bind="site_settings.0.titel">{}</button>
                                        
                                    </div>
                                </div>              </div>
            </section>
          );
        }

        if (sectionName.includes('product') || sectionName.includes('shop')) {
          return (
            <section key={idx} id={sectionName} data-dock-section={sectionName} className="py-24 px-6 bg-background">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl font-serif font-bold mb-16 text-center text-primary uppercase tracking-widest">{sectionName.replace(/_/g, ' ')}</h2>
                <div className="flex flex-wrap justify-center gap-12">
                  {items.map((item, index) => {
                    const priceValue = parseFloat(String(item.prijs || 0).replace(/[^0-9.,]/g, '').replace(',', '.'));
                    const titleKey = Object.keys(item).find(k => /naam|titel/i.test(k)) || 'naam';
                    const imgKey = Object.keys(item).find(k => /foto|afbeelding|url/i.test(k)) || 'product_foto_url';
                    return (
                      <article key={index} className="flex flex-col bg-surface rounded-[2.5rem] shadow-xl overflow-hidden transition-all hover:-translate-y-2 hover:shadow-2xl group border border-slate-100">
                        <div className="aspect-square overflow-hidden flex-shrink-0 relative">
                          <img src={getImageUrl(item[imgKey])} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-dock-type="media" data-dock-bind={`${sectionName}.${index}.${imgKey}`} />
                          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                        </div>
                        <div className="p-8 flex flex-col flex-grow text-center">
                          <h3 className="text-2xl font-bold mb-4 text-primary min-h-[4rem] flex items-center justify-center">
                            <span data-dock-type="text" data-dock-bind={`${sectionName}.${index}.${titleKey}`}>{item[titleKey]}</span>
                          </h3>
                          <div className="text-accent font-bold mt-auto text-3xl mb-6">€{priceValue.toFixed(2)}</div>
                          <div className="flex flex-col gap-3">
                            
                            
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        }

        if (sectionName === 'showcase' || sectionName === 'portfolio') {
          return (
            <section key={idx} id={sectionName} data-dock-section={sectionName} className="py-24 px-6 bg-[var(--color-surface)]">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col items-center mb-20 text-center">
                  <h2 className="text-5xl md:text-6xl font-serif font-bold text-primary mb-6 capitalize">
                    {sectionName.replace(/_/g, ' ')}
                  </h2>
                  <div className="h-2 w-24 bg-accent rounded-full mb-8"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  {items.map((item, index) => {
                    const titleKey = Object.keys(item).find(k => /name|naam|titel|project|header|title/i.test(k)) || 'name';
                    const textKey = Object.keys(item).find(k => /beschrijving|omschrijving|description|intro|text|summary/i.test(k)) || 'description';
                    const imgKey = Object.keys(item).find(k => /image|foto|afbeelding|url|img/i.test(k)) || 'image';
                    const linkUrl = item.link || item.link_url || "#";

                    return (
                      <div key={index} className="group relative flex flex-col rounded-[3rem] overflow-hidden bg-white shadow-2xl transition-all duration-500 hover:-translate-y-4 hover:shadow-accent/20">
                        {/* Media Container */}
                        <a 
                          href={linkUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="aspect-[16/10] overflow-hidden block relative"
                          onClick={(e) => { if (e.shiftKey) e.preventDefault(); }}
                        >
                          <img src={getImageUrl(item[imgKey])} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" data-dock-type="media" data-dock-bind={`${sectionName}.${index}.${imgKey}`} />
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                             <div className="bg-primary/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter shadow-xl">
                                Shift + Klik voor link
                             </div>
                          </div>
                        </a>

                        {/* Content Container */}
                        <div className="p-12 flex flex-col flex-grow">
                          <div className="flex justify-between items-start mb-4">
                             <h3 className="text-3xl font-bold text-primary group-hover:text-accent transition-colors">
                               <span data-dock-type="text" data-dock-bind={`${sectionName}.${index}.${titleKey}`}>{item[titleKey]}</span>
                             </h3>
                             {item.category && (
                               <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest" data-dock-type="text" data-dock-bind={`${sectionName}.${index}.category`}>{item.category}</span>
                             )}
                          </div>

                          <div className="text-lg leading-relaxed text-slate-600 mb-8 line-clamp-3 font-light italic">
                            <span data-dock-type="text" data-dock-bind={`${sectionName}.${index}.${textKey}`}>{item[textKey]}</span>
                          </div>

                          <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
                            <a href={"#"} data-dock-type="link" data-dock-bind="site_settings.0.titel">{}</a>
                            <div className="flex gap-3 text-slate-300">
                                <i className="fa-solid fa-laptop-code text-xl"></i>
                                <i className="fa-solid fa-magnifying-glass-chart text-xl"></i>
                            </div>
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

        if (sectionName === 'proces' || sectionName === 'stappen') {
          return (
            <section key={idx} id={sectionName} data-dock-section={sectionName} className="py-24 px-6 bg-[var(--color-background)] overflow-hidden">
              <div className="max-w-5xl mx-auto">
                <div className="flex flex-col items-center mb-20 text-center">
                  <h2 className="text-5xl font-serif font-bold text-primary mb-6 capitalize">
                    {sectionName.replace(/_/g, ' ')}
                  </h2>
                  <div className="h-1.5 w-20 bg-accent rounded-full"></div>
                </div>
                <div className="space-y-12">
                  {items.map((item, index) => {
                    const titleKey = Object.keys(item).find(k => /naam|titel|stap|header|title/i.test(k));
                    const textKey = Object.keys(item).find(k => /beschrijving|omschrijving|tekst|text|uitleg/i.test(k));
                    return (
                      <div key={index} className="flex gap-8 md:gap-16 items-start group">
                        <div className="flex-shrink-0 flex flex-col items-center">
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl md:text-3xl font-black shadow-xl shadow-primary/20 group-hover:bg-accent group-hover:scale-110 transition-all duration-500">
                            {index + 1}
                          </div>
                          {index < items.length - 1 && (
                            <div className="w-1 h-full min-h-[4rem] bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                          )}
                        </div>
                        <div className="flex-1 pt-4 md:pt-6">
                          {titleKey && (
                            <h3 className="text-2xl md:text-3xl font-bold text-primary mb-4 leading-tight">
                              <span data-dock-type="text" data-dock-bind={`${sectionName}.${index}.${titleKey}`}>{item[titleKey]}</span>
                            </h3>
                          )}
                          {textKey && (
                            <div className="text-xl leading-relaxed text-slate-600 font-light italic">
                              <span data-dock-type="text" data-dock-bind={`${sectionName}.${index}.${textKey}`}>{item[textKey]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        }

        return (
          <section key={idx} id={sectionName} data-dock-section={sectionName} className={'py-24 px-6 ' + (idx % 2 === 1 ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-background)]')}>
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col items-center mb-16 text-center">
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4 capitalize">
                  {sectionName.replace(/_/g, ' ')}
                </h2>
                <div className="h-1.5 w-24 bg-accent rounded-full"></div>
              </div>
              
              <div className={currentLayout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12' : 'space-y-20'}>
                {items.map((item, index) => {
                   const titleKey = Object.keys(item).find(k => /naam|titel|onderwerp|header|title/i.test(k));
                   const textKeys = Object.keys(item).filter(k => k !== titleKey && !/foto|afbeelding|url|image|img|link|id|icon/i.test(k));
                   const imgKey = Object.keys(item).find(k => /foto|afbeelding|url|image|img/i.test(k));
                   const isEven = index % 2 === 0;

                   if (currentLayout === 'grid') {
                    const iconClass = item.icon ? (iconMap[item.icon.toLowerCase()] || `fa-${item.icon.toLowerCase()}`) : null;
                    return (
                      <div key={index} className="flex flex-col items-center text-center bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300">
                        {iconClass && (
                          <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mb-8 text-accent text-4xl shadow-inner">
                            <i className={`fa-solid iconClass`}></i>
                          </div>
                        )}
                        {titleKey && (
                          <h3 className="text-2xl font-bold text-primary mb-4 leading-tight">
                            <span data-dock-type="text" data-dock-bind={`${sectionName}.${index}.${titleKey}`}>{item[titleKey]}</span>
                          </h3>
                        )}
                        {textKeys.map(tk => (
                          <div key={tk} className="text-slate-600 text-lg leading-relaxed">
                            <span data-dock-type="text" data-dock-bind={`${sectionName}.${index}.${tk}`}>{item[tk]}</span>
                          </div>
                        ))}
                      </div>
                    );
                   }

                   return (
                     <div key={index} className={`flex flex-col items-center text-center ${currentLayout === 'list' ? '' : (isEven ? 'md:flex-row' : 'md:flex-row-reverse')} gap-12 md:gap-20`}>
                       {imgKey && item[imgKey] && (
                         <div className="w-full md:w-1/2 aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl rotate-1 group hover:rotate-0 transition-transform duration-500 border-8 border-white">
                           <img src={getImageUrl(item[imgKey])} className="w-full h-full object-cover" data-dock-type="media" data-dock-bind={`${sectionName}.${index}.${imgKey}`} />
                         </div>
                       )}
                       <div className="flex-1">
                         {titleKey && (
                           <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
                               <h3 className="text-3xl font-serif font-bold text-primary leading-tight flex-1">
                                 <span data-dock-type="text" data-dock-bind={`${sectionName}.${index}.${titleKey}`}>{item[titleKey]}</span>
                               </h3>
                               
                           </div>
                         )}
                         {textKeys.map(tk => (
                           <div key={tk} className="text-xl leading-relaxed text-slate-600 mb-6 font-light">
                             <span data-dock-type="text" data-dock-bind={`${sectionName}.${index}.${tk}`}>{item[tk]}</span>
                           </div>
                         ))}
                         {(item.link || item.link_url) && (
                            <a href={"#"} data-dock-type="link" data-dock-bind="site_settings.0.titel">
                                {item.link || "Lees meer"} <i className="fa-solid fa-arrow-right text-sm ml-1"></i>
                            </a>
                         )}
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