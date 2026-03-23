import React, { useEffect } from 'react';
import { useCart } from './CartContext';
import EditableMedia from './EditableMedia';
import EditableText from './EditableText';

const Section = ({ data }) => {
  const { addToCart } = useCart();
  const sectionOrder = data.section_order || [];

  // Meld aan de Dock welke secties we hebben
  useEffect(() => {
    if (window.athenaScan) {
      window.athenaScan(data);
    }
  }, [data, sectionOrder]);

  return (
    <div className="flex flex-col">
      {sectionOrder.map((sectionName, idx) => {
        const items = data[sectionName] || [];
        if (items.length === 0) return null;

        // 1. Hero Sectie
        if (sectionName === 'hero') {
          const hero = items[0];
          return (
            <section 
              key={idx} 
              data-dock-section="hero"
              className="relative h-[90vh] flex items-center justify-center overflow-hidden"
            >
              <div className="absolute inset-0 z-0">
                <EditableMedia 
                  src={hero.afbeelding} 
                  className="w-full h-full object-cover" 
                  cmsBind={{ file: 'hero', index: 0, key: 'afbeelding' }} 
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
              </div>
              <div className="relative z-10 text-center px-6 max-w-4xl">
                <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-8 drop-shadow-xl">
                  <EditableText value={hero.titel} cmsBind={{ file: 'hero', index: 0, key: 'titel' }} />
                </h1>
                <div className="h-1.5 w-24 bg-accent mx-auto mb-8"></div>
                {hero.button_tekst && (
                  <button 
                    onClick={() => document.getElementById('producten')?.scrollIntoView({behavior: 'smooth'})}
                    className="bg-white text-black px-10 py-4 rounded-full font-bold hover:bg-accent hover:text-white transition-all shadow-2xl"
                  >
                    <EditableText value={hero.button_tekst} cmsBind={{ file: 'hero', index: 0, key: 'button_tekst' }} />
                  </button>
                )}
              </div>
            </section>
          );
        }

        // 2. Producten Grid
        if (sectionName === 'producten') {
          return (
            <section 
              key={idx} 
              id="producten" 
              data-dock-section="producten"
              className="py-32 px-6 bg-background"
            >
              <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-5xl font-serif font-bold mb-4 text-[var(--color-heading)]">Onze Collectie</h2>
                <p className="text-xl italic opacity-60 mb-20">Handgemaakte meesterwerken</p>
                
                <div className="flex flex-wrap justify-center items-stretch gap-12">
                  {items.map((item, index) => {
                    const priceValue = parseFloat(String(item.prijs || 0).replace(',', '.'));
                    const imgSrc = item.product_foto_url || item.afbeelding || item.foto;
                    
                    return (
                      <article 
                        key={index} 
                        className="w-full md:w-[calc(45%)] lg:w-[calc(30%)] min-w-[300px] flex flex-col card group transition-all duration-500"
                        style={{ borderRadius: 'var(--radius-custom)', boxShadow: 'var(--shadow-main)' }}
                      >
                        <div className="relative aspect-square overflow-hidden mb-8 shadow-inner flex-shrink-0" style={{ borderRadius: 'calc(var(--radius-custom) * 0.8)' }}>
                          <EditableMedia 
                            src={imgSrc} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            cmsBind={{ file: 'producten', index, key: 'product_foto_url' }} 
                          />
                          <div className="absolute top-6 right-6 bg-accent text-white px-5 py-2 rounded-full font-bold text-lg shadow-lg">
                            €{priceValue.toFixed(2)}
                          </div>
                        </div>
                        <div className="flex-grow text-left flex flex-col px-4 pb-6">
                          <h3 className="text-2xl font-bold mb-3 text-[var(--color-heading)] min-h-[4rem] flex items-center">
                            <EditableText value={item.naam} cmsBind={{ file: 'producten', index, key: 'naam' }} />
                          </h3>
                          <p className="text-sm opacity-60 line-clamp-3 mb-6 leading-relaxed flex-grow">
                            <EditableText value={item.korte_beschrijving} cmsBind={{ file: 'producten', index, key: 'korte_beschrijving' }} />
                          </p>
                          <button 
                            onClick={() => addToCart({ id: item.product_id || index, title: item.naam, price: priceValue, image: imgSrc })}
                            className="bg-[var(--color-button-bg, #4a3728)] text-white w-full py-4 rounded-xl flex items-center justify-center gap-3 mt-auto hover:opacity-90 transition-all font-bold"
                          >
                            <i className="fa-solid fa-cart-shopping"></i> In winkelwagen
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        }

        // 3. Sterke Punten
        if (sectionName === 'sterke_punten') {
          return (
            <section 
              key={idx} 
              data-dock-section="sterke_punten"
              className="py-24 bg-[#1a365d] text-white"
            >
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6 border border-accent/20 text-accent">
                       <i className={`fa-solid ${item.icoon_naam || 'fa-star'} text-3xl`}></i>
                    </div>
                    <h4 className="text-xl font-bold mb-2">
                      <EditableText value={item.titel} cmsBind={{ file: 'sterke_punten', index, key: 'titel' }} />
                    </h4>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        return null;
      })}
    </div>
  );
};

export default Section;
