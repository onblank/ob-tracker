import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { BootstrapState } from '@obt/application';
import type { AppSettings } from '@obt/settings';
import obTrackerLogo from '../../assets/brand/ob-tracker-logo.svg';
import poweredByOnBlank from '../../assets/brand/powered-by-onblank.svg';

interface Props {
  initialSettings: AppSettings;
  onComplete(state: BootstrapState): void;
}

export function Onboarding({ initialSettings, onComplete }: Props) {
  const { t, i18n } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [language, setLanguage] = useState(i18n.language.startsWith('es') ? 'es' : 'en');
  const [currencyCode, setCurrencyCode] = useState(initialSettings.defaultCurrencyCode);
  const [defaultWorkType, setDefaultWorkType] = useState<AppSettings['defaultWorkType']>(initialSettings.defaultWorkType);
  const [defaultBillingModel, setDefaultBillingModel] = useState<AppSettings['defaultBillingModel']>(initialSettings.defaultBillingModel);
  const [hourlyRate, setHourlyRate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(null);
    try {
      const parsedRate = hourlyRate.trim() === '' ? null : Math.round(Number(hourlyRate.replace(',', '.')) * 100);
      if (parsedRate !== null && (!Number.isFinite(parsedRate) || parsedRate < 0)) throw new Error('Hourly rate must be a non-negative number.');
      const next = await window.obTracker.completeOnboarding({
        displayName,
        companyName: companyName.trim() || null,
        language,
        currencyCode: currencyCode.trim().toUpperCase(),
        defaultWorkType,
        defaultBillingModel,
        defaultHourlyRateMinor: parsedRate,
      });
      await i18n.changeLanguage(language);
      onComplete(next);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save onboarding settings.');
    } finally { setBusy(false); }
  }

  return (
    <main className="onboarding-layout">
      <section className="onboarding-brand-panel">
        <img className="brand-logo brand-logo--product" src={obTrackerLogo} alt="OB-Tracker" />
        <div>
          <span className="eyebrow">LOCAL-FIRST · OPEN SOURCE · OFFLINE</span>
          <h1>{t('welcome')}</h1>
          <p>{t('onboardingSubtitle')}</p>
        </div>
        <img className="brand-logo brand-logo--powered" src={poweredByOnBlank} alt="Powered by onBlank" />
      </section>

      <section className="onboarding-form-panel">
        <form className="onboarding-form" onSubmit={submit}>
          <div className="form-heading"><span>01</span><div><h2>Your local profile</h2><p>No account, email or internet connection is required.</p></div></div>

          <label>{t('displayName')}<input autoFocus required maxLength={120} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Alex" /></label>
          <label>{t('companyName')} <small>({t('optional')})</small><input maxLength={160} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Studio / company" /></label>

          <div className="form-grid">
            <label>{t('language')}<select value={language} onChange={(e) => setLanguage(e.target.value)}><option value="en">English</option><option value="es">Español</option></select></label>
            <label>{t('currency')}<input required maxLength={3} value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())} placeholder="EUR" /></label>
          </div>

          <div className="form-grid">
            <label>{t('workType')}<select value={defaultWorkType} onChange={(e) => setDefaultWorkType(e.target.value as AppSettings['defaultWorkType'])}><option value="billable">Billable</option><option value="non_billable">Non-billable</option><option value="learning">Learning</option></select></label>
            <label>{t('billingModel')}<select value={defaultBillingModel} onChange={(e) => setDefaultBillingModel(e.target.value as AppSettings['defaultBillingModel'])}><option value="hourly">Hourly</option><option value="none">None</option></select></label>
          </div>

          <label>{t('hourlyRate')} <small>({t('optional')})</small><div className="money-input"><span>{currencyCode || 'EUR'}</span><input inputMode="decimal" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="0.00" /></div></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={busy} type="submit">{busy ? 'Saving…' : t('start')}</button>
        </form>
      </section>
    </main>
  );
}
