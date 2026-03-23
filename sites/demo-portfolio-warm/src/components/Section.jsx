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
      cta: item.cta_text || item.button_text || 'Stuur een bericht'
    };
  };

  return (
    <div className="flex flex-col">
      {sectionOrder.map((sectionName, idx) => {
        if (sectionName === 'site_settings' || sectionName === 'section_order') return null;
        const items = data[sectionName] || [];
        if (items.length === 0) return null;

        // Hero Special Handling - Warm Variant (Rounded & Organic)
        if (sectionName === 'profile' || sectionName === 'hero') {
          const profile = items[0];
          const content = resolveContent(profile);
          
          return (
            <section key={idx} id="hero" data-dock-section={sectionName} className="relative w-full min-h-[90vh] flex items-center justify-center p-6 md:p-12 overflow-hidden bg-orange-50/30">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-accent/5 rounded-l-[10rem] -z-10 translate-x-24 rotate-3"></div>
              
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1 space-y-10">
                    <div className="flex items-center gap-4 text-accent font-bold tracking-widest uppercase text-sm">
                        <div className="w-12 h-1 bg-accent rounded-full"></div>
                        <EditableText value={content.subtitle} cmsBind={{ file: sectionName, index: 0, key: 'tagline' }} />
                    </div>
                    <h1 className="text-5xl md:text-8xl font-serif font-black text-slate-900 leading-[1.1]">
                      <EditableText value={content.title} cmsBind={{ file: sectionName, index: 0, key: 'full_name' }} />
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-600 max-w-xl leading-relaxed font-medium">
                       <EditableText value={content.text} cmsBind={{ file: sectionName, index: 0, key: 'bio' }} />
                    </p>
                    <div className="flex gap-4 items-center">
                        <EditableLink 
                            label={content.cta} 
                            url="#contact"
                            cmsBind={{ file: sectionName, index: 0, key: 'cta_text' }}
                            className="bg-accent text-white px-10 py-5 rounded-3xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        />
                        <div className="flex -space-x-3 ml-4">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?u=${i+10}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                            <div className="pl-4 text-sm font-bold text-slate-400 self-center">+150 tevreden cliënten</div>
                        </div>
                    </div>
                </div>
                <div className="order-1 lg:order-2">
                    <div className="relative">
                        <div className="absolute inset-0 bg-accent rounded-[4rem] rotate-6 -z-10 opacity-10"></div>
                        <div className="aspect-square rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white">
                             <EditableMedia 
                                src={content.image} 
                                cmsBind={{ file: sectionName, index: 0, key: 'avatar_url' }}
                                className="w-full h-full object-cover" 
                             />
                        </div>
                        <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-3xl shadow-xl flex items-center gap-6 border border-orange-50">
                            <i className="fa-solid fa-star text-4xl text-yellow-400"></i>
                            <div>
                                <div className="text-2xl font-black text-slate-900 leading-none">5.0</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Global Rating</div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </section>
          );
        }

        // Projects / Portfolio Grid - Warm Variant (Soft Cards)
        if (sectionName === 'projects' || sectionName === 'portfolio') {
            return (
                <section key={idx} id={sectionName} data-dock-section={sectionName} className="py-32 px-6 bg-white">
                  <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-24">
                        <h2 className="text-4xl md:text-6xl font-serif font-black text-slate-900 mb-6 capitalize">{sectionName}</h2>
                        <p className="text-slate-500 text-xl font-medium">Gefocust op menselijke connectie en resultaatgerichte oplossingen.</p>
                        <div className="h-2 w-16 bg-accent mx-auto mt-8 rounded-full"></div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-12">
                      {items.map((item, index) => {
                        const content = resolveContent(item);
                        return (
                          <article key={index} className="bg-orange-50/50 p-10 rounded-[3rem] group hover:bg-white hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-orange-100 flex flex-col xl:flex-row gap-10 items-center w-full max-w-3xl">
                            <div className="w-48 h-48 rounded-[2rem] overflow-hidden flex-shrink-0 relative">
                              <EditableMedia 
                                src={content.image} 
                                cmsBind={{ file: sectionName, index, key: 'image_url' }}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                              />
                            </div>
                            <div className="space-y-4">
                               <div className="text-accent font-bold tracking-widest uppercase text-xs">{content.subtitle}</div>
                               <h3 className="text-3xl font-serif font-black text-slate-900 leading-tight">
                                 <EditableText value={content.title} cmsBind={{ file: sectionName, index, key: 'titel' }} />
                               </h3>
                               <p className="text-slate-500 line-clamp-2">
                                 <EditableText value={content.text} cmsBind={{ file: sectionName, index, key: 'beschrijving' }} />
                               </p>
                               <EditableLink 
                                    label="Bekijk Case Study" 
                                    url="#" 
                                    className="font-black text-slate-900 flex items-center gap-2 group/btn"
                               >
                                    <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                        <i className="fa-solid fa-arrow-right text-xs"></i>
                                    </div>
                               </EditableLink>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </section>
            );
        }

        // Default Alternating Layout - Warm Pattern
        const isEven = idx % 2 === 0;
        return (
          <section key={idx} id={sectionName} data-dock-section={sectionName} className={`py-40 px-6 ${isEven ? 'bg-orange-50/20' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto">
              {items.map((item, index) => {
                 const content = resolveContent(item);
                 const rowEven = index % 2 === 0;

                 return (
                   <div key={index} className="mb-40 last:mb-0">
                     <div className={`flex flex-col ${rowEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-24 items-center`}>
                       <div className="w-full md:w-1/2 relative">
                         <div className="absolute -inset-4 bg-accent/5 rounded-[4rem] -rotate-3 -z-10"></div>
                         <div className="aspect-[4/3] rounded-[4rem] overflow-hidden shadow-2xl border-4 border-white">
                           <EditableMedia 
                              src={content.image} 
                              cmsBind={{ file: sectionName, index, key: 'image_url' }}
                              className="w-full h-full object-cover" 
                           />
                         </div>
                       </div>
                       <div className="flex-1 text-center md:text-left space-y-10">
                          <div>
                              <div className="text-accent font-black tracking-[0.2em] uppercase text-xs mb-4">{content.subtitle}</div>
                              <h3 className="text-4xl md:text-6xl font-serif font-black text-slate-900 leading-[0.9]">
                                <EditableText value={content.title} cmsBind={{ file: sectionName, index, key: 'titel' }} />
                              </h3>
                          </div>
                          <p className="text-xl leading-relaxed text-slate-500 font-medium">
                            <EditableText value={content.text} cmsBind={{ file: sectionName, index, key: 'beschrijving' }} />
                          </p>
                          <EditableLink 
                            label={content.cta} 
                            url="#" 
                            className="inline-block px-12 py-5 bg-slate-900 text-white rounded-full font-black text-sm uppercase tracking-widest hover:bg-accent transition-all shadow-xl"
                          />
                       </div>
                     </div>
                   </div>
                 );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default Section;