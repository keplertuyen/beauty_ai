import React, { useState } from 'react';
import { ShieldCheck, Sparkles, X, Plus, CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateSkinProfile, getMe } from '../services/api';
import { useApp } from '../context/AppContext';

const SKIN_TYPES = [
  { key: 'Combination', label: 'Combination', desc: 'Oily T-zone with normal or dry cheeks' },
  { key: 'Oily', label: 'Oily', desc: 'Excess shine, visible pores, blemish-prone' },
  { key: 'Dry', label: 'Dry', desc: 'Tight feel, flaky patches, craves rich moisture' },
  { key: 'Sensitive', label: 'Sensitive', desc: 'Easily flushed or reactive to fragrance/actives' },
  { key: 'Normal', label: 'Normal', desc: 'Balanced hydration and resilient barrier' },
];

const COMMON_ALLERGENS = [
  'Fragrance',
  'Alcohol Denat',
  'Salicylic Acid',
  'Glycolic Acid',
  'Retinol',
  'Essential Oils',
  'Parabens',
  'Sulfates',
  'Silicones',
  'Lanolin',
];

const COMMON_CONCERNS = [
  'Hydration & Barrier',
  'Acne & Blemishes',
  'Redness & Sensitivity',
  'Fine Lines & Firmness',
  'Dark Spots & Radiance',
  'Pore & Oil Control',
];

export default function SkinIdQuickModal({ isOpen, onClose, onSaved }) {
  const { user, setUser } = useApp();

  const existingProfile = user?.skinProfile || {};
  const [skinType, setSkinType] = useState(existingProfile.skinType || user?.skin_type || 'Combination');
  const [selectedAllergies, setSelectedAllergies] = useState(() =>
    (existingProfile.allergies || []).map((a) => a.ingredientName || a)
  );
  const [customAllergy, setCustomAllergy] = useState('');
  const [selectedConcerns, setSelectedConcerns] = useState(() =>
    existingProfile.skinConcerns?.length > 0 ? existingProfile.skinConcerns : ['Hydration & Barrier']
  );
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const toggleAllergy = (name) => {
    setSelectedAllergies((prev) =>
      prev.some((a) => a.toLowerCase() === name.toLowerCase())
        ? prev.filter((a) => a.toLowerCase() !== name.toLowerCase())
        : [...prev, name]
    );
  };

  const handleAddCustomAllergy = () => {
    const clean = customAllergy.trim();
    if (!clean) return;
    if (!selectedAllergies.some((a) => a.toLowerCase() === clean.toLowerCase())) {
      setSelectedAllergies((prev) => [...prev, clean]);
    }
    setCustomAllergy('');
  };

  const toggleConcern = (concern) => {
    setSelectedConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        skinType,
        allergyNames: selectedAllergies,
        skinConcerns: selectedConcerns.length > 0 ? selectedConcerns : ['Hydration & Barrier'],
        primaryGoal: 'Personalized Formula Match',
        budgetLevel: existingProfile.budgetLevel || 'Medium',
      };
      const res = await updateSkinProfile(payload);
      try {
        const meRes = await getMe();
        const d = meRes.data;
        setUser({
          ...d,
          name: d.fullName || d.name || d.email?.split('@')[0],
          fullName: d.fullName || d.name,
          skin_type: d.skinProfile?.skinType || skinType,
        });
      } catch {
        // Fallback local update
        setUser((u) => (u ? { ...u, skin_type: skinType, skinProfile: res.data } : u));
      }
      toast.success('Digital Skin ID saved! Updating your personalized formula match...');
      onSaved?.(res.data);
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save Skin ID. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 22, 19, 0.58)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          boxShadow: '0 24px 60px rgba(74, 55, 40, 0.22)',
          border: '1px solid rgba(196, 139, 113, 0.25)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(196, 139, 113, 0.14)',
                color: '#8F5B42',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              <Sparkles size={13} /> 30-SECOND DIGITAL SKIN ID
            </div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', color: '#2C2018', fontWeight: 700 }}>
              Complete Your Skin ID for Personalized Verdicts
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: '#6B5E55', lineHeight: 1.45 }}>
              Tell us your skin type and any ingredients you avoid so we can accurately cross-check every formula for you.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F8F5F2',
              border: 'none',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6B5E55',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          {/* 1. Skin Type */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#2C2018', marginBottom: '8px' }}>
              1. Select Your Primary Skin Type *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: '8px' }}>
              {SKIN_TYPES.map((st) => {
                const active = skinType.toLowerCase() === st.key.toLowerCase();
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setSkinType(st.key)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: active ? '2px solid #8F5B42' : '1px solid #E6DFD9',
                      background: active ? 'rgba(196, 139, 113, 0.1)' : '#FAF8F6',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.88rem', color: '#2C2018' }}>
                      <span>{st.label}</span>
                      {active && <CheckCircle2 size={15} color="#8F5B42" />}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B5E55', marginTop: '3px', lineHeight: 1.3 }}>
                      {st.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Allergy Blacklist */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#2C2018', marginBottom: '4px' }}>
              2. Personal Allergy & Sensitivity Blacklist (Optional)
            </label>
            <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#6B5E55' }}>
              Any product containing these ingredients (or their INCI synonyms) will trigger a hard Allergy Alert.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {COMMON_ALLERGENS.map((item) => {
                const active = selectedAllergies.some((a) => a.toLowerCase() === item.toLowerCase());
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAllergy(item)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      border: active ? '1.5px solid #DC2626' : '1px solid #E2D9D0',
                      background: active ? 'rgba(239, 68, 68, 0.1)' : '#FFFFFF',
                      color: active ? '#DC2626' : '#4A3728',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {active && <AlertTriangle size={12} />}
                    {item}
                  </button>
                );
              })}
            </div>

            {/* Custom allergy input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Add another INCI ingredient to avoid (e.g., Niacinamide, Benzoyl Peroxide)..."
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomAllergy();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #E2D9D0',
                  fontSize: '0.83rem',
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomAllergy}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {selectedAllergies.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#DC2626', fontWeight: 600 }}>
                Active Blacklist ({selectedAllergies.length}): {selectedAllergies.join(', ')}
              </div>
            )}
          </div>

          {/* 3. Primary Concerns */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#2C2018', marginBottom: '8px' }}>
              3. Your Primary Care Goals
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {COMMON_CONCERNS.map((c) => {
                const active = selectedConcerns.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleConcern(c)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      border: active ? '1.5px solid #2E6F4E' : '1px solid #E2D9D0',
                      background: active ? 'rgba(46, 111, 78, 0.1)' : '#FFFFFF',
                      color: active ? '#2E6F4E' : '#4A3728',
                      cursor: 'pointer',
                    }}
                  >
                    {active ? '✓ ' : '+ '}
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #EFEAE6', paddingTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Later
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ShieldCheck size={16} />
              {saving ? 'Saving Skin ID...' : 'Save Skin ID & Check Compatibility'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
