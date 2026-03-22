import React, { useState, useEffect } from 'react';

/**
 * 🧭 NavigationManager
 * @description Centralized UI for managing site navigation links.
 */
const NavigationManager = ({ navigationData, onSave, onClose }) => {
  const [links, setLinks] = useState(navigationData || []);

  useEffect(() => {
    setLinks(navigationData || []);
  }, [navigationData]);

  const move = (index, direction) => {
    const newLinks = [...links];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newLinks.length) return;
    
    // Swap
    [newLinks[index], newLinks[targetIndex]] = [newLinks[targetIndex], newLinks[index]];
    setLinks(newLinks);
  };

  const addLink = () => {
    setLinks([...links, { label: 'Nieuwe Link', url: '#' }]);
  };

  const updateLink = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
  };

  const removeLink = (index) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    setLinks(newLinks);
  };

  const handleSave = () => {
    onSave(links);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[85vh] animate-in zoom-in duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Menu Builder</h3>
            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Navigatie Links Beheren</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-3 bg-slate-50/50 dark:bg-transparent">
          {links.length === 0 ? (
            <div className="py-10 text-center text-slate-400 italic text-sm">
                Geen navigatie links gevonden. Voeg je eerste link toe!
            </div>
          ) : (
            links.map((link, index) => (
              <div 
                key={index}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:border-blue-500/50"
              >
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1">
                    <button onClick={() => move(index, -1)} disabled={index === 0} className="text-slate-300 hover:text-blue-500 disabled:opacity-0 transition-colors">
                        <i className="fa-solid fa-caret-up"></i>
                    </button>
                    <button onClick={() => move(index, 1)} disabled={index === links.length - 1} className="text-slate-300 hover:text-blue-500 disabled:opacity-0 transition-colors">
                        <i className="fa-solid fa-caret-down"></i>
                    </button>
                </div>

                {/* Edit Fields */}
                <div className="flex-1 space-y-2">
                    <div>
                        <input 
                            type="text" 
                            value={link.label || link.titel || (typeof link.titel_navigatie === 'object' ? link.titel_navigatie?.text : link.titel_navigatie) || ''}
                            onChange={(e) => updateLink(index, 'label', e.target.value)}
                            placeholder="Link Label (bijv. 'Over Ons')"
                            className="w-full text-sm font-bold bg-transparent border-0 border-b border-slate-200 dark:border-slate-700 px-0 py-1 focus:ring-0 focus:border-blue-500 dark:text-white"
                        />
                    </div>
                    <div>
                        <input 
                            type="text" 
                            value={link.url || link.slug || ''}
                            onChange={(e) => updateLink(index, 'url', e.target.value)}
                            placeholder="URL of Anchor (bijv. '#about' of '/contact')"
                            className="w-full text-xs font-mono text-slate-500 bg-transparent border-0 border-b border-slate-200 dark:border-slate-700 px-0 py-1 focus:ring-0 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Delete Button */}
                <div className="flex items-center">
                    <button 
                        onClick={() => removeLink(index)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Link Verwijderen"
                    >
                        <i className="fa-solid fa-trash-can"></i>
                    </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-3">
            <button 
                onClick={addLink}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
                <i className="fa-solid fa-plus"></i>
                Nieuwe Link Toevoegen
            </button>

            <button 
                onClick={handleSave}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
            >
                Menu Opslaan
            </button>
        </div>
      </div>
    </div>
  );
};

export default NavigationManager;
