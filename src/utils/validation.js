/** Indian mobile: optional +91 / 91 / 0 prefix, then 10 digits starting 6–9. */
export function normaliseIndianMobile(raw = '') {
  const digits = raw.replace(/[\s\-().]/g, '')
  const m = digits.match(/^(?:\+?91|0)?([6-9]\d{9})$/)
  return m ? `+91 ${m[1].slice(0, 5)} ${m[1].slice(5)}` : null
}

/**
 * Live formatting while typing: keeps digits only, drops a pasted +91 / 0
 * prefix, caps at 10 digits and groups them as "98765 43210".
 */
export function formatIndianMobileInput(raw = '') {
  let d = raw.replace(/\D/g, '')
  if (d.length > 10 && d.startsWith('91')) d = d.slice(2)
  else if (d.length > 10 && d.startsWith('0')) d = d.slice(1)
  d = d.slice(0, 10)
  return d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d
}

export function todayISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

/** Booking form: name, Indian mobile, preferred date (Mon–Sat, today or later). */
export function validateBooking(v) {
  const e = {}
  const name = v.name.trim()
  if (!name) e.name = 'Please enter your name.'
  else if (name.length < 2 || !/^[\p{L} .'-]+$/u.test(name)) e.name = 'Please use letters only (at least 2).'

  if (!v.phone.trim()) e.phone = 'Please enter your mobile number.'
  else if (!normaliseIndianMobile(v.phone)) e.phone = 'Enter a valid 10-digit mobile starting with 6–9.'

  if (!v.date) e.date = 'Please pick a date.'
  else if (v.date < todayISO()) e.date = 'Please choose today or a later date.'
  else if (new Date(`${v.date}T12:00:00`).getDay() === 0) e.date = 'We are closed on Sundays.'
  return e
}
