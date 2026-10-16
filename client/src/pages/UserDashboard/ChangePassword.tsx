import { useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import api from '@/services/api';
import './dashboard-home.css';
import './profile.css';
import './change-password.css';

type PasswordFields = { currentPassword: string; newPassword: string; confirmPassword: string };
type Errors = Partial<Record<keyof PasswordFields, string>>;
const emptyFields: PasswordFields = { currentPassword: '', newPassword: '', confirmPassword: '' };
const hiddenFields = { currentPassword: false, newPassword: false, confirmPassword: false };
const fields: { key: keyof PasswordFields; label: string; autoComplete: string }[] = [
  { key: 'currentPassword', label: 'Current password', autoComplete: 'current-password' },
  { key: 'newPassword', label: 'New password', autoComplete: 'new-password' },
  { key: 'confirmPassword', label: 'Confirm new password', autoComplete: 'new-password' },
];
function validate(values: PasswordFields): Errors {
  const errors: Errors = {};
  if (!values.currentPassword.trim()) errors.currentPassword = 'Enter your current password.';
  if (!values.newPassword.trim()) errors.newPassword = 'Enter a new password.';
  else if (values.newPassword.length < 8) errors.newPassword = 'Use at least 8 characters.';
  if (!values.confirmPassword) errors.confirmPassword = 'Confirm your new password.';
  else if (values.confirmPassword !== values.newPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

export default function ChangePassword() {
  const { user } = useAuth();
  const dark = useThemeStore(state => state.dark);
  const [values, setValues] = useState(emptyFields);
  const [visible, setVisible] = useState(hiddenFields);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  function change(key: keyof PasswordFields, value: string) {
    const next = { ...values, [key]: value };
    const nextErrors = validate(next);
    setValues(next); setSuccess(false); setServerError('');
    setErrors(current => ({ ...current, [key]: current[key] ? nextErrors[key] : undefined,
      ...(key === 'newPassword' && (values.confirmPassword || current.confirmPassword) ? { confirmPassword: nextErrors.confirmPassword } : {}) }));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current || !user) return;
    const nextErrors = validate(values);
    setErrors(nextErrors); setServerError(''); setSuccess(false);
    const firstError = fields.find(field => nextErrors[field.key]);
    if (firstError) { document.getElementById(firstError.key)?.focus(); return; }
    pending.current = true; setSaving(true);
    try {
      await api.post('/web/api/auth/change_password', { current_password: values.currentPassword, new_password: values.newPassword, password_confirmation: values.confirmPassword });
      setValues(emptyFields); setVisible(hiddenFields); setErrors({}); setSuccess(true);
    } catch (error) {
      const data = (error as { response?: { data?: { error?: string; errors?: string[] | Record<string, string[]> } } }).response?.data;
      const message = data?.error || (Array.isArray(data?.errors) ? data.errors.join(', ') : data?.errors ? Object.entries(data.errors).map(([key, messages]) => `${key.replace(/_/g, ' ')} ${Array.isArray(messages) ? messages.join(', ') : messages}`).join('. ') : 'Couldn’t change your password. Please try again.');
      setServerError(message);
    } finally { pending.current = false; setSaving(false); }
  }
  return <div className={`dashboard-overview password-page ${dark ? 'overview-dark' : ''}`}>
    <Helmet><title>Change Password | ProxySock</title></Helmet>
    <header className="overview-heading"><div><span className="overview-eyebrow">Your workspace</span><h1>Change password</h1><p>Update the password you use to sign in.</p></div><Link className="overview-button" to="/dashboard/profile">Profile settings <ArrowUpRight size={14} aria-hidden="true" /></Link></header>
    {!user ? <section className="overview-auth"><h2>Sign in to change your password</h2><Link to="/login">Back to login</Link></section> : <div className="profile-layout">
      <section className="profile-panel" aria-labelledby="password-form-title"><div className="overview-section-heading"><div><h2 id="password-form-title">Password details</h2><p>Enter your current password, then choose a new one.</p></div></div>
        {success && <p className="profile-feedback" role="status">Your password has been changed.</p>}
        <form className="password-form" onSubmit={submit} noValidate aria-busy={saving}>
          {fields.map(field => <div className="password-field" key={field.key}><label htmlFor={field.key}>{field.label}</label><div className="password-input"><input id={field.key} name={field.key} type={visible[field.key] ? 'text' : 'password'} autoComplete={field.autoComplete} required disabled={saving} spellCheck={false} autoCapitalize="none" value={values[field.key]} onChange={event => change(field.key, event.target.value)} aria-invalid={Boolean(errors[field.key])} aria-describedby={errors[field.key] ? `${field.key}-error` : field.key === 'newPassword' ? 'password-requirement' : undefined} /><button type="button" disabled={saving} onClick={() => setVisible(current => ({ ...current, [field.key]: !current[field.key] }))} aria-label={`${visible[field.key] ? 'Hide' : 'Show'} ${field.label.toLowerCase()}`} aria-controls={field.key}>{visible[field.key] ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}</button></div>{field.key === 'newPassword' && <p id="password-requirement">Use at least 8 characters.</p>}{errors[field.key] && <p className="password-error" id={`${field.key}-error`} role="alert">{errors[field.key]}</p>}</div>)}
          {serverError && <p className="password-error profile-feedback" role="alert">{serverError}</p>}
          <div className="profile-actions"><button type="submit" className="profile-save" disabled={saving}>{saving ? 'Updating password…' : 'Update password'}</button></div>
        </form>
      </section>
      <aside className="profile-panel profile-account" aria-labelledby="password-account-title"><h2 id="password-account-title">Your account</h2><dl><div><dt>Email address</dt><dd>{user.email || 'Not available'}</dd></div><div><dt>Username</dt><dd>{user.username || 'Not available'}</dd></div></dl><Link to="/forgot-password"><span>Forgot your current password?</span><ArrowUpRight size={15} aria-hidden="true" /></Link><Link to="/dashboard/support"><span>Get account help</span><ArrowUpRight size={15} aria-hidden="true" /></Link></aside>
    </div>}
  </div>;
}
