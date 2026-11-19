import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle2, ChevronDown, Clock, Mail, MapPin, Phone, User } from 'lucide-react'
import ScrollStorySection from '../components/ScrollStorySection'
import RevealHeadline from '../components/RevealHeadline'
import ToothStage from '../components/ToothStage'
import { formatIndianMobileInput, normaliseIndianMobile, todayISO, validateBooking } from '../utils/validation'

/**
 * Booking requests are POSTed as JSON to VITE_BOOKING_ENDPOINT (your booking
 * API / CRM / form service). Without it the form never pretends to succeed:
 * it tells the visitor to call instead.
 */
const BOOKING_ENDPOINT = import.meta.env.VITE_BOOKING_ENDPOINT
const CLINIC_PHONE = { href: 'tel:+919876543210', label: '+91 98765 43210' }
const EMPTY = { name: '', phone: '', date: '' }

const fmtDate = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

function ToothIcon() {
  return (
    <svg viewBox="0 0 32 32" width="18" height="18" aria-hidden="true">
      <path d="M10 5c-4 0-6 3-6 7 0 4 2 6 3 9 1 4 1 7 3.5 7S13 23 15 21.5c.6-.4 1.4-.4 2 0C19 23 19 28 21.5 28S24 25 25 21c1-3 3-5 3-9 0-4-2-7-6-7-3 0-4 2-6 2s-3-2-6-2z" />
    </svg>
  )
}

function Field({ id, label, icon: Icon, error, className = '', children }) {
  return (
    <div className={`bk-cell ${className}`}>
      <div className={`bk-field ${error ? 'has-error' : ''}`}>
        <Icon className="bk-icon" size={20} aria-hidden="true" />
        <div className="bk-body">
          <label htmlFor={id}>{label}</label>
          {children}
        </div>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p id={`${id}-err`} className="bk-error" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function BookingForm() {
  const [v, setV] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | sent | failed | offline
  const [sent, setSent] = useState(null)

  const update = (k, value) => {
    setV((s) => ({ ...s, [k]: value }))
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }))
    if (status === 'failed' || status === 'offline') setStatus('idle')
  }
  const aria = (k) => ({ id: `f-${k}`, 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `f-${k}-err` : undefined })

  const submit = async (e) => {
    e.preventDefault()
    const errs = validateBooking(v)
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.getElementById(`f-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    const request = { name: v.name.trim(), phone: normaliseIndianMobile(v.phone), date: v.date }
    if (!BOOKING_ENDPOINT) {
      if (import.meta.env.DEV) console.warn('[booking] VITE_BOOKING_ENDPOINT is not set; no request was sent.', request)
      setStatus('offline')
      return
    }
    setStatus('sending')
    try {
      const res = await fetch(BOOKING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...request, source: 'website' }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setSent(request)
      setStatus('sent')
    } catch {
      setStatus('failed')
    }
  }

  if (status === 'sent' && sent) {
    return (
      <motion.div className="bk-result is-sent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} role="status">
        <CheckCircle2 size={28} aria-hidden="true" />
        <div>
          <h3>Request sent, {sent.name.split(' ')[0]}.</h3>
          <p>
            We will call <b>{sent.phone}</b> within one working day to confirm a time on <b>{fmtDate(sent.date)}</b>.
          </p>
          <button className="link-btn" onClick={() => { setV(EMPTY); setSent(null); setStatus('idle') }}>
            Send another request
          </button>
        </div>
      </motion.div>
    )
  }

  const empty = !v.date
  return (
    <>
      <form className="bk-form" id="appointment-form" onSubmit={submit} noValidate>
        <Field id="f-name" label="Full Name" icon={User} error={errors.name} className="bk-name">
          <input {...aria('name')} type="text" autoComplete="name" value={v.name} onChange={(e) => update('name', e.target.value)} placeholder="Your name" />
        </Field>
        <Field id="f-phone" label="Mobile (India)" icon={Phone} error={errors.phone} className="bk-phone">
          <div className="bk-phone-row">
            <span className="bk-cc" aria-hidden="true">+91</span>
            <input
              {...aria('phone')}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={v.phone}
              onChange={(e) => update('phone', formatIndianMobileInput(e.target.value))}
              placeholder="98765 43210"
            />
          </div>
        </Field>
        <Field id="f-date" label="Preferred Date" icon={CalendarDays} error={errors.date} className="bk-date">
          <div className={`bk-date-row ${empty ? 'is-empty' : ''}`}>
            <input
              {...aria('date')}
              type="date"
              min={todayISO()}
              value={v.date}
              onChange={(e) => update('date', e.target.value)}
              onClick={(e) => { try { e.currentTarget.showPicker?.() } catch { /* not supported */ } }}
            />
            <span className="bk-date-ph" aria-hidden="true">Select a date</span>
            <ChevronDown className="bk-chevron" size={16} aria-hidden="true" />
          </div>
        </Field>
        <button className="bk-submit" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : <>Book Now <ArrowRight size={18} aria-hidden="true" /></>}
        </button>
      </form>
      <AnimatePresence>
        {(status === 'offline' || status === 'failed') && (
          <motion.p className="bk-result is-warn" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AlertCircle size={18} aria-hidden="true" />
            <span>
              {status === 'offline'
                ? 'Online booking is not connected yet, so your request was not sent. '
                : 'We could not send your request. '}
              Please call us on <a href={CLINIC_PHONE.href}>{CLINIC_PHONE.label}</a> to book.
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </>
  )
}

function ApptEnv() {
  return (
    <>
      <div className="env-glow appt-glow" />
      <div className="appt-ambient" />
      <svg className="appt-curves" viewBox="0 0 1600 800" preserveAspectRatio="none">
        <defs>
          <linearGradient id="appt-arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2f8bff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#4aa3ff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#2f8bff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="appt-wave" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#1f6bff" stopOpacity="0" />
            <stop offset="0.6" stopColor="#2f8bff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#5cc8ff" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path d="M-40 760 C 40 300, 360 40, 900 -20" fill="none" stroke="url(#appt-arc)" strokeWidth="1.5" />
        <path d="M1050 820 C 1250 680, 1420 560, 1660 500" fill="none" stroke="url(#appt-wave)" strokeWidth="2" />
        <path d="M1050 820 C 1250 680, 1420 560, 1660 500 L 1660 820 Z" fill="url(#appt-wave)" opacity="0.18" />
      </svg>
      {/* Mirrors the content grid so the glow + floor ring sit exactly behind the
          mascot's stage, in the background layer (never painted over him). */}
      <div className="appt-env">
        <div className="split split-appt">
          <div className="appt-stage-box appt-floor-col">
            <div className="appt-mascot-glow" />
            <div className="appt-floor" />
          </div>
          <div className="appt-env-spacer" />
        </div>
      </div>
    </>
  )
}

export default function Appointment() {
  return (
    <ScrollStorySection id="part-appointment" part="05" className="appointment section-pad" env={<ApptEnv />} data-tooth-stop="appointment">
      <div className="split split-appt">
        {/* Left column: the mascot lands here (pin held out toward the form) */}
        <ToothStage id="appointment" className="stage-appt appt-stage-box" />
        <div className="appt-main" id="contact">
          <p className="appt-badge"><ToothIcon /> Book a visit</p>
          <RevealHeadline lines={['Choose a time', 'that suits you.']} className="appt-title" />
          <p className="lead appt-sub">We'll call to confirm within one working day.</p>
          <div className="bk-panel">
            <BookingForm />
          </div>
          <ul className="contact-list">
            <li><MapPin size={16} aria-hidden="true" /><span>Indiranagar, Bengaluru 560038</span></li>
            <li><Phone size={16} aria-hidden="true" /><a href={CLINIC_PHONE.href}>{CLINIC_PHONE.label}</a></li>
            <li><Mail size={16} aria-hidden="true" /><a href="mailto:hello@futuresmile.example">hello@futuresmile.example</a></li>
            <li><Clock size={16} aria-hidden="true" /><span>Mon–Sat · 10 AM – 8 PM</span></li>
          </ul>
        </div>
      </div>
    </ScrollStorySection>
  )
}
