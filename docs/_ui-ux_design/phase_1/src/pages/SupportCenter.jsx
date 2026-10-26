import React, { useState, useEffect } from 'react';
import { getFAQ, submitContact } from '../services/api';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';
import { HelpCircle, ChevronDown, ChevronUp, Mail, Phone, MapPin, Send } from 'lucide-react';
import './SupportCenter.css';

export default function SupportCenter() {
  const { t, lang } = useApp();
  const [faqs, setFaqs] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    getFAQ()
      .then(res => setFaqs(res.data.faqs || []))
      .catch(() => setFaqs([]));
  }, [lang]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error(t('checkout_err_missing', 'Vui lòng nhập đầy đủ thông tin'));
      return;
    }
    setLoading(true);
    try {
      const res = await submitContact(formData);
      toast.success(res.data.message || t('sc_contact_success', 'Gửi liên hệ thành công! 💌'));
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      toast.error(t('sc_contact_failed', 'Gửi liên hệ thất bại. Vui lòng thử lại sau.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="sc-page animate-fadeIn">
      <div className="container">
        <div className="sc-hero">
          <h1 className="section-title display-font">{t('sc_title')}</h1>
          <p className="section-subtitle">{t('sc_subtitle')}</p>
        </div>

        <div className="sc-grid">
          {/* FAQs */}
          <div className="sc-section">
            <h2 className="sc-section-title">
              <HelpCircle size={22} color="var(--primary-light)" />
              {t('sc_faq_title')}
            </h2>
            <div className="sc-faq-list">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`glass-card sc-faq-item ${openFaq === index ? 'sc-faq-open' : ''}`}
                  onClick={() => toggleFaq(index)}
                >
                  <div className="sc-faq-question">
                    <h4 className="sc-faq-text">{faq.question}</h4>
                    {openFaq === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                  {openFaq === index && (
                    <div className="sc-faq-answer">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form & Info */}
          <div className="sc-contact-col">
            {/* Info */}
            <div className="glass-card sc-contact-info">
              <h3 className="sc-contact-heading">{t('sc_contact_title')}</h3>
              <div className="sc-contact-items">
                <div className="sc-contact-item">
                  <MapPin size={18} color="var(--primary-light)" />
                  <span>{t('footer_contact_address')}</span>
                </div>
                <div className="sc-contact-item">
                  <Phone size={18} color="var(--primary-light)" />
                  <span>+84 123 456 789</span>
                </div>
                <div className="sc-contact-item">
                  <Mail size={18} color="var(--primary-light)" />
                  <span>support@beautyai.vn</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="glass-card sc-form-card">
              <h3 className="sc-contact-heading">{t('sc_message_title')}</h3>
              <form onSubmit={handleSubmit} className="sc-form">
                <div className="form-group">
                  <label className="form-label">{t('sc_contact_name')}</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('sc_contact_email')}</label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('sc_contact_subject')}</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('sc_contact_message')}</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary sc-submit-btn"
                  disabled={loading}
                >
                  <Send size={16} /> {loading ? t('sc_sending') : t('sc_send_btn')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
