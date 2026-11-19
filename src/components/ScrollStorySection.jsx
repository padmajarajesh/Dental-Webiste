/**
 * Wrapper for each chapter. Layers (root stacking context, by design):
 *   .section-bg      z 0: background environment, always behind everything
 *   [3D canvas]      z 1: fixed, shared by every section
 *   content          z 2: text and UI
 * The section itself never creates a stacking context.
 */
export default function ScrollStorySection({ id, part, className = '', env, children, ...rest }) {
  return (
    <section id={id} className={`story-section ${className}`} data-part={part ? id : undefined} {...rest}>
      {env && (
        <div className="section-bg" aria-hidden="true">
          {env}
        </div>
      )}
      {children}
    </section>
  )
}
