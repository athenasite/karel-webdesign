import React, { useState } from 'react';
import EditableText from './EditableText';
import EditableMedia from './EditableMedia';
import EditableLink from './EditableLink';
import { Link } from 'react-router-dom';

function Header({ siteSettings = {}, headerSettings = {}, headerData = [], navData = [] }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const settings = Array.isArray(siteSettings) ? (siteSettings[0] || {}) : (siteSettings || {});
  const hSettings = Array.isArray(headerSettings) ? (headerSettings[0] || {}) : (headerSettings || {});
  const hData = Array.isArray(headerData) ? (headerData[0] || {}) : (headerData || {});

  const siteName = hData.titel || settings.site_name || 'De Schaar Site';
  const tagline = hData.tagline || settings.tagline;
  const logoChar = (settings.logo_text || siteName).charAt(0).toUpperCase();

  // Use a reliable default logo if site_logo_image is missing
  const displayLogo = hData.logo || settings.site_logo_image || "athena-icon.svg";

  const handleScroll = (e, url) => {
    setIsMenuOpen(false); 
    let targetUrl = typeof url === 'object' ? url?.url : url;
    
    if (!targetUrl) return;

    // v8.9.3: Auto-handle anchors even if they don't start with '#'
    // If it doesn't look like a full URL or a root path, and doesn't have a hash, assume it's an anchor
    if (!targetUrl.startsWith('#') && !targetUrl.startsWith('http') && !targetUrl.startsWith('/')) {
        targetUrl = '#' + targetUrl;
    }
    
    if (targetUrl.startsWith('#')) {
      e.preventDefault();
      const targetId = targetUrl.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        const offset = 80; // Header height
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Update URL hash without jumping
        window.history.pushState(null, null, targetUrl);
      } else {
        if (targetId === 'footer') {
           window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
      }
    }
  };

  const navLinks = Array.isArray(navData) ? navData : [];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[1000] px-6 transition-all duration-500 flex items-center shadow-sm"
      style={{
        display: (hSettings.header_visible === false || hSettings.header_zichtbaar === false) ? 'none' : 'flex',
        backgroundColor: 'var(--header-bg, var(--color-header-bg, rgba(255,255,255,0.95)))',
        backdropFilter: 'var(--header-blur, blur(16px))',
        height: 'var(--header-height, 80px)',
        borderBottom: 'var(--header-border, none)'
      }}
    >
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
        {/* Logo & Identity */}
        <Link 
          to="/" 
          className="flex items-center gap-4 group" 
          onClick={(e) => {
            e.preventDefault();
            setIsMenuOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Remove hash from URL without reloading
            window.history.pushState("", document.title, window.location.pathname + window.location.search);
          }}
        >
          {settings.header_show_logo !== false && settings.toon_logo !== false && (
            <div className="relative w-12 h-12 overflow-hidden transition-transform duration-500">
            <EditableMedia
              src={displayLogo}
              cmsBind={{ file: 'header', index: 0, key: 'logo' }}
              className="w-full h-full object-contain"
              fallback={logoChar}
            />
          </div>
          )}

          <div className="flex flex-col">
            <span className="text-2xl font-serif font-black tracking-tight text-primary leading-none mb-1">
              <EditableText value={siteName} cmsBind={{ file: 'header', index: 0, key: 'titel' }} />
            </span>
            {tagline && (
              <span className="text-[10px] uppercase tracking-[0.3em] text-accent font-bold opacity-80">
                <EditableText value={tagline} cmsBind={{ file: 'header', index: 0, key: 'tagline' }} />
              </span>
            )}
          </div>
        </Link>

        {/* Desktop Action Menu */}
        <div className="hidden md:flex items-center gap-8">
          {/* Dynamic Navigation Links */}
          {navLinks.length > 0 && (
            <div className="flex gap-6 items-center mr-4">
              {navLinks.map((link, idx) => {
                const navLabel = link.label || link.titel || (typeof link.titel_navigatie === 'object' ? link.titel_navigatie?.text : link.titel_navigatie);
                const navUrl = link.url || (link.slug ? `#${link.slug}` : '');
                if (!navLabel) return null;
                
                return (
                  <EditableLink
                    key={idx}
                    label={navLabel}
                    url={navUrl}
                    cmsBind={{ file: 'navbar', index: idx, key: 'label' }}
                    className="text-sm font-bold text-[var(--color-text)] hover:text-primary transition-colors"
                    onClick={(e) => handleScroll(e, navUrl)}
                  />
                );
              })}
            </div>
          )}

          <EditableLink
            as="button"
            url={hData.knop}
            cmsBind={{ file: 'header', index: 0, key: 'knop' }}
            className="bg-[var(--color-button,var(--color-primary))] text-white px-6 py-3 rounded-[var(--button-radius,9999px)] font-bold hover:opacity-90 transition-all shadow-lg"
            onClick={(e) => handleScroll(e, hData.knop)}
          />
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-2xl text-primary p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-x-0 top-[var(--header-height,80px)] border-b border-slate-100 dark:border-slate-800 shadow-xl md:hidden transition-all duration-300 ease-in-out origin-top ${isMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}`}
        style={{ backgroundColor: 'var(--color-menu-bg, white)' }}
      >
        <div className="p-6 flex flex-col gap-4">
          <Link to="/" className="text-lg font-bold text-primary py-2 border-b border-slate-50 dark:border-slate-800" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>

          {/* Mobile Navigation Links */}
          {navLinks.map((link, idx) => {
            const navLabel = link.label || link.titel || (typeof link.titel_navigatie === 'object' ? link.titel_navigatie?.text : link.titel_navigatie);
            const navUrl = link.url || (link.slug ? `#${link.slug}` : '');
            if (!navLabel) return null;

            return (
              <EditableLink
                key={`mob-${idx}`}
                label={navLabel}
                url={navUrl}
                cmsBind={{ file: 'navbar', index: idx, key: 'label' }}
                className="text-lg font-bold text-[var(--color-text)] py-2 border-b border-slate-50 dark:border-slate-800"
                onClick={(e) => handleScroll(e, navUrl)}
              />
            );
          })}

          <EditableLink
            as="button"
            url={hData.knop}
            cmsBind={{ file: 'header', index: 0, key: 'knop' }}
            className="w-full bg-[var(--color-button,var(--color-primary))] text-white px-6 py-3 rounded-[var(--button-radius,9999px)] font-bold hover:opacity-90 transition-all text-center mt-4 shadow-lg"
            onClick={(e) => handleScroll(e, hData.knop)}
          />
        </div>
      </div>
    </nav>
  );
}

export default Header;