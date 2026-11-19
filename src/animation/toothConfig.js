/**
 * Centralised animation map: one destination per story beat for the mascot.
 *
 * WHEN  → element with data-tooth-stop="<id>" (he arrives as it reaches the viewport centre)
 * WHERE → element with data-tooth-slot="<id>" (a constrained .tooth-stage box in the
 *         section's own grid; CSS decides its place at every breakpoint)
 * PATH  → computed every frame from the stages' LIVE positions (see toothLayout.js)
 * POSE  → which mascot image he shows at that stop. The image
 *         cross-fades while he travels (when he is smallest), never on arrival.
 *
 * The mascot images are always shown in their original colours: no hologram,
 * grid, scan or tint is applied to them. Only the soft glow behind changes.
 */

/**
 * Every pose. All files share ONE transparent canvas (1000×900, artwork
 * contained and standing on the same baseline; see scripts/prepare-poses.mjs),
 * so swapping never shifts him. Built from the uploaded PNGs in assets/uploads
 * with their original colours: only the background was made transparent.
 */
export const MASCOTS = {
  welcome: { src: '/images/mascot/pose-welcome.webp', alt: 'Dentist welcoming you beside Dr. Tooth giving a thumbs up' },
  care: { src: '/images/mascot/pose-care.webp', alt: 'Dentist in a mask hugging Dr. Tooth, who wears plasters' },
  examination: { src: '/images/mascot/pose-examination.webp', alt: 'Dr. Tooth examining a patient with a mirror and probe' },
  treatments: { src: '/images/mascot/pose-treatments.webp', alt: 'Dentist and Dr. Tooth with treatment icons: laser, fillings, implants, root canal, whitening' },
  aligners: { src: '/images/mascot/pose-aligners.webp', alt: 'Dr. Tooth holding a clear aligner and pointing to his straight smile' },
  implants: { src: '/images/mascot/pose-implants.webp', alt: 'Dr. Tooth showing a patient a dental implant model' },
  whitening: { src: '/images/mascot/pose-whitening.webp', alt: 'Dr. Tooth whitening a patient’s teeth with a blue light, before and after inset' },
  toothbrush: { src: '/images/mascot/pose-toothbrush.webp', alt: 'Dr. Tooth waving with a toothbrush' },
  tools: { src: '/images/mascot/pose-tools.webp', alt: 'Dr. Tooth holding a dental mirror and probe' },
  checkup: { src: '/images/mascot/pose-checkup.webp', alt: 'Dr. Tooth giving a small tooth a check-up in the chair' },
  location: { src: '/images/mascot/pose-location.webp', alt: 'Dr. Tooth holding a map pin to show the clinic' },
}
export const MASCOT_KEYS = Object.keys(MASCOTS)
export const MASCOT_ASPECT = 1000 / 900

const DEFAULTS = { rx: 0, ry: 0, rz: 0, rim: 1, warm: 0, spin: 0.5, fill: 0.92 }

const stop = (pose, base, mobile) => ({ pose, base: { ...DEFAULTS, ...base }, mobile })

export const TOOTH_STOPS = {
  // PART 1: Introduction: the dentist welcomes you, Dr. Tooth gives a thumbs up
  hero: stop('welcome', { spin: 1, fill: 0.96 }),
  // Approach: gentle care, a hug for the patched-up tooth
  philosophy: stop('care', { rim: 0.8 }),
  // PART 2: Technology: a precise examination, then the instruments
  'tech-scan': stop('examination', { rim: 1.1, spin: 0 }),
  'tech-holo': stop('tools', { rim: 1.1, spin: 0.2 }),
  // PART 3: Treatments: the overview, then the uploaded image that fits each row
  'treat-intro': stop('treatments', { rim: 1 }),
  'treat-1': stop('checkup', { rim: 1 }), // Digital Smile Design
  'treat-2': stop('aligners', { rim: 1 }), // Clear Aligners: holds an aligner
  'treat-3': stop('tools', { rim: 1 }), // Cosmetic Dentistry
  'treat-4': stop('implants', { rim: 1 }), // Dental Implants: implant model
  'treat-5': stop('whitening', { rim: 1, warm: 0.1 }), // Teeth Whitening: blue light, before/after
  'treat-6': stop('examination', { rim: 1, warm: 0.15 }), // Preventive Care: check-up catches decay early
  // PART 4: Tooth journey: beside the heading, above the drag-through scan room
  'smile-reveal': stop('care', { rim: 0.8, warm: 0.3 }),
  gallery: stop('toothbrush', { rim: 0.8, warm: 0.7 }),
  specialists: stop('welcome', { rim: 0.9, warm: 0.4 }),
  experience: stop('checkup', { rim: 1, warm: 0.2 }),
  // PART 5: Final destination: beside the booking form, pin held out toward it
  appointment: stop('location', { rim: 1.1, warm: 0, spin: 0.6, fill: 0.98 }),
}

/** Non-positional values scrubbed by the master timeline (position + pose come from toothLayout). */
export const EFFECT_KEYS = ['rx', 'ry', 'rz', 'rim', 'warm', 'spin']

/** Story chapters shown in the side rail. */
export const STORY_PARTS = [
  { id: 'part-hero', num: '01', label: 'Introduction' },
  { id: 'part-tech', num: '02', label: 'Technology' },
  { id: 'part-treatments', num: '03', label: 'Treatments' },
  { id: 'part-smile', num: '04', label: 'Tooth journey' },
  { id: 'part-appointment', num: '05', label: 'Book a visit' },
]

/** Total auto-play duration in seconds for the full page. */
export const PLAY_STORY_SECONDS = 32
