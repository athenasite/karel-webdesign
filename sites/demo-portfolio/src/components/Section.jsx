import React, { useEffect } from 'react';
import EditableText from './EditableText';
import EditableMedia from './EditableMedia';
import EditableLink from './EditableLink';

const Section = ({ data }) => {
  const sectionOrder = data.section_order || [];

  useEffect(() => {
    if (window.athenaScan) {
      window.athenaScan(data);
    }
  }, [data, sectionOrder]);

  const resolveContent = (item) => {
    if (!item) return {};
    return {
      title: item.titel || item.naam || item.full_name || item.header || '',
      subtitle: item.tagline || item.ondertitel || item.categorie || item.professional_title || '',
      text: item.beschrijving || item.tekst || item.introductie || item.bio || '',
      image: item.avatar_url || item.hero_afbeelding || item.foto_url || item.image_url || '',
      cta: item.cta_text || item.button_text || 'Bekijk meer'
    };
  };

  return (
    <div className="flex flex-col">
      {sectionOrder.map((sectionName, idx) => {
        if (sectionName === 'site_settings' || sectionName === 'section_order') return null;
        const items = data[sectionName] || [];
        if (items.length === 0) return null;

        // Hero Special Handling
        if (sectionName === 'profile' || sectionName === 'hero') {
          const profile = items[0];
          const content = resolveContent(profile);
          
          return (
            <section key={idx} id="hero" data-dock-section={sectionName} className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-slate-900">
              <div className="absolute inset-0 z-0">
                <EditableMedia 
                  src={content.image} 
                  cmsBind={{ file: sectionName, index: 0, key: 'avatar_url' }}
                  className="w-full h-full object-cover opacity-60" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80"></div>
              </div>
              <div className="relative z-10 text-center px-6 max-w-5xl">
                <h1 className="text-5xl md:text-8xl font-serif font-black text-white mb-8 leading-tight drop-shadow-2xl">
                  <EditableText value={content.title} cmsBind={{ file: sectionName, index: 0, key: 'full_name' }} />
                </h1>
                <div className="h-2 w-32 bg-[var(--color-accent)] mx-auto mb-10 rounded-full"></div>
                <p className="text-xl md:text-3xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-12 font-light italic">
                   <EditableText value={content.subtitle} cmsBind={{ file: sectionName, index: 0, key: 'tagline' }} />
                </p>
                <div className="flex justify-center">
                    <EditableLink 
                        label={content.cta} 
                        url="#contact"
                        cmsBind={{ file: sectionName, index: 0, key: 'cta_text' }}
                        className="btn-primary"
                        onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    />
                </div>
              </div>
            </section>
          );
        }

        // Projects / Portfolio Grid
        if (sectionName === 'projects' || sectionName === 'portfolio') {
            return (
                <section key={idx} id={sectionName} data-dock-section={sectionName} className="py-32 px-6 bg-[var(--color-background)]">
                  <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl md:text-6xl font-serif font-black text-[var(--color-title)] mb-6 capitalize">{sectionName}</h2>
                        <div className="h-1.5 w-24 bg-[var(--color-accent)] mx-auto rounded-full"></div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-12">
                      {items.map((item, index) => {
                        const content = resolveContent(item);
                        return (
                          <article key={index} className="card group w-full md:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-2rem)] max-w-sm">
                            <div className="aspect-[4/3] overflow-hidden -m-6 mb-8 rounded-t-3xl relative">
                              <EditableMedia 
                                src={content.image} 
                                cmsBind={{ file: sectionName, index, key: 'image_url' }}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                              />
                            </div>
                            <div className="space-y-4">
                               <div className="badge">{content.subtitle}</div>
                               <h3 className="text-2xl font-bold text-[var(--color-heading)]">
                                 <EditableText value={content.title} cmsBind={{ file: sectionName, index, key: 'titel' }} />
                               </h3>
                               <p className="text-slate-500 line-clamp-3">
                                 <EditableText value={content.text} cmsBind={{ file: sectionName, index, key: 'beschrijving' }} />
                               </p>
                               <EditableLink 
                                    label="Bekijk Project" 
                                    url="#" 
                                    className="inline-flex items-center text-[var(--color-accent)] font-bold group/link"
                               />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </section>
            );
        }

        // Default Alternating Layout
        const isEven = idx % 2 === 0;
        return (
          <section key={idx} id={sectionName} data-dock-section={sectionName} className={`py-32 px-6 ${isEven ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-background)]'}`}>
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-24">
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-[var(--color-title)] mb-4 capitalize">
                  {sectionName.replace(/_/g, ' ')}
                </h2>
                <div className="h-1.5 w-20 bg-[var(--color-accent)] mx-auto rounded-full"></div>
              </div>
              
              <div className="space-y-32">
                {items.map((item, index) => {
                   const content = resolveContent(item);
                   const rowEven = index % 2 === 0;

                   return (
                     <div key={index} className={`flex flex-col ${rowEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-16 md:gap-24 items-center`}>
                       <div className="w-full md:w-1/2 aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl transition-transform hover:rotate-1 duration-500 border-4 border-white dark:border-slate-800">
                         <EditableMedia 
                            src={content.image} 
                            cmsBind={{ file: sectionName, index, key: 'image_url' }}
                            className="w-full h-full object-cover" 
                         />
                       </div>
                       <div className="flex-1 text-center md:text-left">
                          <div className="badge mb-6">{content.subtitle}</div>
                          <h3 className="text-3xl md:text-4xl font-serif font-bold text-[var(--color-heading)] mb-6 leading-tight">
                            <EditableText value={content.title} cmsBind={{ file: sectionName, index, key: 'titel' }} />
                          </h3>
                          <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-400 mb-10 font-light">
                            <EditableText value={content.text} cmsBind={{ file: sectionName, index, key: 'beschrijving' }} />
                          </p>
                          <EditableLink 
                            label={content.cta} 
                            url="#" 
                            className="btn-primary"
                          />
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