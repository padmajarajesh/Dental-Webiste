import { motion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1]

/**
 * Masked line-by-line headline reveal. `accent` = index of the line drawn in cyan.
 * `immediate` plays on mount (hero); otherwise it plays when scrolled into view
 * and rewinds when scrolled back out above.
 */
const LINE = { hidden: { y: '115%', rotate: 2 }, shown: { y: '0%', rotate: 0 } }

export default function RevealHeadline({ lines, accent = 1, as: Tag = 'h2', className = '', immediate = false, delay = 0 }) {
  return (
    <Tag className={`headline ${className}`} aria-label={lines.join(' ')}>
      {lines.map((line, i) => (
        // The (untransformed) line wrapper is what gets observed: the inner text starts
        // clipped inside it, so observing the inner span would never report it in view.
        <motion.span
          className="headline-line"
          key={line}
          aria-hidden="true"
          initial="hidden"
          {...(immediate
            ? { animate: 'shown' }
            : { whileInView: 'shown', viewport: { once: false, amount: 0.5, margin: '0px 0px -8% 0px' } })}
        >
          <motion.span
            className={i === accent ? 'headline-inner accent' : 'headline-inner'}
            variants={LINE}
            transition={{ duration: 1.1, ease: EASE, delay: delay + i * 0.1 }}
          >
            {line}
          </motion.span>
        </motion.span>
      ))}
    </Tag>
  )
}

export function FadeUp({ children, delay = 0, className = '', as = 'div', ...rest }) {
  const M = motion[as]
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </M>
  )
}
