import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Pencil, UserRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import api, { formatImageUrl } from '@/services/api';
import './dashboard-home.css';
import './profile.css';

type ProfileFields = { username: string; first_name: string; last_name: string; country: string; city: string; country_code: string };
const fieldsFrom = (user: Partial<ProfileFields> | null): ProfileFields => ({ username: user?.username || '', first_name: user?.first_name || '', last_name: user?.last_name || '', country: user?.country || '', city: user?.city || '', country_code: user?.country_code || '' });
const fields: { key: keyof ProfileFields; label: string; autoComplete: string; hint?: string }[] = [
  { key: 'first_name', label: 'First name', autoComplete: 'given-name' }, { key: 'last_name', label: 'Last name', autoComplete: 'family-name' },
  { key: 'username', label: 'Username', autoComplete: 'username', hint: 'At least 3 characters.' },
  { key: 'country', label: 'Country', autoComplete: 'country-name' }, { key: 'city', label: 'City', autoComplete: 'address-level2' },
  { key: 'country_code', label: 'Country code', autoComplete: 'country', hint: 'Two-letter country code, for example US or GB.' },
];
const acceptedImages = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function Profile() {
  const { user, setUser } = useAuth();
  const dark = useThemeStore(state => state.dark);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileFields>(() => fieldsFrom(user));
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ username?: string; photo?: string }>({});
  const [saveError, setSaveError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!editing) setForm(fieldsFrom(user)); }, [user, editing]);
  useEffect(() => {
    if (!photo) { setPreview(null); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  function resetPhoto() { setPhoto(null); if (fileRef.current) fileRef.current.value = ''; }
  function cancel() { setForm(fieldsFrom(user)); resetPhoto(); setErrors({}); setSaveError(''); setEditing(false); }
  function choosePhoto(file: File | undefined) {
    setSaveError('');
    if (!file) { resetPhoto(); setErrors(current => ({ ...current, photo: undefined })); return; }
    const error = !acceptedImages.includes(file.type) ? 'Choose a JPEG, PNG, GIF, or WebP image.' : file.size > 5 * 1024 * 1024 ? 'Choose an image no larger than 5 MB.' : '';
    if (error) { resetPhoto(); setErrors(current => ({ ...current, photo: error })); return; }
    setPhoto(file); setErrors(current => ({ ...current, photo: undefined }));
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!editing || saving) return;
    const username = form.username.trim();
    const usernameError = !username ? 'Username is required.' : username.length < 3 ? 'Username must be at least 3 characters.' : '';
    setErrors(current => ({ ...current, username: usernameError }));
    if (usernameError || errors.photo) return;
    setSaving(true); setSaveError(''); setSuccess('');
    try {
      const values = { ...form, username, country_code: form.country_code.trim().toUpperCase() };
      let payload: ProfileFields | FormData = values;
      if (photo) { payload = new FormData(); Object.entries(values).forEach(([key, value]) => (payload as FormData).append(key, value)); payload.append('avatar', photo); }
      const { data } = await api.patch('/web/api/auth/update_profile', payload, { headers: photo ? { 'Content-Type': 'multipart/form-data' } : {} });
      if (!data.user) throw new Error('Missing updated profile');
      setUser(data.user); setForm(fieldsFrom(data.user)); resetPhoto(); setEditing(false); setErrors({}); setSuccess('Your profile has been updated.');
    } catch (err) {
      const data = (err as { response?: { data?: { error?: string; errors?: string[] | Record<string, string[]> } } }).response?.data;
      const message = data?.error || (Array.isArray(data?.errors) ? data.errors.join(', ') : data?.errors ? Object.entries(data.errors).map(([key, value]) => `${key.replace(/_/g, ' ')} ${Array.isArray(value) ? value.join(', ') : value}`).join('. ') : 'Couldn’t save your profile. Please try again.');
      setSaveError(message);
    } finally { setSaving(false); }
  }
  const image = preview || formatImageUrl(user?.profile_picture_url);
  return <div className={`dashboard-overview profile-page ${dark ? 'overview-dark' : ''}`}>
    <Helmet><title>Profile Settings | ProxySock</title></Helmet>
    <header className="overview-heading"><div><span className="overview-eyebrow">Your workspace</span><h1>Profile settings</h1><p>Manage your personal details and profile photo.</p></div>{user && !editing && <button type="button" className="overview-button" onClick={() => { setEditing(true); setSuccess(''); }}><Pencil size={14} aria-hidden="true" />Edit profile</button>}</header>
    {!user ? <section className="overview-auth"><h2>Sign in to view your profile</h2><Link to="/login">Back to login</Link></section> : <>
      {success && <p className="profile-feedback" role="status">{success}</p>}
      <div className="profile-layout"><form className="profile-form" onSubmit={save} noValidate aria-busy={saving}>
        <section className="profile-panel" aria-labelledby="profile-photo-title"><div className="profile-photo-row"><div className="profile-avatar">{image ? <img src={image} alt="Your profile" /> : <UserRound size={28} strokeWidth={1.4} aria-hidden="true" />}</div><div><h2 id="profile-photo-title">Profile photo</h2><p>JPEG, PNG, GIF, or WebP. Maximum 5 MB.</p>{editing && <><label className="profile-upload" htmlFor="profile-photo">Choose photo</label><input ref={fileRef} id="profile-photo" className="profile-file" type="file" accept={acceptedImages.join(',')} disabled={saving} onChange={event => choosePhoto(event.target.files?.[0])} aria-invalid={Boolean(errors.photo)} aria-describedby={errors.photo ? 'photo-error' : undefined} />{photo && <div className="profile-selected-photo"><span>{photo.name}</span><button type="button" disabled={saving} onClick={resetPhoto}>Undo photo change</button></div>}{errors.photo && <><p id="photo-error" className="profile-field-error" role="alert">{errors.photo}</p><button className="profile-upload" type="button" disabled={saving} onClick={() => { resetPhoto(); setErrors(current => ({ ...current, photo: undefined })); }}>Keep current photo</button></>}</>}</div></div></section>
        <section className="profile-panel" aria-labelledby="profile-details-title"><div className="overview-section-heading"><div><h2 id="profile-details-title">Personal details</h2><p>Your name and location information.</p></div></div><div className="profile-fields">{fields.map(field => <div key={field.key}><label htmlFor={`profile-${field.key}`}>{field.label}{field.key === 'username' && <span aria-hidden="true"> *</span>}</label><input id={`profile-${field.key}`} name={field.key} autoComplete={field.autoComplete} value={form[field.key]} readOnly={!editing} disabled={saving} required={field.key === 'username'} aria-invalid={field.key === 'username' && Boolean(errors.username)} aria-describedby={field.key === 'username' && errors.username ? 'username-error' : field.hint ? `${field.key}-hint` : undefined} onChange={event => { setForm(current => ({ ...current, [field.key]: event.target.value })); if (field.key === 'username') setErrors(current => ({ ...current, username: undefined })); }} />{field.hint && <p id={`${field.key}-hint`}>{field.hint}</p>}{field.key === 'username' && errors.username && <p id="username-error" className="profile-field-error" role="alert">{errors.username}</p>}</div>)}</div>
          {saveError && <p className="profile-feedback profile-field-error" role="alert">{saveError}</p>}{editing && <div className="profile-actions"><button type="button" className="overview-button" disabled={saving} onClick={cancel}>Cancel</button><button type="submit" className="profile-save" disabled={saving || Boolean(errors.photo)}>{saving ? 'Saving…' : 'Save changes'}</button></div>}
        </section>
      </form><aside className="profile-panel profile-account" aria-labelledby="profile-account-title"><h2 id="profile-account-title">Account details</h2><dl><div><dt>Email address</dt><dd>{user.email || 'Not available'}</dd></div><div><dt>Account status</dt><dd className="profile-account-status">{user.status || 'Not available'}</dd></div></dl><Link to="/dashboard/change-password"><span>Change password</span><ArrowUpRight size={15} aria-hidden="true" /></Link><Link to="/dashboard/transactions"><span>View wallet activity</span><ArrowUpRight size={15} aria-hidden="true" /></Link><Link to="/dashboard/support"><span>Get account help</span><ArrowUpRight size={15} aria-hidden="true" /></Link></aside></div>
    </>}
  </div>;
}
