/**
 * The visual area Dr. Molar lands in. It lives in the section's own grid
 * column (never absolutely positioned over content); the master timeline
 * measures the inner slot to decide where he goes and how big he is.
 */
export default function ToothStage({ id, className = '', sticky = false, children }) {
  return (
    <div className={`tooth-stage ${className}`} aria-hidden="true" data-sticky={sticky || undefined}>
      <div className="stage-floor" />
      <div className="tooth-slot" data-tooth-slot={id} />
      {children}
    </div>
  )
}
