import React, { useState, useCallback, useEffect, useRef } from 'react';

/**
 * DesignControls for Athena Dock (v8.5 - OLD SCHOOL EDITION)
 * Single sidebar with accordions and action buttons.
 */
export default function DesignControls({ 
  onColorChange, 
  siteStructure, 
  onOpenSectionManager,
  currentPath,
  pages,
  onNavigate,
  isSectionManagerOpen
}) {
  const lastInteractionTime = useRef(0);
  const [localData, setLocalData] = useState({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('header'); // Default open section

  const hydrateData = useCallback((sourceName, rawData) => {
    if (!rawData) return;
    
    const flat = {
      ...(rawData.site_settings || {}),
      ...(Array.isArray(rawData.site_settings) ? rawData.site_settings[0] : {}),
      ...(rawData.style_config || {}),
      ...(Array.isArray(rawData.style_config) ? rawData.style_config[0] : {}),
      ...(rawData.header_settings || {}),
      ...(Array.isArray(rawData.header_settings) ? rawData.header_settings[0] : {}),
      ...(rawData.hero || {}),
      ...(Array.isArray(rawData.hero) ? rawData.hero[0] : {})
    };

    if (Object.keys(flat).length > 5) {
        setLocalData(prev => ({ ...prev, ...flat }));
        setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    const handleSiteMessage = (event) => {
      if (event.data?.type === 'SITE_READY' || event.data?.type === 'SITE_SYNC_RESPONSE') {
        const payload = event.data.structure || { data: event.data.fullRow ? { style_config: event.data.fullRow } : null };
        if (payload.data) hydrateData('Live Site Scan', payload.data);
      }
    };
    window.addEventListener('message', handleSiteMessage);
    return () => window.removeEventListener('message', handleSiteMessage);
  }, [hydrateData]);

  useEffect(() => {
    if (siteStructure?.data && (Date.now() - lastInteractionTime.current > 3000)) {
        hydrateData('Dock API', siteStructure.data);
    }
  }, [siteStructure, hydrateData]);

  const handlePreview = (key, value) => {
    lastInteractionTime.current = Date.now();
    setLocalData(prev => ({ ...prev, [key]: value }));
    onColorChange(key, value, false);
  };

  const handleSave = (key, value) => {
    lastInteractionTime.current = Date.now();
    setLocalData(prev => ({ ...prev, [key]: value }));
    onColorChange(key, value, true);
  };

  const toggleAccordion = (id) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 text-slate-800 font-sans border-r border-slate-300">
      
      {/* 🛠️ Action Buttons Section */}
      <div className="p-4 space-y-2 border-b border-slate-300 bg-white">
        <button 
          onClick={onOpenSectionManager}
          className={`w-full py-3 font-bold rounded shadow-sm flex items-center justify-center gap-2 transition-all uppercase text-xs tracking-wider ${
            isSectionManagerOpen 
            ? 'bg-blue-50 text-blue-600 border border-blue-200' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <i className={`fa-solid ${isSectionManagerOpen ? 'fa-chevron-left' : 'fa-layer-group'}`}></i> 
          {isSectionManagerOpen ? 'Close Tools' : 'Manage Sections'}
        </button>
        
        {/* Style Dropdown - Old School Style */}
        <div className="relative">
          <select
            onChange={(e) => {
                const rawUrl = siteStructure?.url || window.location.origin;
                const siteName = rawUrl.split('/')[3] || 'dock-test-site';
                const baseUrl = rawUrl.split('/' + siteName)[0];
                const url = `${baseUrl}/${siteName}/__athena/update-json`;
                fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'swap-style', value: e.target.value }) })
                .then(() => window.location.reload());
            }}
            className="w-full text-[11px] p-2 bg-slate-50 border border-slate-300 rounded font-bold text-slate-700 focus:outline-none appearance-none cursor-pointer"
            defaultValue=""
          >
            <option value="" disabled>CHOOSE GLOBAL STYLE...</option>
            {['modern.css', 'classic.css', 'modern-dark.css', 'bold.css', 'corporate.css', 'warm.css'].map(style => (
              <option key={style} value={style}>{style.replace('.css', '').toUpperCase()}</option>
            ))}
          </select>
          <div className="absolute right-2 top-2.5 pointer-events-none text-slate-400">
            <i className="fa-solid fa-chevron-down text-[10px]"></i>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        
        {/* 📄 Pages Accordion */}
        {pages.length > 0 && (
          <Accordion 
            id="pages" 
            title="Sitemap / Pages" 
            icon="fa-file-lines" 
            isOpen={openAccordion === 'pages'} 
            onToggle={toggleAccordion}
          >
            <div className="space-y-1">
              {pages.map(page => {
                const path = page.path === '/home' ? '/' : page.path;
                const isActive = currentPath === path;
                return (
                  <button
                    key={page.path}
                    onClick={() => onNavigate(path)}
                    className={`w-full text-left px-3 py-2 border rounded text-[11px] transition-all flex items-center justify-between ${isActive
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                  >
                    <span className="truncate capitalize">{page.title}</span>
                    {isActive && <i className="fa-solid fa-check text-blue-500"></i>}
                  </button>
                );
              })}
            </div>
          </Accordion>
        )}

        {/* 🔝 Header Settings Accordion */}
        <Accordion 
          id="header" 
          title="Header & Navigation" 
          icon="fa-window-maximize" 
          isOpen={openAccordion === 'header'} 
          onToggle={toggleAccordion}
        >
          <div className="space-y-4">
            <Toggle label="Header Visible" settingsKey="header_visible" value={localData.header_visible} onPreview={handlePreview} onSave={handleSave} />
            <Slider label="Header Height" value={parseInt(localData.header_height || 80)} min={40} max={250} unit="px" onChange={(v) => { handlePreview('header_height', v); handleSave('header_height', v); }} />
            <Slider label="Transparency" value={Math.round((parseFloat(localData.header_transparantie) || 0) * 100)} min={0} max={100} unit="%" onChange={(v) => { handlePreview('header_transparantie', v/100); handleSave('header_transparantie', v/100); }} />
            <Slider label="Content Offset" value={parseInt(localData.content_top_offset || 0)} min={0} max={200} unit="px" onChange={(v) => { handlePreview('content_top_offset', v); handleSave('content_top_offset', v); }} />
            
            <div className="pt-2 grid grid-cols-1 gap-2 border-t border-slate-200 mt-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Show/Hide Elements</p>
              <div className="grid grid-cols-2 gap-2">
                <ToggleMini label="Logo" settingsKey="header_show_logo" value={localData.header_show_logo} onPreview={handlePreview} onSave={handleSave} />
                <ToggleMini label="Title" settingsKey="header_show_title" value={localData.header_show_title} onPreview={handlePreview} onSave={handleSave} />
                <ToggleMini label="Subtitle" settingsKey="header_show_tagline" value={localData.header_show_tagline} onPreview={handlePreview} onSave={handleSave} />
                <ToggleMini label="CTA" settingsKey="header_show_button" value={localData.header_show_button} onPreview={handlePreview} onSave={handleSave} />
                <ToggleMini label="Nav" settingsKey="header_show_nav" value={localData.header_show_nav} onPreview={handlePreview} onSave={handleSave} />
              </div>
            </div>
          </div>
        </Accordion>

        {/* 🎭 Hero Settings Accordion */}
        <Accordion 
          id="hero" 
          title="Hero Styling & Visuals" 
          icon="fa-image" 
          isOpen={openAccordion === 'hero'} 
          onToggle={toggleAccordion}
        >
          <div className="space-y-5">
            {/* Height & Darknes */}
            <div className="p-3 bg-white border border-slate-200 rounded space-y-4">
                <Slider 
                    label="Overlay Darkness" 
                    value={Math.round((parseFloat(localData.hero_overlay_transparantie) || 0) * 100)} 
                    min={0} max={100} unit="%" 
                    onChange={(v) => { handlePreview('hero_overlay_transparantie', v/100); handleSave('hero_overlay_transparantie', v/100); }} 
                />
                <Slider 
                    label="Hero Height" 
                    value={parseInt(localData.hero_hoogte || 600)} 
                    min={300} max={1000} unit="px" 
                    onChange={(v) => { handlePreview('hero_hoogte', v); handleSave('hero_hoogte', v); }} 
                />
            </div>
            
            {/* Alignment & Buttons */}
            <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                    <label className="text-[10px] font-black font-bold text-slate-400 uppercase tracking-widest">Text Alignment</label>
                    <div className="flex bg-white border border-slate-200 rounded overflow-hidden">
                        {['left', 'center', 'right'].map(align => (
                        <button
                            key={align}
                            onClick={() => { handlePreview('hero_alignment', align); handleSave('hero_alignment', align); }}
                            className={`flex-1 py-2 text-xs ${localData.hero_alignment === align ? 'bg-blue-600 text-white shadow-inner' : 'hover:bg-slate-50'}`}
                        >
                            <i className={`fa-solid fa-align-${align}`}></i>
                        </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black font-bold text-slate-400 uppercase tracking-widest">CTA Button Style</label>
                    <div className="flex bg-white border border-slate-200 rounded overflow-hidden">
                        {[
                            { id: 'solid', label: 'Solid' },
                            { id: 'outline', label: 'Outline' },
                            { id: 'glass', label: 'Glass' }
                        ].map(style => (
                        <button
                            key={style.id}
                            onClick={() => { handlePreview('hero_cta_style', style.id); handleSave('hero_cta_style', style.id); }}
                            className={`flex-1 py-2 text-[10px] font-black uppercase ${localData.hero_cta_style === style.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-500'}`}
                        >
                            {style.label}
                        </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
                <ToggleMini label="Full Height" settingsKey="hero_full_height" value={localData.hero_full_height} onPreview={handlePreview} onSave={handleSave} />
                <ToggleMini label="Scroll Arrow" settingsKey="hero_show_arrow" value={localData.hero_show_arrow} onPreview={handlePreview} onSave={handleSave} />
                <ToggleMini label="Animate Text" settingsKey="hero_animate" value={localData.hero_animate} onPreview={handlePreview} onSave={handleSave} />
                <ToggleMini label="Glass Card" settingsKey="hero_glass_card" value={localData.hero_glass_card} onPreview={handlePreview} onSave={handleSave} />
            </div>
          </div>
        </Accordion>

        {/* 🌐 Global Layout (v8.9) */}
        <Accordion 
          id="global_layout" 
          title="Global Page Spacing" 
          icon="fa-arrows-left-right-to-line" 
          isOpen={openAccordion === 'global_layout'} 
          onToggle={toggleAccordion}
        >
          <div className="space-y-6">
            <Slider 
                label="Algemene Sectie Spacing" 
                value={parseInt(localData.global_padding || 64)} 
                min={0} max={160} unit="px" 
                onChange={(v) => { handlePreview('global_padding', v); handleSave('global_padding', v); }} 
            />
            
            <div className="pt-4 border-t border-slate-100">
                <button 
                    onClick={() => {
                        if (window.confirm("Weet je zeker dat je ALLE secties wilt resetten naar de globale spacing? Individuele afwijkingen gaan verloren.")) {
                             window.parent.postMessage({ type: 'DOCK_RESET_ALL_PADDING' }, '*');
                        }
                    }}
                    className="w-full py-3 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-slate-200 hover:border-red-100"
                >
                    <i className="fa-solid fa-rotate-left mr-2"></i>
                    Reset Alle Secties naar Globaal
                </button>
            </div>
          </div>
        </Accordion>

        {/* 🎨 Global Colors Accordion */}
        <Accordion 
          id="colors" 
          title="Global Color Palette" 
          icon="fa-palette" 
          isOpen={openAccordion === 'colors'} 
          onToggle={toggleAccordion}
        >
          <div className="space-y-6">
            <ColorGrid title="Light Mode" prefix="light_" colors={localData} onPreview={handlePreview} onSave={handleSave} />
            <div className="border-t border-slate-200"></div>
            <ColorGrid title="Dark Mode" prefix="dark_" colors={localData} onPreview={handlePreview} onSave={handleSave} />
          </div>
        </Accordion>

      </div>

      {/* 🏁 Footer Status */}
      <div className="p-3 bg-white border-t border-slate-300 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isHydrated ? 'bg-green-500' : 'bg-amber-500'}`}></span>
          {isHydrated ? 'Bridge Connected' : 'Connecting...'}
        </div>
        <span>v8.5 Build</span>
      </div>
    </div>
  );
}

const Accordion = ({ id, title, icon, children, isOpen, onToggle }) => (
  <div className="border-b border-slate-300">
    <button 
      onClick={() => onToggle(id)}
      className={`w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors ${isOpen ? 'border-b border-slate-200' : ''}`}
    >
      <div className="flex items-center gap-3">
        <i className={`fa-solid ${icon} text-slate-400 w-4 text-center`}></i>
        <span className="text-[11px] font-black uppercase tracking-tight text-slate-700">{title}</span>
      </div>
      <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'} text-[10px] text-slate-300`}></i>
    </button>
    {isOpen && (
      <div className="p-4 bg-slate-50 shadow-inner animate-in slide-in-from-top-2 duration-200">
        {children}
      </div>
    )}
  </div>
);

const Slider = ({ label, value, min, max, unit, onChange }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-tighter">{label}</label>
      <span className="text-[10px] font-mono font-bold text-blue-600">{value}{unit}</span>
    </div>
    <input 
      type="range" min={min} max={max} value={value} 
      onInput={(e) => onChange(parseInt(e.target.value))} 
      className="w-full h-1.5 bg-slate-300 rounded appearance-none cursor-pointer accent-blue-600" 
    />
  </div>
);

const Toggle = ({ label, settingsKey, value, onPreview, onSave }) => {
  const isActive = value === true || value === 'true';
  return (
    <div className="flex items-center justify-between py-1">
      <label className="text-[10px] font-bold uppercase text-slate-600">{label}</label>
      <button 
        onClick={() => { const next = !isActive; onPreview(settingsKey, next); onSave(settingsKey, next); }}
        className={`w-10 h-5 rounded-full relative transition-colors ${isActive ? 'bg-blue-500' : 'bg-slate-300'}`}
      >
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isActive ? 'right-1' : 'left-1'}`}></div>
      </button>
    </div>
  );
};

const ToggleMini = ({ label, settingsKey, value, onPreview, onSave }) => {
  const isActive = value === true || value === 'true';
  return (
    <div className="flex flex-col gap-1 p-2 bg-white border border-slate-200 rounded">
      <label className="text-[8px] font-black uppercase text-slate-400 truncate">{label}</label>
      <button 
        onClick={() => { const next = !isActive; onPreview(settingsKey, next); onSave(settingsKey, next); }}
        className={`w-full py-1 text-[9px] font-bold rounded border ${isActive ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
      >
        {isActive ? 'ON' : 'OFF'}
      </button>
    </div>
  );
};

const ColorGrid = ({ title, prefix, colors, onPreview, onSave }) => (
  <div className="space-y-3">
    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-blue-500 pl-2">{title}</p>
    <div className="grid grid-cols-4 gap-2">
      {['primary', 'accent', 'button', 'menu', 'card', 'header', 'footer', 'bg', 'text'].map(key => (
        <div key={key} className="space-y-1 text-center">
          <div 
            className="w-full aspect-square rounded border border-slate-300 cursor-pointer shadow-sm relative group overflow-hidden"
            style={{ backgroundColor: colors[`${prefix}${key}_color`] || '#ffffff' }}
          >
            <input
                type="color"
                value={colors[`${prefix}${key}_color`] || '#ffffff'}
                onInput={(e) => onPreview(`${prefix}${key}_color`, e.target.value)}
                onChange={(e) => onSave(`${prefix}${key}_color`, e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="absolute inset-0 pointer-events-none group-hover:bg-black/5"></div>
          </div>
          <p className="text-[7px] font-black uppercase text-slate-400 truncate">{key}</p>
        </div>
      ))}
    </div>
  </div>
);
