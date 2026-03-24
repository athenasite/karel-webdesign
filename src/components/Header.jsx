import React, { useState } from 'react';
import EditableText from './EditableText';
import EditableMedia from './EditableMedia';
import EditableLink from './EditableLink';
import { Link } from 'react-router-dom';

function Header({ siteSettings = {}, navigationData = [] }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const settings = Array.isArray(siteSettings) ? (siteSettings[0] || {}) : (siteSettings || {});
  const siteName = settings.site_name || 'Karel Webdesign';
  const logoChar = (settings.logo_text || siteName).charAt(0).toUpperCase();

  // Use a reliable default logo if site_logo_image is missing
  const displayLogo = settings.site_logo_image || "athena-icon.svg";

  const handleScroll = (e, url) => {
    setIsMenuOpen(false); // Close menu on click
    if (url && url.startsWith('#')) {
      e.preventDefault();
      const targetId = url.substring(1);
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = Array.isArray(navigationData) ? navigationData : [];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[1000] px-6 transition-all duration-500 flex items-center"
      style={{
        display: settings.header_visible === false ? 'none' : 'flex',
        backgroundColor: 'var(--header-bg, var(--color-header-bg, rgba(255,255,255,0.9)))',
        backdropFilter: 'var(--header-blur, blur(16px))',
        height: 'var(--header-height, 80px)',
        borderBottom: 'var(--header-border, none)'
      }}
    >
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
        {/* Logo & Identity */}
        {(settings.header_show_logo !== false || settings.header_show_title !== false) && (
          <Link to="/" className="flex items-center gap-4 group" onClick={() => setIsMenuOpen(false)}>

            {settings.header_show_logo !== false && (
              <div className="relative w-12 h-12 overflow-hidden transition-transform duration-500">
                <EditableMedia
                  src={displayLogo}
                  cmsBind={{ file: 'site_settings', index: 0, key: 'site_logo_image' }}
                  className="w-full h-full object-contain"
                  fallback={logoChar}
                />
              </div>
            )}

            <div className="flex flex-col">
              {settings.header_show_title !== false && (
                <span className="text-2xl font-serif font-black tracking-tight text-primary leading-none mb-1">
                  <EditableText value={siteName} cmsBind={{ file: 'site_settings', index: 0, key: 'site_name' }} />
                </span>
              )}
              {settings.header_show_tagline !== false && settings.tagline && (
                <span className="text-[10px] uppercase tracking-[0.3em] text-accent font-bold opacity-80">
                  <EditableText value={settings.tagline} cmsBind={{ file: 'site_settings', index: 0, key: 'tagline' }} />
                </span>
              )}
            </div>
          </Link>
        )}

        {/* Desktop Action Menu */}
        <div className="hidden md:flex items-center gap-8">
          {/* Dynamic Navigation Links */}
          {navLinks.length > 0 && (
            <div className="flex gap-6 items-center mr-4">
              {navLinks.map((link, idx) => (
                <EditableLink
                  key={idx}
                  label={link.label}
                  url={link.url}
                  cmsBind={{ file: 'navigation', index: idx, key: 'label' }}
                  className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                  onClick={(e) => handleScroll(e, link.url)}
                />
              ))}
            </div>
          )}

          {settings.header_show_button !== false && (
            <EditableLink
              as="button"
              label={settings.header_cta_label || "Contact"}
              url={settings.header_cta_url || "#contact"}
              table="site_settings"
              field="header_cta"
              id={0}
              className="bg-[var(--color-button-bg)] text-white px-6 py-3 rounded-[var(--button-radius,9999px)] font-bold hover:opacity-90 transition-all shadow-lg"
              onClick={(e) => handleScroll(e, settings.header_cta_url || "#contact")}
            />
          )}
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
      <div className={`fixed inset-x-0 top-[var(--header-height,80px)] bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-xl md:hidden transition-all duration-300 ease-in-out origin-top ${isMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}`}>
        <div className="p-6 flex flex-col gap-4">
          <Link to="/" className="text-lg font-bold text-primary py-2 border-b border-slate-50 dark:border-slate-800" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>

          {/* Mobile Navigation Links */}
          {navLinks.map((link, idx) => (
            <EditableLink
              key={`mob-${idx}`}
              label={link.label}
              url={link.url}
              cmsBind={{ file: 'navigation', index: idx, key: 'label' }}
              className="text-lg font-bold text-slate-600 dark:text-slate-300 py-2 border-b border-slate-50 dark:border-slate-800"
              onClick={(e) => handleScroll(e, link.url)}
            />
          ))}

          {settings.header_show_button !== false && (
            <EditableLink
              as="button"
              label={settings.header_cta_label || "Contact"}
              url={settings.header_cta_url || "#contact"}
              table="site_settings"
              field="header_cta"
              id={0}
              className="w-full bg-[var(--color-button-bg)] text-white px-6 py-3 rounded-[var(--button-radius,9999px)] font-bold hover:opacity-90 transition-all text-center mt-4 shadow-lg"
              onClick={(e) => handleScroll(e, settings.header_cta_url || "#contact")}
            />
          )}
        </div>
      </div>
    </nav>
  );
}

export default Header;