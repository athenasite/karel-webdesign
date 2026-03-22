import React, { useState } from 'react';

/**
 * SectionManagerPanel (v8.6 - WIDE SIDEBAR EDITION)
 * Provides deep management of sections, fields, and items in a side panel.
 */
const SectionManagerPanel = (props) => {
  const { 
    siteStructure, 
    onClose,
    onMoveSection,
    onToggleSection,
    onUpdateLayout,
    onUpdateSectionSetting, // Changed from onUpdatePadding
    onAddItem,
    onDeleteItem,
    onMoveField,
    onToggleField,
    onToggleInline,
    onOpenLayoutManager,
    onOpenNavigationManager,
    onAIRedesign,
    onDuplicateSection,
    onRenameSection,
    width
  } = props;

  const [activeView, setActiveView] = useState('sections'); // 'sections', 'settings', 'fields', 'items'
  const [selectedSection, setSelectedSection] = useState(null);
  const [showPaddingFor, setShowPaddingFor] = useState(null);

  const getSectionSetting = (sectionId, property, defaultValue = null) => {
    const settings = siteStructure?.data?.section_settings;
    if (!settings) return defaultValue;
    if (Array.isArray(settings)) {
      const found = settings.find(s => s.id === sectionId);
      return (found && found[property] !== undefined) ? found[property] : defaultValue;
    }
    const found = settings[sectionId];
    return (found && found[property] !== undefined) ? found[property] : defaultValue;
  };

  // --- RENDERING HELPERS ---

  const renderSectionList = () => (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
        <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-400">Page Sections</h4>
        <div className="flex gap-2">
            <button 
                onClick={onOpenNavigationManager}
                className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded border border-slate-200 hover:bg-white hover:text-blue-600 transition-all"
                title="Manage Site Navigation"
            >
                🧭 Nav
            </button>
            <button 
                onClick={onOpenLayoutManager}
                className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded border border-slate-200 hover:bg-white hover:text-blue-600 transition-all"
                title="Manage Layout Presets"
            >
                🏗️ Layouts
            </button>
            <span className="text-[9px] font-bold text-slate-300 italic self-center">{siteStructure?.sections?.length || 0} items</span>
        </div>
      </div>
      {(siteStructure?.sections || []).map((section, idx) => (
        <div key={section} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded shadow-sm hover:border-blue-300 transition-all group">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-300 w-4">{idx + 1}</span>
            <span className="text-xs font-bold text-slate-700 capitalize truncate max-w-[120px]">{section.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => onToggleSection(section)}
              className={`p-1.5 rounded border ${getSectionSetting(section, 'visible') === false ? 'bg-slate-50 text-slate-300 border-slate-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}
              title="Toggle Visibility"
            >
              <i className={`fa-solid ${getSectionSetting(section, 'visible') === false ? 'fa-eye-slash' : 'fa-eye'} text-[10px]`}></i>
            </button>
            <div className="flex border border-slate-200 rounded overflow-hidden">
                <button onClick={() => onMoveSection(section, 'up')} className="p-1.5 bg-white hover:bg-slate-50 text-slate-400 border-r border-slate-200"><i className="fa-solid fa-arrow-up text-[9px]"></i></button>
                <button onClick={() => onMoveSection(section, 'down')} className="p-1.5 bg-white hover:bg-slate-50 text-slate-400"><i className="fa-solid fa-arrow-down text-[9px]"></i></button>
            </div>
            <button 
              onClick={() => { setSelectedSection(section); setActiveView('settings'); }}
              className="px-3 py-1.5 bg-slate-800 text-white text-[9px] font-black uppercase rounded hover:bg-blue-600 transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSectionSettings = () => {
    const useCustom = getSectionSetting(selectedSection, 'use_custom_padding');

    return (
    <div className="space-y-6 p-6 animate-in slide-in-from-right-4 duration-200">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setActiveView('sections')} className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded-full text-slate-500"><i className="fa-solid fa-arrow-left"></i></button>
        <h4 className="text-lg font-black uppercase tracking-tighter text-slate-800 truncate">Settings: <span className="text-blue-600">{selectedSection}</span></h4>
      </div>

      <div className="space-y-6">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-5">
            <div>
                <label className="text-[9px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Layout Pattern</label>
                <div className="grid grid-cols-2 gap-2">
                    {['grid', 'list', 'z-pattern', 'focus'].map(l => {
                        const layouts = siteStructure?.layouts || {};
                        const currentLayout = layouts[selectedSection] || layouts[selectedSection.toLowerCase()] || 'grid';
                        return (
                            <button 
                                key={l}
                                onClick={() => onUpdateLayout(selectedSection, l)}
                                className={`py-2 text-[9px] font-bold rounded border uppercase ${currentLayout === l ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}
                            >
                                {l}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Eigen Spacing Gebruiken</label>
                    <label htmlFor={`toggle-custom-padding-${selectedSection}`} className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            id={`toggle-custom-padding-${selectedSection}`}
                            className="sr-only peer"
                            checked={useCustom}
                            onChange={(e) => onUpdateSectionSetting(selectedSection, 'use_custom_padding', e.target.checked)}
                        />
                        <div className={`w-10 h-5 rounded-full transition-all relative ${useCustom ? 'bg-blue-600' : 'bg-slate-300'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useCustom ? 'left-6' : 'left-1'}`}></div>
                        </div>
                    </label>
                </div>

                {useCustom && (
                    <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Verticale Spacing</label>
                            <span className="text-[10px] font-mono font-bold text-blue-600">{getSectionSetting(selectedSection, 'padding') || 12}px</span>
                        </div>
                        <input 
                            type="range" min="0" max="40" step="1"
                            value={getSectionSetting(selectedSection, 'padding') || 12}
                            onChange={(e) => onUpdateSectionSetting(selectedSection, 'padding', parseInt(e.target.value))}
                            className={`w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 ${!useCustom ? 'opacity-30 pointer-events-none' : ''}`}
                            disabled={!useCustom}
                        />
                    </div>
                )}
            </div>
        </div>

        {siteStructure?.layouts?.[selectedSection] === 'list' && (
            <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50 space-y-3">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-blue-600/60 tracking-widest">Item Tussenruimte (Vertical)</label>
                    <span className="text-[10px] font-mono font-bold text-blue-600">{getSectionSetting(selectedSection, 'list_gap') || 96}px</span>
                </div>
                <input 
                    type="range" min="20" max="240" step="12"
                    value={getSectionSetting(selectedSection, 'list_gap') || 96}
                    onChange={(e) => onUpdateSectionSetting(selectedSection, 'list_gap', parseInt(e.target.value))}
                    className="w-full h-1 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
            </div>
        )}

        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg space-y-3">
            <label className="text-[9px] font-black uppercase text-blue-400 block tracking-widest">AI & Section Magic</label>
            <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={() => onAIRedesign(selectedSection, 'modernize')}
                    className="py-2 bg-white border border-blue-200 text-blue-600 text-[9px] font-black uppercase rounded hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                >
                    🪄 AI Redesign
                </button>
                <button 
                    onClick={() => onDuplicateSection(selectedSection)}
                    className="py-2 bg-white border border-slate-200 text-slate-500 text-[9px] font-black uppercase rounded hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                >
                    👯 Duplicate
                </button>
            </div>
            <button 
                onClick={() => {
                    const newName = window.prompt("Nieuwe naam voor deze sectie:", selectedSection);
                    if (newName && newName !== selectedSection) onRenameSection(selectedSection, newName);
                }}
                className="w-full py-2 bg-white border border-slate-200 text-slate-500 text-[9px] font-black uppercase rounded hover:bg-slate-800 hover:text-white transition-all shadow-sm"
            >
                🏷️ Rename Section
            </button>
        </div>

        <div className="space-y-3">
            <button 
                onClick={() => setActiveView('fields')}
                className="w-full p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 transition-all flex items-center justify-between group"
            >
                <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <i className="fa-solid fa-list-check"></i>
                    </div>
                    <div>
                        <p className="font-black uppercase text-[10px]">Fields</p>
                        <p className="text-[9px] text-slate-400">Show/hide data fields.</p>
                    </div>
                </div>
                <i className="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>
            </button>

            <button 
                onClick={() => setActiveView('items')}
                className="w-full p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 transition-all flex items-center justify-between group"
            >
                <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <i className="fa-solid fa-boxes-stacked"></i>
                    </div>
                    <div>
                        <p className="font-black uppercase text-[10px]">Records</p>
                        <p className="text-[9px] text-slate-400">Manage section items.</p>
                    </div>
                </div>
                <i className="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>
            </button>
        </div>
      </div>
    </div>
  );
};

  const renderFieldManager = () => {
    const fields = (siteStructure?.data?.[selectedSection]?.[0] ? Object.keys(siteStructure.data[selectedSection][0]) : [])
        .filter(k => !['absoluteIndex', '_hidden', 'id', 'pk', 'uuid'].some(tf => k.toLowerCase().includes(tf)))
        .filter(k => !k.toLowerCase().includes('foto') && !k.toLowerCase().includes('image'))
        .sort((a, b) => {
            const order = siteStructure?.data?.display_config?.sections?.[selectedSection]?.visible_fields || [];
            const idxA = order.indexOf(a);
            const idxB = order.indexOf(b);
            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
        });

    return (
        <div className="p-4 space-y-4 animate-in slide-in-from-right-4 duration-200">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setActiveView('settings')} className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded-full text-slate-500"><i className="fa-solid fa-arrow-left"></i></button>
                <h4 className="text-lg font-black uppercase tracking-tighter text-slate-800 truncate">Fields: <span className="text-blue-600">{selectedSection}</span></h4>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-1 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                {fields.map(field => {
                    const displayConfig = siteStructure?.data?.display_config || { sections: {} };
                    const config = displayConfig.sections?.[selectedSection] || { visible_fields: [], hidden_fields: [] };
                    const isHidden = Array.isArray(config.hidden_fields) && config.hidden_fields.includes(field);
                    const isInline = Array.isArray(config.inline_fields) && config.inline_fields.includes(field);

                    return (
                        <div key={field} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 mb-1 rounded shadow-sm">
                            <span className={`text-[11px] font-bold truncate max-w-[100px] ${!isHidden ? 'text-slate-700' : 'text-slate-300 line-through'}`}>{field}</span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => onMoveField(selectedSection, field, 'up')} className="p-1.5 hover:bg-slate-50 text-slate-400 rounded"><i className="fa-solid fa-chevron-up text-[8px]"></i></button>
                                <button onClick={() => onMoveField(selectedSection, field, 'down')} className="p-1.5 hover:bg-slate-50 text-slate-400 rounded"><i className="fa-solid fa-chevron-down text-[8px]"></i></button>
                                <div className="w-px h-3 bg-slate-100 mx-0.5"></div>
                                <button onClick={() => onToggleField(selectedSection, field)} className={`p-1.5 rounded ${!isHidden ? 'text-green-500 bg-green-50' : 'text-slate-300'}`}><i className={`fa-solid ${!isHidden ? 'fa-eye' : 'fa-eye-slash'} text-[10px]`}></i></button>
                                <button onClick={() => onToggleInline(selectedSection, field)} className={`p-1.5 rounded ${isInline ? 'text-purple-500 bg-purple-50' : 'text-slate-300'}`} title="Toggle Inline"><i className="fa-solid fa-level-down-alt text-[10px]"></i></button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const renderItemManager = () => {
    const items = siteStructure?.data?.[selectedSection] || [];
    const extractTitle = (item, idx) => {
        const val = item.naam || item.titel || item.header || item.kop || item.label || Object.values(item).find(v => typeof v === 'string' && v.length < 40);
        return (typeof val === 'object' ? val.text : val) || `Item ${idx + 1}`;
    };

    return (
        <div className="p-4 space-y-4 animate-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActiveView('settings')} className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded-full text-slate-500"><i className="fa-solid fa-arrow-left"></i></button>
                    <h4 className="text-lg font-black uppercase tracking-tighter text-slate-800">Records</h4>
                </div>
                <button onClick={() => onAddItem(selectedSection)} className="px-3 py-1.5 bg-blue-600 text-white text-[9px] font-black uppercase rounded shadow hover:bg-blue-700">Add</button>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-1 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                {items.map((itemData, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 mb-1 rounded shadow-sm group">
                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                            <span className="text-[11px] font-bold text-slate-600 truncate pr-2 flex-1">{extractTitle(itemData, idx)}</span>
                        </div>
                        <button 
                            onClick={() => onDeleteItem(selectedSection, idx)}
                            className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                        >
                            <i className="fa-solid fa-trash-can text-[10px]"></i>
                        </button>
                    </div>
                ))}
                {items.length === 0 && <p className="p-6 text-center text-slate-400 italic text-[10px]">No records found.</p>}
            </div>
        </div>
    );
  };

  return (
    <div 
      style={{ width: `${width}px` }}
      className="h-full bg-slate-50 border-r border-slate-300 flex flex-col shadow-inner overflow-hidden relative"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <i className="fa-solid fa-sliders text-blue-600"></i> Section Tools
        </h3>
        <button 
          onClick={onClose} 
          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 rounded transition-colors"
          title="Close Tools"
        >
          <i className="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeView === 'sections' && renderSectionList()}
        {activeView === 'settings' && renderSectionSettings()}
        {activeView === 'fields' && renderFieldManager()}
        {activeView === 'items' && renderItemManager()}
      </div>

      {/* Resizer Handle (Internal Right) */}
      <div className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500/20 z-50"></div>
    </div>
  );
};

export default SectionManagerPanel;
