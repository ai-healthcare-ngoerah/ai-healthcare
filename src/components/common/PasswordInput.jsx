import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Shared password input field with an accessible visibility toggle.
 */
const PasswordInput = ({
  id,
  value,
  onChange,
  placeholder = '••••••••',
  required = false,
  minLength,
  autoComplete,
}) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const toggleLabel = visible
    ? t('auth.common.hidePassword', 'Sembunyikan kata sandi')
    : t('auth.common.showPassword', 'Tampilkan kata sandi');

  return (
    <div style={{ position: 'relative' }}>
      <Lock
        size={18}
        color="var(--text-muted)"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '1rem',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      />
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        style={{
          width: '100%',
          padding: '0.75rem 2.75rem 0.75rem 2.75rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          outline: 'none',
        }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={toggleLabel}
        aria-pressed={visible}
        title={toggleLabel}
        style={{
          position: 'absolute',
          right: '0.35rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          padding: '0.35rem',
          minWidth: '36px',
          minHeight: '36px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#475569',
          cursor: 'pointer',
          borderRadius: '6px',
        }}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
};

export default PasswordInput;
