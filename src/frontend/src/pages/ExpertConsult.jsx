import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { chatWithBot, getFAQ } from '../services/api';
import './ExpertConsult.css';

/* parse **bold** → <strong> */
function renderMarkdown(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

/* render message text with line-breaks */
function MessageText({ text }) {
  return (
    <span className="ec-msg-text">
      {text.split('\n').map((line, i, arr) => (
        <React.Fragment key={i}>
          {renderMarkdown(line)}
          {i < arr.length - 1 && <br />}
        </React.Fragment>
      ))}
    </span>
  );
}

/* ── Typing indicator ── */
function TypingIndicator() {
  return (
    <div className="ec-msg-row ec-msg-row--bot">
      <div className="ec-avatar">✨</div>
      <div className="ec-bubble ec-bubble--bot ec-typing">
        <span className="ec-dot" />
        <span className="ec-dot" />
        <span className="ec-dot" />
      </div>
    </div>
  );
}

/* ── Single chat message ── */
function ChatMessage({ msg }) {
  const isBot = msg.role === 'bot';

  if (msg.isPathology) {
    return (
      <div className="ec-msg-row ec-msg-row--bot animate-fadeIn">
        <div className="ec-avatar" style={{ background: '#DC2626', color: '#FFF' }}>🚨</div>
        <div className="ec-bubble ec-bubble--pathology" style={{
          background: '#FFF5F5',
          border: '1.5px solid #FEB2B2',
          borderRadius: '18px',
          borderTopLeftRadius: '4px',
          padding: '18px 22px',
          color: '#9B2C2C',
          maxWidth: '85%'
        }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#C53030', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span> PHÁT HIỆN DẤU HIỆU BỆNH LÝ DA LIỄU PHỨC TẠP
          </div>
          <div style={{ color: '#4A5568', lineHeight: '1.6', fontSize: '0.95rem', marginBottom: '12px' }}>
            <MessageText text={msg.text} />
          </div>
          {msg.suggestedAction && (
            <div style={{ background: '#FFF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #FEB2B2', marginBottom: '14px', fontSize: '0.9rem', color: '#2D3748' }}>
              <strong>Hướng dẫn an toàn khẩn cấp:</strong> {msg.suggestedAction}
            </div>
          )}
          <a
            href={msg.zaloDeepLink || 'https://zalo.me/0908123456'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0068FF',
              color: '#FFF',
              padding: '10px 20px',
              borderRadius: '10px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0, 104, 255, 0.25)'
            }}
          >
            <span>💬</span> Mở Zalo Chat 1-1 Với Bác Sĩ Da Liễu Ngay
          </a>
          <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '8px' }}>
            Bác sĩ chuyên khoa trực tuyến 8:00 - 22:00 hằng ngày • Hoàn toàn bảo mật
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ec-msg-row ${isBot ? 'ec-msg-row--bot' : 'ec-msg-row--user'} animate-fadeIn`}>
      {isBot && <div className="ec-avatar">✨</div>}
      <div className={`ec-bubble ${isBot ? 'ec-bubble--bot' : 'ec-bubble--user'}`}>
        <MessageText text={msg.text} />
      </div>
      {!isBot && <div className="ec-avatar ec-avatar--user">👤</div>}
    </div>
  );
}

/* ── Chat tab component ── */
function ChatTab({ user }) {
  const { t } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  /* Initialize welcome message in correct language on mount or language change */
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'bot',
        text: t('consult_welcome'),
        ts: Date.now(),
      }
    ]);
  }, [t]);

  const QUICK_REPLIES = [
    { label: t('skin_type_oily'), text: t('consult_quick_oily') },
    { label: t('skin_type_dry'), text: t('consult_quick_dry') },
    { label: t('quiz_concern_acne', 'Trị mụn'), text: t('consult_quick_acne') },
    { label: t('quiz_concern_aging', 'Lão hóa'), text: t('consult_quick_aging') },
    { label: 'Routine', text: t('consult_quick_routine') },
    { label: '🚨 Ca kích ứng / Bệnh lý (Zalo)', text: 'Da tôi bị viêm đỏ mưng mủ nặng sau khi dùng kem trộn có corticoid' },
  ];

  /* Auto-scroll ONLY inside the chat container when new messages arrive.
     Never scroll the whole browser window on page load. */
  useEffect(() => {
    if (messages.length > 1 && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg = { id: Date.now(), role: 'user', text: trimmed, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const userId = user?.user_id || 'guest';
      const res = await chatWithBot({ message: trimmed, user_id: userId });
      const botText = res.data?.bot_response || res.data?.reply || res.data?.message || t('consult_error_reply');
      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        text: botText,
        isPathology: res.data?.is_pathology,
        zaloDeepLink: res.data?.zalo_deep_link,
        suggestedAction: res.data?.suggested_action,
        ts: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const errMsg = {
        id: Date.now() + 1,
        role: 'bot',
        text: t('consult_error_conn'),
        ts: Date.now(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  }, [isTyping, user, t]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="ec-chat-wrapper">
      {/* Zalo Dermatologist Direct Header */}
      <div style={{
        background: '#FAF7F2',
        borderBottom: '1px solid var(--border-subtle, #E5E0D8)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary, #4A3728)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary, #2A2521)' }}>Lumi — Trợ Lý Da Liễu AI (Gemini + Rules)</div>
            <div style={{ fontSize: '0.75rem', color: '#2E6F4E', fontWeight: 600 }}>● Đang trực tuyến (Tư vấn cá nhân hóa)</div>
          </div>
        </div>
        <a
          href="https://zalo.me/0908123456"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#0068FF',
            color: '#FFF',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0, 104, 255, 0.2)'
          }}
        >
          <span>💬</span> Kết Nối Chuyên Gia Da Liễu Zalo 1-1
        </a>
      </div>

      {/* Message history */}
      <div
        ref={messagesContainerRef}
        className="ec-messages"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map(msg => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        {isTyping && <TypingIndicator />}
      </div>

      {/* Quick replies */}
      <div className="ec-quick-replies" aria-label="Quick reply suggestions">
        {QUICK_REPLIES.map(qr => (
          <button
            key={qr.label}
            className="ec-quick-btn"
            onClick={() => sendMessage(qr.text)}
            disabled={isTyping}
            aria-label={`Quick reply: ${qr.label}`}
          >
            {qr.label}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form
        className="ec-input-bar"
        onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
        aria-label="Message input"
      >
        <input
          ref={inputRef}
          className="ec-input"
          type="text"
          placeholder={t('consult_placeholder')}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
          aria-label="Type your message"
          autoComplete="off"
        />
        <button
          type="submit"
          className="ec-send-btn btn btn-primary"
          disabled={isTyping || !input.trim()}
          aria-label="Send message"
        >
          <span className="ec-send-icon"></span>
          <span>{t('consult_send')}</span>
        </button>
      </form>
    </div>
  );
}

/* ── FAQ accordion item ── */
function FAQItem({ item, index }) {
  const [open, setOpen] = useState(false);
  const answerId = `faq-answer-${index}`;
  const btnId = `faq-btn-${index}`;

  return (
    <div className={`ec-faq-item ${open ? 'ec-faq-item--open' : ''}`}>
      <button
        id={btnId}
        className="ec-faq-question"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={answerId}
      >
        <span className="ec-faq-icon">
          {open ? '−' : '+'}
        </span>
        <span className="ec-faq-q-text">{item.question}</span>
        <span className="ec-faq-chevron" aria-hidden="true">
          {open ? '▲' : '▼'}
        </span>
      </button>
      <div
        id={answerId}
        role="region"
        aria-labelledby={btnId}
        className="ec-faq-answer-wrapper"
      >
        <div className="ec-faq-answer">
          <MessageText text={item.answer} />
        </div>
      </div>
    </div>
  );
}

/* ── FAQ tab component ── */
function FAQTab() {
  const { t } = useApp();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFAQ()
      .then(res => {
        if (!cancelled) setFaqs(res.data?.faqs || res.data || []);
      })
      .catch(() => {
        if (!cancelled) setError(t('consult_faq_error'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [t]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <span>{t('consult_faq_loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h3>{error}</h3>
        <p>{t('consult_faq_error_desc')}</p>
      </div>
    );
  }

  if (faqs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">💬</div>
        <h3>{t('consult_faq_empty')}</h3>
        <p>{t('consult_faq_empty_desc')}</p>
      </div>
    );
  }

  return (
    <div className="ec-faq-list" role="list">
      {faqs.map((item, idx) => (
        <FAQItem key={item.id ?? idx} item={item} index={idx} />
      ))}
    </div>
  );
}

/* ── ExpertConsult page root ── */
export default function ExpertConsult() {
  const { user, t } = useApp();
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="ec-page">
      {/* Hero header */}
      <div className="ec-hero">
        <div className="container">
          <div className="ec-hero-inner">
            <div className="ec-hero-badge badge badge-primary">AI Powered</div>
            <h1 className="ec-hero-title display-font">
              {t('nav_consult')}
            </h1>
            <p className="ec-hero-sub">
              {t('home_expert_desc')}
            </p>
          </div>
        </div>
      </div>

      <div className="container ec-container">
        {/* Tab switcher */}
        <div className="ec-tab-bar" role="tablist" aria-label="Consultation tabs">
          <div className="tabs">
            <button
              role="tab"
              id="tab-chat"
              aria-selected={activeTab === 'chat'}
              aria-controls="panel-chat"
              className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              💬 {t('consult_chat_tab')}
            </button>
            <button
              role="tab"
              id="tab-faq"
              aria-selected={activeTab === 'faq'}
              aria-controls="panel-faq"
              className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              ❓ FAQ
            </button>
          </div>
        </div>

        {/* Tab panels */}
        <div
          id="panel-chat"
          role="tabpanel"
          aria-labelledby="tab-chat"
          hidden={activeTab !== 'chat'}
          className="ec-panel"
        >
          <div className="ec-chat-card glass-card">
            {/* Chat header */}
            <div className="ec-chat-header">
              <div className="ec-bot-avatar">✨</div>
              <div className="ec-chat-header-info">
                <h3 className="ec-chat-title">BeautyAI Assistant</h3>
                <span className="ec-chat-status">
                  <span className="ec-status-dot" aria-hidden="true" />
                  {t('consult_ready')}
                </span>
              </div>
            </div>
            <ChatTab user={user} />
          </div>
        </div>

        <div
          id="panel-faq"
          role="tabpanel"
          aria-labelledby="tab-faq"
          hidden={activeTab !== 'faq'}
          className="ec-panel"
        >
          <div className="ec-faq-header">
            <h2 className="ec-faq-title">{t('sc_faq_title')}</h2>
            <p className="ec-faq-subtitle">
              {t('consult_faq_empty_desc')}
            </p>
          </div>
          <FAQTab />
        </div>
      </div>
    </div>
  );
}
