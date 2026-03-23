import React, { useState, useEffect, useRef } from 'react';

const fontOptions = [
  { label: 'Default', value: '' },
  { label: 'Sans Serif', value: 'ui-sans-serif, system-ui' },
  { label: 'Serif', value: 'ui-serif, Georgia' },
  { label: 'Monospace', value: 'ui-monospace, SFMono-Regular' },
  { label: 'Display (Oswald)', value: 'Oswald, sans-serif' },
  { label: 'Modern (Montserrat)', value: 'Montserrat, sans-serif' },
  { label: 'Elegant (Playfair)', value: 'Playfair Display, serif' },
  { label: 'Round (Quicksand)', value: 'Quicksand, sans-serif' }
];

const VisualEditor = (props) => {
  const { 
    item, 
    selectedSite, 
    onSave, 
    onCancel, 
    onUpload
  } = props;

  const labelRef = useRef(null);
  const urlRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [value, setValue] = useState('');
  
  const initialValueData = item?.value || item?.currentValue || '';
  const dockType = item?.dockType || item?.type || item?.dataType || 'text';
  const isLink = dockType === 'link' || dockType === 'button';
  const isMedia = dockType === 'media' || (!isLink && item?.binding?.key?.toLowerCase().includes('image'));

  const [linkData, setLinkData] = useState({ label: '', url: '' });
  const [textStyles, setTextStyles] = useState({
    color: typeof initialValueData === 'object' ? (initialValueData.color || '') : '',
    fontSize: typeof initialValueData === 'object' ? (initialValueData.fontSize || '') : '',
    fontWeight: typeof initialValueData === 'object' ? (initialValueData.fontWeight || 'normal') : 'normal',
    fontStyle: typeof initialValueData === 'object' ? (initialValueData.fontStyle || 'normal') : 'normal',
    textAlign: typeof initialValueData === 'object' ? (initialValueData.textAlign || 'left') : 'left',
    fontFamily: typeof initialValueData === 'object' ? (initialValueData.fontFamily || '') : '',
    shadowX: typeof initialValueData === 'object' ? (initialValueData.shadowX || 0) : 0,
    shadowY: typeof initialValueData === 'object' ? (initialValueData.shadowY || 0) : 0,
    shadowBlur: typeof initialValueData === 'object' ? (initialValueData.shadowBlur || 0) : 0,
    shadowColor: typeof initialValueData === 'object' ? (initialValueData.shadowColor || 'rgba(0,0,0,0.5)') : 'rgba(0,0,0,0.5)',
    paddingTop: typeof initialValueData === 'object' ? (initialValueData.paddingTop || 0) : 0,
    paddingBottom: typeof initialValueData === 'object' ? (initialValueData.paddingBottom || 0) : 0
  });

  const requestSync = () => {
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow && item?.binding) {
      iframe.contentWindow.postMessage({
        type: 'DOCK_REQUEST_SYNC',
        file: item.binding.file,
        index: item.binding.index,
        key: item.binding.key
      }, '*');
    }
  };

  useEffect(() => {
    if (typeof initialValueData === 'object') {
        setValue(initialValueData.text || initialValueData.label || initialValueData.title || '');
    } else {
        setValue(initialValueData);
    }
  }, [initialValueData]);

  useEffect(() => {
    const handleSyncResponse = (event) => {
      const { type, key, value: siteValue } = event.data;
      if (type === 'SITE_SYNC_RESPONSE' && key === item?.binding?.key) {
        if (isLink) {
          const foundUrl = (typeof siteValue === 'object' && siteValue !== null) ? siteValue.url : siteValue;
          const foundLabel = (typeof siteValue === 'object' && siteValue !== null) ? siteValue.label : siteValue;
          setLinkData({ label: foundLabel || '', url: foundUrl || '' });
        } else if (!isMedia) {
          if (typeof siteValue === 'object' && siteValue !== null) {
            setValue(siteValue.text || siteValue.title || siteValue.label || siteValue.name || siteValue.value || '');
            setTextStyles(prev => ({ ...prev, ...siteValue }));
          } else {
            setValue(siteValue || '');
          }
        }
        setIsLoaded(true);
      }
    };
    window.addEventListener('message', handleSyncResponse);
    const timer = setTimeout(requestSync, 100);
    return () => { window.removeEventListener('message', handleSyncResponse); clearTimeout(timer); };
  }, [item?.binding?.key, isLink, isMedia]);

  const handleSave = () => {
    let finalData;
    if (isLink) {
      finalData = { label: labelRef.current.value, url: urlRef.current.value };
    } else if (isMedia) {
      finalData = value;
    } else {
      finalData = { text: value, ...textStyles };
    }
    onSave(finalData, {});
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded shadow-2xl overflow-hidden border border-slate-400 animate-in zoom-in duration-150 flex flex-col w-full max-w-2xl max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
            <i className="fa-solid fa-pen-to-square text-blue-600"></i>
            Editor: {item?.binding?.key || 'Element'}
          </h3>
          <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {!isLoaded ? (
            <div className="flex flex-col items-center justify-center h-60 gap-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-black uppercase text-[10px] text-slate-400 tracking-widest">Fetching from Bridge...</p>
            </div>
          ) : isLink ? (
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Button Label</label>
                    <input ref={labelRef} type="text" defaultValue={linkData.label} className="w-full p-4 bg-slate-50 border border-slate-300 rounded font-bold outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">URL / Target</label>
                    <input ref={urlRef} type="text" defaultValue={linkData.url} className="w-full p-4 bg-slate-50 border border-slate-300 rounded font-mono text-sm outline-none focus:border-blue-500 text-blue-600" />
                </div>
            </div>
          ) : isMedia ? (
            <div className="space-y-6">
                <div 
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-500', 'bg-blue-50'); }}
                    onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50'); }}
                    onDrop={async (e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                        const file = e.dataTransfer.files[0];
                        if (file) {
                            const res = await fetch(`${selectedSite?.url}/__athena/upload`, { method: 'POST', headers: { 'X-Filename': file.name }, body: file });
                            const data = await res.json();
                            if (data.success) setValue(data.filename);
                        }
                    }}
                    className="aspect-video bg-slate-50 rounded overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center group relative transition-all"
                >
                    {value ? <img src={value.startsWith('http') ? value : `${selectedSite?.url}/images/${value}`} alt="Preview" className="max-h-full object-contain" /> : <p className="text-slate-400">No Image Selected</p>}
                    <label className="absolute inset-0 flex items-center justify-center bg-blue-600/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-black uppercase text-xs tracking-widest">
                        <i className="fa-solid fa-upload mr-2"></i> Upload or Drop Image
                        <input type="file" className="hidden" onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const res = await fetch(`${selectedSite?.url}/__athena/upload`, { method: 'POST', headers: { 'X-Filename': file.name }, body: file });
                                const data = await res.json();
                                if (data.success) setValue(data.filename);
                            }
                        }} accept="image/*" />
                    </label>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Filename</label>
                    <input type="text" value={value} onChange={(e) => setValue(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-300 rounded font-mono text-xs text-slate-500" />
                </div>
            </div>
          ) : (
            <div className="space-y-6">
                <div className="bg-slate-50 border border-slate-300 rounded overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-slate-200">
                        <div className="p-6 space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">Typography</label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <select 
                                        value={textStyles.fontFamily} 
                                        onChange={(e) => setTextStyles(s => ({ ...s, fontFamily: e.target.value }))}
                                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-bold appearance-none cursor-pointer"
                                    >
                                        {fontOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                    </select>
                                    <i className="fa-solid fa-chevron-down absolute right-2 top-3 text-[8px] text-slate-400 pointer-events-none"></i>
                                </div>
                                <input type="number" value={isNaN(parseInt(textStyles.fontSize)) ? '' : parseInt(textStyles.fontSize)} onChange={(e) => setTextStyles(s => ({ ...s, fontSize: e.target.value }))} className="w-16 p-2 border border-slate-300 rounded font-bold text-xs" placeholder="PX" />
                            </div>
                            <div className="flex gap-2">
                                <input type="color" value={textStyles.color || '#000000'} onChange={(e) => setTextStyles(s => ({ ...s, color: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border border-slate-300 bg-white p-1" />
                                <div className="flex border border-slate-300 rounded overflow-hidden flex-1">
                                    <button onClick={() => setTextStyles(s => ({ ...s, fontWeight: s.fontWeight === 'bold' ? 'normal' : 'bold' }))} className={`flex-1 py-2 text-xs font-black ${textStyles.fontWeight === 'bold' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-50'}`}>B</button>
                                    <button onClick={() => setTextStyles(s => ({ ...s, fontStyle: s.fontStyle === 'italic' ? 'normal' : 'italic' }))} className={`flex-1 py-2 text-xs italic font-serif ${textStyles.fontStyle === 'italic' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-50'}`}>I</button>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">Alignment & Layout</label>
                            <div className="flex border border-slate-300 rounded overflow-hidden">
                                {['left', 'center', 'right', 'justify'].map(a => (
                                    <button key={a} onClick={() => setTextStyles(s => ({ ...s, textAlign: a }))} className={`flex-1 py-2 text-xs ${textStyles.textAlign === a ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-50'}`}><i className={`fa-solid fa-align-${a}`}></i></button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-400">Pad Top</label>
                                    <input type="number" value={isNaN(parseInt(textStyles.paddingTop)) ? '' : parseInt(textStyles.paddingTop)} onChange={(e) => setTextStyles(s => ({ ...s, paddingTop: parseInt(e.target.value) || 0 }))} className="w-full p-2 border border-slate-300 rounded text-xs font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-400">Pad Bottom</label>
                                    <input type="number" value={isNaN(parseInt(textStyles.paddingBottom)) ? '' : parseInt(textStyles.paddingBottom)} onChange={(e) => setTextStyles(s => ({ ...s, paddingBottom: parseInt(e.target.value) || 0 }))} className="w-full p-2 border border-slate-300 rounded text-xs font-bold" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <textarea 
                    value={value} 
                    onChange={(e) => setValue(e.target.value)} 
                    className="w-full p-8 bg-slate-50 border border-slate-300 rounded min-h-[250px] font-bold outline-none focus:border-blue-500 text-xl shadow-inner leading-relaxed"
                    style={{ 
                        color: textStyles.color, 
                        textAlign: textStyles.textAlign, 
                        fontWeight: textStyles.fontWeight, 
                        fontStyle: textStyles.fontStyle,
                        fontFamily: textStyles.fontFamily,
                        paddingTop: `${textStyles.paddingTop}px`,
                        paddingBottom: `${textStyles.paddingBottom}px`,
                        textShadow: textStyles.shadowBlur > 0 ? `${textStyles.shadowX}px ${textStyles.shadowY}px ${textStyles.shadowBlur}px ${textStyles.shadowColor}` : 'none'
                    }}
                    placeholder="Enter text content..."
                />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-200 flex justify-end gap-4 shrink-0">
            <button onClick={onCancel} className="px-6 py-3 text-slate-500 font-bold hover:underline text-xs uppercase tracking-widest">Discard</button>
            <button onClick={handleSave} className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded shadow-xl uppercase text-xs tracking-widest active:scale-95 transition-all">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default VisualEditor;
