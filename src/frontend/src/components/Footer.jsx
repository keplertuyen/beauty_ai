import React from 'react';
import { Link } from 'react-router-dom';
import {
  Droplets, Mail, Phone, MapPin, Heart,
  Package, FlaskConical, Layers, GitCompare,
  MessageSquare, LifeBuoy, ClipboardList
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Footer.css';

export default function Footer() {
  const { t } = useApp();

  return (
    <footer className="footer">
      <div className="footer-inner container">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <div className="logo-icon">
              <Droplets size={18} />
            </div>
            <span className="logo-text">
              Beauty<span className="logo-accent">AI</span>
            </span>
          </Link>
          <p className="footer-desc">
            {t('footer_desc')}
          </p>
          <div className="footer-socials">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0 -5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4 className="footer-title">{t('nav_explore')}</h4>
          <ul className="footer-links">
            <li><Link to="/products"><Package size={14} />{t('nav_products')}</Link></li>
            <li><Link to="/skin-quiz"><FlaskConical size={14} />{t('nav_skin_quiz')}</Link></li>
            <li><Link to="/ingredient-analyzer"><Layers size={14} />{t('nav_ingredient')}</Link></li>
            <li><Link to="/compare"><GitCompare size={14} />{t('nav_compare')}</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-title">{t('nav_support')}</h4>
          <ul className="footer-links">
            <li><Link to="/expert-consult"><MessageSquare size={14} />{t('nav_consult')}</Link></li>
            <li><Link to="/support"><LifeBuoy size={14} />{t('nav_support_center')}</Link></li>
            <li><Link to="/profile"><ClipboardList size={14} />{t('nav_my_orders')}</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-title">{t('sc_contact_title')}</h4>
          <ul className="footer-contact">
            <li>
              <MapPin size={16} />
              <span>{t('footer_contact_address')}</span>
            </li>
            <li>
              <Phone size={16} />
              <span>+84 123 456 789</span>
            </li>
            <li>
              <Mail size={16} />
              <span>support@beautyai.vn</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="copyright">
            © {new Date().getFullYear()} BeautyAI. {t('footer_rights')}
          </p>
          <p className="made-with">
            {t('footer_made_with')} <Heart size={12} className="heart-icon" /> {t('footer_by')}
          </p>
        </div>
      </div>
    </footer>
  );
}
