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
            <section key={idx} id="hero" data-dock-section={sectionName} className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-slate-900 border-b-8 border-[var(--color-accent)]">
              <div className="absolute inset-0 z-0">
                <EditableMedia 
                  src={content.image} 
                  cmsBind={{ file: sectionName, index: 0, key: 'avatar_url' }}
                  className="w-full h-full object-cover opacity-60" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent"></div>
              </div>
              <div className="relative z-10 text-left px-6 max-w-7xl w-full">
                <div className="max-w-3xl">
                    <h1 className="text-6xl md:text-8xl font-serif font-black text-white mb-8 leading-tight uppercase tracking-tighter">
                      <EditableText value={content.title} cmsBind={{ file: sectionName, index: 0, key: 'full_name' }} />
                    </h1>
                    <div className="flex items-center gap-6 mb-12">
                        <div className="h-0.5 flex-grow bg-white/30"></div>
                        <p className="text-xl md:text-2xl text-[var(--color-accent)] font-bold uppercase tracking-[0.3em]">
                           <EditableText value={content.subtitle} cmsBind={{ file: sectionName, index: 0, key: 'tagline' }} />
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <EditableLink 
                            label={content.cta} 
                            url="#contact"
                            cmsBind={{ file: sectionName, index: 0, key: 'cta_text' }}
                            className="bg-white text-slate-900 px-12 py-5 rounded-none font-black uppercase tracking-widest hover:bg-[var(--color-accent)] hover:text-white transition-all shadow-2xl"
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        />
                    </div>
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
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
                        <div>
                            <h2 className="text-5xl md:text-7xl font-serif font-black text-[var(--color-title)] uppercase tracking-tighter leading-none">{sectionName}</h2>
                            <div className="h-4 w-48 bg-[var(--color-accent)] mt-4"></div>
                        </div>
                        <p className="max-w-md text-slate-500 font-medium">Expertise en precisie in elk project dat we opleveren.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1 grid-flow-dense bg-slate-200 border border-slate-200">
                      {items.map((item, index) => {
                        const content = resolveContent(item);
                        return (
                          <article key={index} className="bg-white p-12 group transition-all hover:bg-slate-50 relative overflow-hidden w-full md:w-[calc(50%-0.25rem)] lg:w-[calc(33.333%-0.5rem)]">
                            <div className="absolute top-0 right-0 p-4 text-slate-100 text-6xl font-black">0{index + 1}</div>
                            <div className="relative z-10 space-y-6">
                               <div className="text-[var(--color-accent)] font-black uppercase tracking-widest text-xs">{content.subtitle}</div>
                               <h3 className="text-3xl font-serif font-black text-[var(--color-heading)] uppercase leading-none">
                                 <EditableText value={content.title} cmsBind={{ file: sectionName, index, key: 'titel' }} />
                               </h3>
                               <p className="text-slate-500 font-medium leading-relaxed">
                                 <EditableText value={content.text} cmsBind={{ file: sectionName, index, key: 'beschrijving' }} />
                               </p>
                               <EditableLink 
                                    label="Project Dossier" 
                                    url="#" 
                                    className="inline-flex items-center text-slate-900 font-black uppercase tracking-widest text-sm border-b-4 border-[var(--color-accent)] pb-1 hover:pr-4 transition-all"
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
          <section key={idx} id={sectionName} data-dock-section={sectionName} className={`py-40 px-6 ${isEven ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-background)]'}`}>
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="relative">
                        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[var(--color-accent)]/10 -z-10"></div>
                        <div className="aspect-[4/5] overflow-hidden shadow-[40px_40px_0px_0px_rgba(0,0,0,0.05)]">
                             <EditableMedia 
                                src={resolveContent(items[0]).image} 
                                cmsBind={{ file: sectionName, index: 0, key: 'image_url' }}
                                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
                             />
                        </div>
                    </div>
                </div>
                <div className="space-y-12">
                   <div className="inline-block px-6 py-2 bg-slate-900 text-white font-black uppercase tracking-widest text-xs">Architectuur</div>
                   <h2 className="text-5xl md:text-7xl font-serif font-black text-[var(--color-title)] uppercase tracking-tighter leading-[0.9]">
                      <EditableText value={sectionName.replace(/_/g, ' ')} cmsBind={{ file: 'section_order', index: idx, key: '0' }} />
                   </h2>
                   
                   <div className="space-y-16">
                    {items.map((item, index) => {
                       const content = resolveContent(item);
                       return (
                         <div key={index} className="space-y-6">
                            <h3 className="text-2xl font-bold text-[var(--color-heading)] uppercase tracking-tight">
                                <EditableText value={content.title} cmsBind={{ file: sectionName, index, key: 'titel' }} />
                            </h3>
                            <p className="text-xl leading-relaxed text-slate-500 font-medium">
                                <EditableText value={content.text} cmsBind={{ file: sectionName, index, key: 'beschrijving' }} />
                            </p>
                            <EditableLink label={content.cta} url="#" className="text-[var(--color-accent)] font-black uppercase tracking-widest text-sm hover:underline" />
                         </div>
                       );
                    })}
                   </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default Section;