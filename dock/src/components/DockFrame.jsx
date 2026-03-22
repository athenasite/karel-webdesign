import React, { useState, useEffect, useRef } from 'react';
import SiteSelector from './SiteSelector';
import DesignControls from './DesignControls';
import VisualEditor from './VisualEditor';
import HelpModal from './HelpModal';
import SaveEverythingModal from './SaveEverythingModal';
import SourceConflictModal from './SourceConflictModal';

import SectionManagerPanel from './SectionManagerPanel';
import LayoutManager from './LayoutManager';
import FieldConfigModal from './FieldConfigModal';
import SectionDesignModal from './SectionDesignModal';
import NavigationManager from './NavigationManager';

const DockFrame = () => {
  const [selectedSite, setSelectedSite] = useState('');
  const [siteStructure, setSiteStructure] = useState(null);
  const [showLayoutManager, setShowLayoutManager] = useState(false);
  const [showNavigationManager, setShowNavigationManager] = useState(false);
  const [fieldConfigItem, setFieldConfigItem] = useState(null);
  const [sectionDesignItem, setSectionDesignItem] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [isConnected, setIsConnected] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showSectionManager, setShowSectionManager] = useState(false);
  const [showSaveEverythingModal, setShowSaveEverythingModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictReport, setConflictReport] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(localStorage.getItem('athena_last_sync') || null);
  const [refreshKey, setRefreshKey] = useState(0);
  const iframeRef = useRef(null);

  // Sidebar Resizing State
  const [leftWidth, setLeftWidth] = useState(260);
  const [middleWidth, setMiddleWidth] = useState(390); // 1.5x van 260
  const isResizingLeft = useRef(false);
  const isResizingMiddle = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft.current) {
        const newWidth = Math.min(Math.max(180, e.clientX), 450);
        setLeftWidth(newWidth);
      }
      if (isResizingMiddle.current) {
        // Directe berekening vanaf de linker rand van het scherm
        const newWidth = Math.min(Math.max(250, e.clientX), 850);
        setMiddleWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizingLeft.current = false;
      isResizingMiddle.current = false;
      document.body.classList.remove('select-none', 'is-dragging');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [leftWidth]); // Afhankelijkheid van leftWidth is nodig voor correcte relatieve berekening

  const isDragging = isResizingLeft.current || isResizingMiddle.current;

  // Undo/Redo State
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushToHistory = (file, index, key, oldValue, newValue, actionType = 'update') => {
    const newEntry = { file, index, key, oldValue, newValue, actionType };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEntry);

    // Limit history to 20 items to save RAM
    const finalHistory = newHistory.length > 20 ? newHistory.slice(-20) : newHistory;
    setHistory(finalHistory);
    setHistoryIndex(finalHistory.length - 1);
    console.log("📜 History added:", newEntry);
  };

  const undo = async () => {
    if (historyIndex < 0) return;
    const entry = history[historyIndex];
    console.log("⏪ Undoing:", entry.actionType, entry);

    if (entry.actionType === 'delete') {
      // Undo a delete = Restore the item
      await saveData(entry.file, entry.index, null, entry.oldValue, null, true, 'restore');
    } else if (entry.actionType === 'add') {
      // Undo an add = Delete the item
      await saveData(entry.file, entry.index, null, null, null, true, 'delete');
    } else {
      // Standard update
      await saveData(entry.file, entry.index, entry.key, entry.oldValue, null, true);
    }

    setHistoryIndex(prev => prev - 1);
    setTimeout(forceRefresh, 100);
  };

  const redo = async () => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const entry = history[nextIndex];
    console.log("⏩ Redoing:", entry.actionType, entry);

    if (entry.actionType === 'delete') {
      await saveData(entry.file, entry.index, null, null, null, true, 'delete');
    } else if (entry.actionType === 'add') {
      await saveData(entry.file, entry.index, null, null, null, true, 'add');
    } else {
      await saveData(entry.file, entry.index, entry.key, entry.newValue, null, true);
    }

    setHistoryIndex(nextIndex);
    setTimeout(forceRefresh, 100);
  };

  // Helper voor API URL
  const getSiteApiUrl = () => {
    if (!selectedSite) return null;
    // Support both object (new) and string (legacy) formats
    const baseUrl = selectedSite.url || (typeof selectedSite === 'string' ? `http://localhost:5000/${selectedSite}/` : '');
    if (!baseUrl) return null;

    const cleanBase = baseUrl.replace(/\/$/, '');
    return `${cleanBase}/__athena/update-json`;
  };

  // 🔱 v8.8 Robust Section Settings Helper
  const getSectionSetting = (sectionId, property, defaultValue = null) => {
    const settings = siteStructure?.data?.section_settings;
    if (!settings) return defaultValue;

    if (Array.isArray(settings)) {
      const found = settings.find(s => s.id === sectionId);
      return (found && found[property] !== undefined) ? found[property] : defaultValue;
    }

    if (typeof settings === 'object') {
      const found = settings[sectionId];
      return (found && found[property] !== undefined) ? found[property] : defaultValue;
    }

    return defaultValue;
  };

  // Laden van MPA manifest indien beschikbaar
  useEffect(() => {
    if (!selectedSite) {
      setPages([]);
      return;
    }

    const baseUrl = selectedSite.url || (typeof selectedSite === 'string' ? `http://localhost:5000/${selectedSite}/` : '');
    const cleanBase = baseUrl.replace(/\/$/, '');
    const manifestUrl = `${cleanBase}/data/pages-manifest.json`;

    fetch(manifestUrl)
      .then(res => res.json())
      .then(data => {
        console.log("📄 Pages loaded:", data.length);
        setPages(data);
      })
      .catch(err => {
        console.debug("ℹ️ No multi-page manifest found for this site (SPA mode)");
        setPages([]);
      });
  }, [selectedSite]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (historyIndex >= 0) {
          e.preventDefault();
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        if (historyIndex < history.length - 1) {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Listen for messages from the docked site
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'SITE_READY') {
        console.debug('✅ Site connected to Dock:', event.data);
        setSiteStructure(event.data.structure);

        // Normalize path: ensure it starts with / and remove trailing slashes
        let path = event.data.structure.currentPath || '/';
        if (!path.startsWith('/')) path = '/' + path;
        if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);

        setCurrentPath(path);
        setIsConnected(true);

        // We verwijderen de automatische resync die kleuren overschrijft
        // setTimeout(() => {
        //    window.dispatchEvent(new CustomEvent('athena-resync-colors'));
        // }, 500);
      } else if (event.data?.type === 'DOCK_TRIGGER_REFRESH') {
        forceRefresh();
      }

      if (event.data.type === 'SITE_CLICK') {
        setEditingItem(event.data);
      }

      if (event.data.type === 'CONFIGURE_FIELDS') {
        const section = event.data.sectionName;
        const config = siteStructure?.data?.display_config?.[section] || {};
        setFieldConfigItem({ name: section, config });
      }

      if (event.data.type === 'DESIGN_SECTION') {
        const section = event.data.sectionName;
        const settings = siteStructure?.data?.section_settings?.[section] || {};
        setSectionDesignItem({ name: section, settings });
      }

      if (event.data.type === 'DELETE_SECTION') {
        deleteSection(event.data.sectionName);
      }

      if (event.data.type === 'DUPLICATE_SECTION') {
        handleDuplicateSection(event.data.sectionName);
      }

      if (event.data.type === 'RENAME_SECTION') {
        handleRenameSection(event.data.oldName, event.data.newName);
      }

      if (event.data.type === 'AI_REDESIGN_SECTION') {
        handleAIRedesign(event.data.sectionName, event.data.goal);
      }

      if (event.data.type === 'AI_AB_TEST_SECTION') {
        handleAIABTest(event.data.sectionName);
      }

      if (event.data.type === 'SITE_SAVE') {
        const { binding, value } = event.data;
        saveData(binding.file, binding.index, binding.key, value);
      }

      if (event.data.type === 'DOCK_RESET_ALL_PADDING') {
        handleResetAllPadding();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedSite]);

  const handleNavigate = (path) => {
    if (iframeRef.current) {
      // Normalize path
      let cleanPath = path.startsWith('/') ? path : '/' + path;

      console.log("✈️ Sending navigate command:", cleanPath);
      iframeRef.current.contentWindow.postMessage({
        type: 'ATHENA_NAVIGATE',
        payload: { path: cleanPath }
      }, '*');
      setCurrentPath(cleanPath);
    }
  };

  const forceRefresh = () => {
    console.log("🔄 Forcing iframe refresh via Key Update...");
    setIsConnected(false);
    setRefreshKey(prev => prev + 1);
  };

  // Send color update to site
  const updateColor = (key, value, shouldSave = true) => {
    if (iframeRef.current) {
      // 1. Determine target file
      let file = 'style_config';

      // Auto-detect based on current data
      const possibleFiles = ['site_settings', 'header_settings', 'hero', 'style_config'];
      for (const f of possibleFiles) {
        const table = siteStructure?.data?.[f];
        const row = Array.isArray(table) ? table[0] : table;
        if (row && key in row) { file = f; break; }
      }

      // Overrides
      if (key.startsWith('header_') && file === 'style_config') file = 'site_settings';
      if (key.startsWith('hero_') && file === 'style_config') file = 'hero';

      // 2. Live preview
      iframeRef.current.contentWindow.postMessage({
        type: 'DOCK_UPDATE_COLOR',
        file,
        index: 0,
        key,
        value
      }, '*');

      if (shouldSave) {
        const currentTable = siteStructure?.data?.[file];
        const isArray = Array.isArray(currentTable);
        const row = isArray ? currentTable[0] : currentTable;
        const oldValue = row ? row[key] : null;

        pushToHistory(file, isArray ? 0 : null, key, oldValue, value);

        if (typeof oldValue === 'object' && oldValue !== null) {
          const newValue = { ...oldValue, color: value };
          saveData(file, isArray ? 0 : null, key, newValue, null, true);
        } else {
          saveData(file, isArray ? 0 : null, key, value, null, true);
        }
      }
    }
  };

  // Save changes via API
  const saveData = async (file, index, key, value, formatting = null, silent = false, action = null) => {
    try {
      const url = getSiteApiUrl();
      if (!url) return;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file, index, key, value, formatting, action })
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      // CRUCIAL: Update local state immediately so modals see the change!
      setSiteStructure(prev => {
        const newData = { ...prev.data };
        if (Array.isArray(newData[file])) {
          newData[file] = [...newData[file]];
          newData[file][index] = { ...newData[file][index], [key]: value };
        } else if (newData[file]) {
          // Support dot-notation in local state (e.g. "hero.visible")
          if (key.includes('.')) {
            const [section, subkey] = key.split('.');
            if (newData[file][section]) {
               newData[file] = { 
                 ...newData[file], 
                 [section]: { ...newData[file][section], [subkey]: value } 
               };
            }
          } else {
            newData[file] = { ...newData[file], [key]: value };
          }
        }
        return { ...prev, data: newData };
      });

      if (!silent) console.log('✅ Saved & Synced:', file, key, value);
    } catch (err) {
      console.error('❌ Save failed:', err);
    }
  };

  // --- NEW ADVANCED HANDLERS (HEEL-BELANGRIJK) ---

  const deleteSection = async (sectionName) => {
    if (!window.confirm(`Weet je zeker dat je de sectie '${sectionName}' wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`)) return;
    
    console.log(`🗑️ Deleting section: ${sectionName}`);
    try {
        const dashboardPort = import.meta.env.VITE_DASHBOARD_PORT || '5001';
        const hostname = window.location.hostname;
        const res = await fetch(`http://${hostname}:${dashboardPort}/api/sites/${selectedSite.id}/delete-section`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sectionName })
        });
        if (res.ok) {
            window.location.reload();
        } else {
            alert("Fout bij verwijderen sectie.");
        }
    } catch (e) { console.error(e); }
  };

  const handleRenameSection = async (oldName, newName) => {
    console.log(`🏷️ Renaming section: ${oldName} -> ${newName}`);
    try {
        const dashboardPort = import.meta.env.VITE_DASHBOARD_PORT || '5001';
        const hostname = window.location.hostname;
        const res = await fetch(`http://${hostname}:${dashboardPort}/api/sites/${selectedSite.id}/rename-section`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldName, newName })
        });
        if (res.ok) {
            forceRefresh();
        } else {
            alert("Fout bij hernoemen sectie.");
        }
    } catch (e) { console.error(e); }
  };

  const handleDuplicateSection = async (sectionName) => {
    console.log(`👯 Duplicating section: ${sectionName}`);
    try {
        const dashboardPort = import.meta.env.VITE_DASHBOARD_PORT || '5001';
        const hostname = window.location.hostname;
        const res = await fetch(`http://${hostname}:${dashboardPort}/api/sites/${selectedSite.id}/duplicate-section`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sectionName })
        });
        if (res.ok) {
            forceRefresh();
        } else {
            alert("Fout bij dupliceren sectie.");
        }
    } catch (e) { console.error(e); }
  };

  const handleAIRedesign = async (sectionName, goal) => {
    console.log(`🪄 Requesting AI Redesign for ${sectionName} with goal: ${goal}`);
    try {
        const dashboardPort = import.meta.env.VITE_DASHBOARD_PORT || '5001';
        const hostname = window.location.hostname;
        const res = await fetch(`http://${hostname}:${dashboardPort}/api/ai/layout/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                siteId: selectedSite.id, 
                sectionName, 
                goal 
            })
        });
        const result = await res.json();
        if (result.success) {
            console.log("✅ AI suggested new settings:", result.settings);
            // Apply settings
            const saveRes = await fetch(`http://${hostname}:${dashboardPort}/api/sites/${selectedSite.id}/section-settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section: sectionName, settings: result.settings })
            });
            if (saveRes.ok) {
                forceRefresh();
                alert(`✨ AI Redesign toegepast op ${sectionName}!`);
            }
        } else {
            alert("AI kon geen redesign genereren: " + result.error);
        }
    } catch (e) { console.error(e); }
  };

  const handleAIABTest = async (sectionName) => {
    console.log(`🧪 Starting AI A/B Test for ${sectionName}`);
    try {
        const dashboardPort = import.meta.env.VITE_DASHBOARD_PORT || '5001';
        const hostname = window.location.hostname;
        const res = await fetch(`http://${hostname}:${dashboardPort}/api/ai/layout/ab-test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                siteId: selectedSite.id, 
                sectionName 
            })
        });
        const result = await res.json();
        if (result.success) {
            forceRefresh();
            alert(`✅ A/B Test gestart! AI heeft twee varianten gegenereerd voor ${sectionName}.`);
        } else {
            alert("Fout bij starten A/B Test: " + result.error);
        }
    } catch (e) { console.error(e); }
  };

  const handleNavigationSave = async (links) => {
    console.log(`🧭 Saving navigation data:`, links);
    try {
        const url = getSiteApiUrl();
        if (!url) return;
        
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: 'navbar', value: links, action: 'replace' })
        });
        
        if (res.ok) {
            setSiteStructure(prev => ({
                ...prev,
                data: { ...prev.data, navbar: links }
            }));

            // 🔥 Direct Sync for instant UI feedback
            if (iframeRef.current) {
                iframeRef.current.contentWindow.postMessage({
                    type: 'DOCK_UPDATE_DATA',
                    file: 'navbar',
                    value: links
                }, '*');
            }

            forceRefresh();
            setShowNavigationManager(false);
            console.log("✅ Navigation saved successfully via site API.");
        } else {
            const errData = await res.json();
            alert(`Fout bij opslaan navigatie: ${errData.error || res.statusText}`);
        }
    } catch (e) { 
        console.error('❌ Navigation save failed:', e); 
        alert("Kon navigatie niet opslaan. Is de site-server actief?");
    }
  };

  const handleApplyLayoutPreset = async (presetId) => {
    console.log(`🏗️ Applying layout preset: ${presetId}`);
    try {
        const dashboardPort = import.meta.env.VITE_DASHBOARD_PORT || '5001';
        const hostname = window.location.hostname;
        const res = await fetch(`http://${hostname}:${dashboardPort}/api/sites/${selectedSite.id}/apply-layout-preset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ presetId })
        });
        if (res.ok) {
            forceRefresh();
            setShowLayoutManager(false);
            alert("✨ Layout preset toegepast!");
        }
    } catch (e) { console.error(e); }
  };

  const handleEditorSave = async (newValue, newFormatting = null) => {
    if (!editingItem) return;

    const { file, index, key } = editingItem.binding;

    // Capture old value for history
    const oldValue = (siteStructure?.data?.[file] && Array.isArray(siteStructure.data[file]))
      ? siteStructure.data[file][index]?.[key]
      : siteStructure?.data?.[file]?.[key];

    pushToHistory(file, index, key, oldValue, newValue);

    // 1. Optimistic update in iframe
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({
        type: 'DOCK_UPDATE_TEXT',
        file,
        index,
        key,
        value: newValue,
        formatting: newFormatting
      }, '*');
    }

    // 2. Optimistic update in Sidebar (Local State)
    setSiteStructure(prev => {
      if (!prev) return prev;
      const newData = { ...prev.data };
      // Zorg dat we niet crashen als de structuur onverwacht anders is
      if (newData[file] && newData[file][index]) {
        // Maak een kopie van het item en update de specifieke key
        const updatedItems = [...newData[file]];
        updatedItems[index] = { ...updatedItems[index], [key]: newValue };
        newData[file] = updatedItems;
      }
      return { ...prev, data: newData };
    });

    // 3. Persist
    console.log("💾 Saving data to server...");
    await saveData(file, index, key, newValue, newFormatting);

    // We no longer force a slow iframe refresh here to avoid "flashing" and "scroll-to-top".
    // The optimistic updates above (postMessage + setSiteStructure) keep the UI in sync.
    setEditingItem(null);
  };

  // Send section move command
  const moveSection = (section, direction) => {
    console.log(`🚀 Triggering move: ${section} -> ${direction}`);
    saveSectionMove(section, direction);
  };

  const toggleSectionVisibility = (sectionId) => {
    console.log(`👁️ Toggling visibility for: ${sectionId}`);
    const settings = siteStructure?.data?.section_settings;
    if (!settings) return;

    let nextVisible = true;
    if (Array.isArray(settings)) {
      const idx = settings.findIndex(s => s.id === sectionId);
      if (idx === -1) return;
      nextVisible = settings[idx].visible === false;
      saveData('section_settings', idx, 'visible', nextVisible);
    } else {
      nextVisible = settings[sectionId]?.visible === false;
      saveData('section_settings', null, `${sectionId}.visible`, nextVisible);
    }

    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({
        type: 'DOCK_UPDATE_SECTION_VISIBILITY',
        section: sectionId,
        value: nextVisible
      }, '*');
    }
  };

  const saveSectionMove = async (key, direction) => {
    try {
      const url = getSiteApiUrl();
      if (!url) return;
      const currentOrder = siteStructure?.data?.section_order || siteStructure?.sections?.map(s => s.toLowerCase()) || [];
      const idx = currentOrder.indexOf(key.toLowerCase());
      if (idx === -1) return;

      const newOrder = [...currentOrder];
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= newOrder.length) return;

      const temp = newOrder[idx];
      newOrder[idx] = newOrder[newIdx];
      newOrder[newIdx] = temp;

      console.log(`↔️ Moving section via ${url}:`, key, direction, "New order:", newOrder);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reorder-sections',
          key,
          direction,
          value: currentOrder // Server expects currentOrder and handles move itself, OR we could just send the new order if server supported it
        })
      });

      if (response.ok) {
        // Direct feedback via postMessage
        if (iframeRef.current) {
          iframeRef.current.contentWindow.postMessage({
            type: 'DOCK_UPDATE_SECTION_ORDER',
            value: newOrder
          }, '*');
        }

        // Update local state to keep Sidebar in sync
        setSiteStructure(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            data: { ...prev.data, section_order: newOrder },
            sections: newOrder // Keep sections list in sync
          };
        });
      } else {
        console.error('❌ Move failed on server:', response.status);
      }
    } catch (err) { console.error('❌ Network error during move:', err); }
  };

  const updateLayout = async (section, layout) => {
    try {
      const url = getSiteApiUrl();
      if (!url) return;
      console.log(`📐 Updating layout for ${section} to ${layout} via ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: 'layout_settings', index: 0, key: section, value: layout })
      });
      if (response.ok) {
        console.log('✅ Layout update successful');
        // Direct feedback via postMessage
        if (iframeRef.current) {
          iframeRef.current.contentWindow.postMessage({
            type: 'DOCK_UPDATE_LAYOUT',
            section: section,
            value: layout
          }, '*');
        }

        // Update local state
        setSiteStructure(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            layouts: { ...prev.layouts, [section]: layout }
          };
        });
      } else {
        console.error('❌ Layout update failed');
      }
    } catch (err) { console.error('❌ Network error during layout update:', err); }
  };

  const addItem = async (tableName) => {
    try {
      const url = getSiteApiUrl();
      if (!url) return;
      console.log(`➕ Adding item to ${tableName} via ${url}`);

      const index = siteStructure?.data?.[tableName]?.length || 0;
      pushToHistory(tableName, index, null, null, null, 'add');

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: tableName.toLowerCase(), action: 'add' })
      });
      if (res.ok) setTimeout(forceRefresh, 300);
    } catch (err) { console.error(err); }
  };

  const pushToSheets = async () => {
    if (!selectedSite) return;

    // GOVERNANCE CHECK
    if (selectedSite.governance_mode === 'client-mode') {
      alert("🔒 CLIENT MODE ACTIVE\n\nPush to Sheet is disabled because content is managed by the client.\nPlease use the Google Sheet to update content.");
      return;
    }

    setShowSyncModal(true);
  };

  const handleSyncConfirm = async () => {
    setShowSyncModal(false);
    const siteId = typeof selectedSite === 'string' ? selectedSite : (selectedSite.id || selectedSite.name);

    // UI Feedback
    const btn = document.getElementById('cloud-sync-btn');
    const originalContent = btn ? btn.innerHTML : 'Sync to Google Sheets';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Syncing...';
    }

    try {
      const dashboardPort = import.meta.env.VITE_DASHBOARD_PORT || '5001';
      const hostname = window.location.hostname;
      const res = await fetch(`http://${hostname}:${dashboardPort}/api/sync-to-sheets/${siteId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Succesvol gesynchroniseerd naar Google Sheets!\n\nVergeet niet de site te verversen om de wijzigingen te zien.");
      } else {
        alert("❌ Sync mislukt: " + data.error + "\n\nTip: Controleer of de Sheet is 'Gepubliceerd op internet'.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Netwerkfout tijdens sync. Is de dashboard server (poort 4001) actief?");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalContent;
      }
    }
  };

  const pullFromSheets = async () => {
    if (!selectedSite) return;
    setShowPullModal(true);
  };

  const handlePullConfirm = async () => {
    setShowPullModal(false);
    const siteId = typeof selectedSite === 'string' ? selectedSite : (selectedSite.id || selectedSite.name);

    // UI Feedback
    const btn = document.getElementById('cloud-pull-btn');
    const originalContent = btn ? btn.innerHTML : 'Pull from Google Sheets';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Pulling...';
    }

    try {
      const dashboardPort = import.meta.env.VITE_DASHBOARD_PORT || '5001';
      const hostname = window.location.hostname;
      const res = await fetch(`http://${hostname}:${dashboardPort}/api/pull-from-sheets/${siteId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Data successfully pulled from Google Sheets! (Backup created in site folder)");
        forceRefresh();
      } else {
        alert("❌ Pull failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Network error during pull.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalContent;
      }
    }
  };

  const deleteItem = async (tableName, index) => {
    if (!window.confirm(`Weet je zeker dat je dit item (${index + 1}) definitief wilt verwijderen uit de sectie '${tableName}'?`)) return;
    try {
      const url = getSiteApiUrl();
      if (!url) return;
      console.log(`🗑️ Deleting item ${index} from ${tableName} via ${url}`);

      const deletedItem = siteStructure?.data?.[tableName]?.[index];
      pushToHistory(tableName.toLowerCase(), index, null, deletedItem, null, 'delete');

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: tableName.toLowerCase(), action: 'delete', index })
      });
      if (res.ok) setTimeout(forceRefresh, 300);
    } catch (err) { console.error(err); }
  };

  const handleReorderItems = async (tableName, index, direction) => {
    try {
        const url = getSiteApiUrl();
        if (!url) return;
        const items = [...(siteStructure?.data?.[tableName] || [])];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= items.length) return;

        console.log(`↔️ Reordering items in ${tableName}: ${index} -> ${newIndex}`);

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                file: tableName.toLowerCase(), 
                action: 'reorder', 
                index: index, 
                direction: direction === 1 ? 'down' : 'up' 
            })
        });

        if (res.ok) {
            // Optimistic update
            const newItems = [...items];
            [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
            setSiteStructure(prev => ({
                ...prev,
                data: { ...prev.data, [tableName]: newItems }
            }));
            
            if (iframeRef.current) {
                iframeRef.current.contentWindow.postMessage({
                    type: 'DOCK_UPDATE_DATA',
                    file: tableName,
                    data: newItems
                }, '*');
            }
        }
    } catch (err) { console.error(err); }
  };

  const handleResetAllPadding = async () => {
    try {
      const url = getSiteApiUrl();
      if (!url) return;
      
      const sections = siteStructure?.data?.section_settings || [];
      const updatedSections = sections.map(s => ({ ...s, use_custom_padding: false }));
      
      console.log(`🌀 Resetting all section padding to global...`);
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          file: 'section_settings', 
          action: 'overwrite', 
          data: updatedSections 
        })
      });
      
      if (res.ok) {
        setSiteStructure(prev => ({
          ...prev,
          data: { ...prev.data, section_settings: updatedSections }
        }));
        setTimeout(forceRefresh, 300);
      }
    } catch (err) { console.error(err); }
  };

  const onUpdateSectionSetting = (section, key, value) => {
    const settings = siteStructure?.data?.section_settings;
    if (!settings) return;

    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({ type: 'DOCK_UPDATE_SECTION_DATA', section, key, value }, '*');
    }

    if (Array.isArray(settings)) {
      const idx = settings.findIndex(s => s.id === section);
      if (idx !== -1) saveData('section_settings', idx, key, value);
    } else {
      saveData('section_settings', null, `${section}.${key}`, value);
    }
  };

  const updateFieldConfig = async (tableName, config) => {
    try {
      const url = getSiteApiUrl();
      if (!url) return;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-section-config',
          section: tableName,
          config
        })
      });
      if (res.ok) {
        // Direct feedback via postMessage
        if (iframeRef.current) {
          iframeRef.current.contentWindow.postMessage({
            type: 'DOCK_UPDATE_SECTION_CONFIG',
            file: tableName,
            config: config
          }, '*');
        }

        // Update local state
        setSiteStructure(prev => {
          if (!prev) return prev;
          const newData = { ...prev.data };
          newData.display_config = {
            ...newData.display_config,
            sections: {
              ...(newData.display_config?.sections || {}),
              [tableName]: config
            }
          };
          return { ...prev, data: newData };
        });
      }
    } catch (err) { console.error(err); }
  };

  const moveField = (tableName, field, direction) => {
    const data = siteStructure?.data || {};
    const displayConfig = data.display_config || { sections: {} };
    const sectionConfig = displayConfig.sections?.[tableName] || { visible_fields: [], hidden_fields: [] };

    let fields = [...(sectionConfig.visible_fields || [])];

    // Als de lijst leeg is, vul hem dan eerst met alle beschikbare velden van het eerste item
    if (fields.length === 0) {
      const sample = data[tableName]?.[0] || {};
      const technicalFields = ['absoluteIndex', '_hidden', 'id', 'pk', 'uuid'];
      Object.keys(sample).forEach(k => {
        if (!technicalFields.some(tf => k.toLowerCase().includes(tf)) && !k.toLowerCase().includes('foto') && !k.toLowerCase().includes('image')) {
          fields.push(k);
        }
      });
    }

    const idx = fields.indexOf(field);
    if (idx === -1) return;

    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx >= 0 && newIdx < fields.length) {
      const temp = fields[idx];
      fields[idx] = fields[newIdx];
      fields[newIdx] = temp;
      updateFieldConfig(tableName, { ...sectionConfig, visible_fields: fields });
    }
  };

  const toggleFieldVisibility = (tableName, field) => {
    const data = siteStructure?.data || {};
    const displayConfig = data.display_config || { sections: {} };
    const sectionConfig = displayConfig.sections?.[tableName] || { visible_fields: [], hidden_fields: [] };

    let visible = Array.isArray(sectionConfig.visible_fields) ? [...sectionConfig.visible_fields] : [];
    let hidden = Array.isArray(sectionConfig.hidden_fields) ? [...sectionConfig.hidden_fields] : [];

    // ONLY manage the hidden array. `visible` just manages order.
    if (hidden.includes(field)) {
      // It is currently hidden, so unhide it
      hidden = hidden.filter(f => f !== field);

      // If visible array has elements and NOT this one, we should add it so it renders
      if (visible.length > 0 && !visible.includes(field)) {
        visible.push(field);
      }
    } else {
      // It is currently visible, so hide it
      hidden.push(field);
      // We DO NOT remove it from `visible` so it retains its position if we unhide it later!
    }

    updateFieldConfig(tableName, {
      ...sectionConfig,
      visible_fields: visible,
      hidden_fields: hidden
    });
  };

  const toggleFieldInline = (tableName, field) => {
    const data = siteStructure?.data || {};
    const displayConfig = data.display_config || { sections: {} };
    const sectionConfig = displayConfig.sections?.[tableName] || { visible_fields: [], hidden_fields: [], inline_fields: [] };

    let inline = Array.isArray(sectionConfig.inline_fields) ? [...sectionConfig.inline_fields] : [];

    if (inline.includes(field)) {
      inline = inline.filter(f => f !== field);
    } else {
      inline.push(field);
    }

    updateFieldConfig(tableName, {
      ...sectionConfig,
      inline_fields: inline
    });
  };

  const handleDeploy = async () => {
    if (!selectedSite) return;
    const url = getSiteApiUrl();
    if (!url) return;

    if (!confirm(`Wil je ${selectedSite.name} nu deployen naar GitHub?\n\nDit kan even duren (aanmaken repo + pushen).`)) return;

    setIsConnected(false); // Toon even als "bezig"
    try {
      console.log(`🚀 Deploying site via ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deploy-to-github' })
      });

      const result = await response.json();
      if (result.success) {
        alert(`✅ Deployment succesvol!\n\nRepo: ${result.repoUrl}\nLive: ${result.liveUrl}\n\nDe site wordt nu gebouwd door GitHub Actions.`);
        window.location.reload();
      } else {
        alert(`❌ Deployment mislukt: ${result.error}`);
      }
    } catch (err) {
      console.error('❌ Network error during deploy:', err);
      alert('❌ Fout bij verbinden met de site server.');
    } finally {
      setIsConnected(true);
    }
  };

  const handlePush = async () => {
    setShowSaveEverythingModal(true);
  };

  const handlePullFromGitHub = async () => {
    // Geen confirm meer nodig hier, want de Modal vraagt het al.

    setIsConnected(false);
    try {
      const siteId = typeof selectedSite === 'string' ? selectedSite : (selectedSite.id || selectedSite.name);
      const dashboardPort = import.meta.env.VITE_DASHBOARD_PORT || '5001';
      const hostname = window.location.hostname;

      const res = await fetch(`http://${hostname}:${dashboardPort}/api/sites/${siteId}/safe-pull`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Succesvol bijgewerkt vanaf GitHub (Backup gemaakt)!");
        window.location.reload();
      } else {
        alert("❌ Pull mislukt: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Netwerkfout bij ophalen van GitHub.");
    } finally {
      setIsConnected(true);
    }
  };

  const executeSaveStep = async (stepId) => {
    const siteId = typeof selectedSite === 'string' ? selectedSite : (selectedSite.id || selectedSite.name);
    const dashboardPort = import.meta.env.VITE_DASHBOARD_PORT || '5001';
    const hostname = window.location.hostname;
    const siteUrl = getSiteApiUrl();

    switch (stepId) {
      case 'disk':
        // De Dock schrijft velden al direct naar disk via saveData()
        // We doen hier even een dummy delay of een "ping" naar de server
        console.log("💾 Step: Disk Save (already handled by live updates)");
        await new Promise(r => setTimeout(r, 500));
        break;

      case 'sheet':
        console.log("📊 Step: Safe Pull (Backup sheet data to temp before sync)...");
        await fetch(`http://${hostname}:${dashboardPort}/api/sites/${siteId}/pull-to-temp`, { method: 'POST' });

        console.log("📊 Step: Sync to Google Sheets...");
        const sheetRes = await fetch(`http://${hostname}:${dashboardPort}/api/sites/${siteId}/sync-to-sheet`, { method: 'POST' });
        const sheetData = await sheetRes.json();
        if (!sheetData.success) throw new Error(sheetData.error || "Sheet sync failed");
        break;

      case 'github':
        console.log("🚀 Step: Push to GitHub...");
        const pushRes = await fetch(siteUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'deploy-to-github', commitMsg: "Update via Athena Multi-Save" })
        });
        const pushData = await pushRes.json();
        if (!pushData.success) throw new Error(pushData.error || "GitHub push failed");
        break;
    }
  };

  // Vite preview server verwacht de projectnaam als base path
  const siteUrl = selectedSite?.url ? `${selectedSite.url}${selectedSite.url.includes('?') ? '&' : '?'}t=${refreshKey}` : null;

  return (
    <div className="dock-container h-screen flex flex-col bg-slate-100">
      {/* ... header remains same ... */}
      <header className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between shadow-lg z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Dock</h1>
          <SiteSelector
            selectedSite={selectedSite}
            onSelectSite={setSelectedSite}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button
              onClick={undo}
              disabled={historyIndex < 0}
              className={`px-3 py-1.5 rounded text-xs flex items-center gap-1 transition-all ${historyIndex < 0 ? 'text-slate-600 cursor-not-allowed' : 'text-white hover:bg-slate-700'}`}
              title="Undo (Ctrl+Z)"
            >
              <i className="fa-solid fa-rotate-left"></i>
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1 self-center"></div>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className={`px-3 py-1.5 rounded text-xs flex items-center gap-1 transition-all ${historyIndex >= history.length - 1 ? 'text-slate-600 cursor-not-allowed' : 'text-white hover:bg-slate-700'}`}
              title="Redo (Ctrl+Y)"
            >
              <i className="fa-solid fa-rotate-right"></i>
            </button>
          </div>

          <button
            onClick={forceRefresh}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-xs text-white rounded shadow border border-slate-600"
            title="Herlaad de website-weergave in het midden van het scherm. Gebruik dit als wijzigingen niet direct zichtbaar zijn."
          >
            ⟳
          </button>

          {selectedSite && (
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700 gap-1">
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-[9px] text-white rounded font-bold flex flex-col items-center justify-center gap-0.5 transition-all min-w-[51px]"
                title="Open de lokale werkversie van deze website in een nieuw browsertabblad."
              >
                <i className="fa-solid fa-laptop-code text-[12px]"></i>
                <span className="leading-none">Preview</span>
              </a>

              {selectedSite.liveUrl && (
                <a
                  href={selectedSite.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-green-600 hover:bg-green-500 text-[9px] text-white rounded font-bold flex flex-col items-center justify-center gap-0.5 transition-all min-w-[51px]"
                  title="Open de live productie website die voor iedereen op internet zichtbaar is."
                >
                  <i className="fa-solid fa-globe text-[12px]"></i>
                  <span className="leading-none">Live</span>
                </a>
              )}

              {selectedSite.repoUrl ? (
                <>
                  <button
                    onClick={handlePullFromGitHub}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-[10px] text-white rounded font-bold flex items-center gap-1 transition-all"
                    title="Haal de nieuwste wijzigingen op van de GitHub-cloud (Source of Truth)."
                  >
                    <i className="fa-solid fa-cloud-arrow-down"></i> Sync from GitHub
                  </button>
                  <button
                    onClick={handlePush}
                    className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-[10px] text-white rounded font-bold flex items-center gap-1 transition-all"
                    title="Open de Multi-Save (Save 3) om alles in één keer te bewaren en te publiceren."
                  >
                    <i className="fa-solid fa-cloud-arrow-up"></i> SAVE & PUBLISH
                  </button>
                  <a
                    href={selectedSite.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-[10px] text-white rounded font-bold flex items-center gap-1 transition-all"
                    title="Bekijk de technische broncode op GitHub."
                  >
                    <i className="fa-brands fa-github"></i>
                  </a>
                </>
              ) : (
                <button
                  onClick={handleDeploy}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-[10px] text-white rounded font-bold flex items-center gap-1 transition-all"
                  title="Deploy naar GitHub voor de eerste keer."
                >
                  <i className="fa-solid fa-cloud-arrow-up"></i> Deploy to GitHub
                </button>
              )}
            </div>
          )}

          {isConnected ? (
            <span className="flex items-center gap-2 text-green-400" title="De Dock is verbonden met de website en klaar voor bewerkingen.">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-2 text-amber-400" title="De Dock probeert verbinding te maken met de website server...">
              <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
              Connecting...
            </span>
          )}

          <button
            onClick={() => setShowHelpModal(true)}
            className="w-8 h-8 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center text-sm transition-all shadow-lg shadow-blue-500/20"
            title="Open het Save & Publish Protocol — uitleg over hoe je wijzigingen opslaat, synchroniseert en publiceert."
          >
            <i className="fa-solid fa-question"></i>
          </button>
        </div>
      </header>

      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}

      {/* Main Dock Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Shared container for Design Controls & Section Manager */}
        <aside
          style={{ width: `${showSectionManager ? middleWidth : leftWidth}px` }}
          className={`bg-slate-50 border-r border-slate-300 overflow-y-auto relative flex-shrink-0 shadow-inner z-40 ${isDragging ? '' : 'transition-[width] duration-300 ease-in-out'}`}
        >
          {showSectionManager ? (
            <SectionManagerPanel
              width={middleWidth}
              siteStructure={siteStructure}
              onClose={() => setShowSectionManager(false)}
              onMoveSection={moveSection}
              onToggleSection={toggleSectionVisibility}
              onUpdateLayout={updateLayout}
              onUpdateSectionSetting={onUpdateSectionSetting}
              onAddItem={addItem}
              onDeleteItem={deleteItem}
              onMoveField={moveField}
              onToggleField={toggleFieldVisibility}
              onToggleInline={toggleFieldInline}
              onOpenLayoutManager={() => setShowLayoutManager(true)}
              onOpenNavigationManager={() => setShowNavigationManager(true)}
              onAIRedesign={handleAIRedesign}
              onDuplicateSection={handleDuplicateSection}
              onRenameSection={handleRenameSection}
              onReorderItems={handleReorderItems}
            />
          ) : (
            <DesignControls
              onColorChange={updateColor}
              siteStructure={siteStructure}
              onOpenSectionManager={() => setShowSectionManager(true)}
              currentPath={currentPath}
              pages={pages}
              onNavigate={handleNavigate}
              isSectionManagerOpen={false}
            />
          )}

          {/* Context-aware Resizer */}
          <div
            onMouseDown={() => {
              if (showSectionManager) isResizingMiddle.current = true;
              else isResizingLeft.current = true;
              document.body.classList.add('select-none');
            }}
            className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-50 border-r border-slate-300"
            title="Sleep naar links of rechts om het zijpaneel groter of kleiner te maken."
          />
        </aside>

        {/* Center - Site Preview in Iframe */}
        <main className="flex-1 bg-slate-300 p-4 lg:p-6 flex items-center justify-center relative min-w-0">
          <div className="h-full w-full bg-white rounded shadow-2xl overflow-hidden relative border border-slate-400" title="Interactieve weergave van je website. Klik op tekst of afbeeldingen om ze aan te passen.">
            <iframe
              key={refreshKey}
              ref={iframeRef}
              src={siteUrl}
              className="w-full h-full border-0"
              title="Site Preview"
              onLoad={() => setIsConnected(false)}
            />
          </div>

          {editingItem && (
            <VisualEditor
              key={`${editingItem.binding?.file || 'file'}-${editingItem.binding?.key || 'key'}-${editingItem.binding?.index || 0}`}
              item={editingItem}
              siteStructure={siteStructure}
              selectedSite={selectedSite}
              onSave={handleEditorSave}
              onCancel={() => setEditingItem(null)}
              onUpload={(filename) => handleEditorSave(filename)}
            />
          )}

          {showLayoutManager && (
            <LayoutManager 
              sectionOrder={siteStructure?.sections}
              sectionSettings={siteStructure?.data?.section_settings}
              onReorder={(newOrder) => {
                  setSiteStructure(prev => ({ ...prev, sections: newOrder }));
                  // Server save logic (if needed) ...
              }}
              onDelete={(id) => deleteSection(id)}
              onDuplicate={(id) => handleDuplicateSection(id)}
              onToggleVisibility={(id) => toggleSectionVisibility(id)}
              layouts={siteStructure?.layouts}
              onUpdateLayout={updateLayout}
              onClose={() => setShowLayoutManager(false)}
              onApplyPreset={handleApplyLayoutPreset}
            />
          )}

          {showNavigationManager && (
            <NavigationManager 
              navigationData={siteStructure?.data?.navbar || siteStructure?.data?.navigation || []}
              onClose={() => setShowNavigationManager(false)}
              onSave={handleNavigationSave}
            />
          )}

          {fieldConfigItem && (
            <FieldConfigModal 
              item={fieldConfigItem}
              onClose={() => setFieldConfigItem(null)}
              onSave={(newConfig) => {
                updateFieldConfig(fieldConfigItem.name, newConfig);
                setFieldConfigItem(null);
              }}
            />
          )}

          {sectionDesignItem && (
            <SectionDesignModal 
              item={sectionDesignItem}
              onClose={() => setSectionDesignItem(null)}
              onSave={(newSettings) => {
                // ... handle save ...
                setSectionDesignItem(null);
              }}
              onAIRedesign={handleAIRedesign}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default DockFrame;
