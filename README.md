# Future Smile — dental scroll-story website

Dr. Tooth, the tooth mascot, travels through the whole page as you scroll, across five story parts, changing pose to suit each section.

```
npm install
npm run dev        # http://localhost:5173
npm run build && npm run preview
```

## How the journey works

- `src/three/PersistentToothCanvas.jsx`: one fixed WebGL canvas, mounted once and never recreated.
- `src/three/ToothModel.jsx` + `MascotMaterial.js`: the mascot on one plane. Every pose image (`public/images/mascot/pose-*.webp`) shares one transparent canvas (1000×900, same baseline), so the shader cross-fades from the pose he is leaving to the next section's pose. Original colours: no hologram, grid, scan or tint.
- **Pose per section** (`src/animation/toothConfig.js`, `pose` on each stop):
  - Hero → `welcome` · Approach → `care` · Technology → `examination`, then `tools`
  - Treatments intro → `treatments` · Smile Design → `checkup` · Aligners → `aligners` · Cosmetic → `tools` · Implants → `implants` · Whitening → `whitening` · Preventive → `examination`
  - Tooth journey → `care` · Gallery → `toothbrush` · Specialists → `welcome` · Experience → `checkup` · Booking → `location`
  - The swap happens mid-flight, when he is smallest, never on arrival or over text.
- Rebuild the poses with `node scripts/prepare-poses.mjs`. Sources are in `assets/uploads`. The uploaded PNGs have black or baked-in checkerboard backgrounds, so the script makes only the background transparent (RGB untouched), trims, and contains each pose in the shared canvas. To add a pose: drop the PNG in `assets/uploads`, add it to `POSES` in the script and to `MASCOTS` in toothConfig.js, then assign it to a stop.
- **Tooth journey** (`src/sections/ToothJourney.jsx`): the visitor drags the cavity tooth into the scan room; a beam sweeps down it and reveals the healthy tooth line by line (two aligned images, masked, no tint), then they drag it out to the finish. Pointer events (mouse, touch, pen) plus arrow keys; Reset/Replay. Assets from `assets/uploads/tooth-cavity.png`, `tooth-healthy.png`, `scan-room.png` via `node scripts/prepare-journey.mjs` (background removed, both teeth aligned in one canvas).
- **Layout decides where he goes.** Every section is a two-column `.split` grid. Dr. Molar lands in a `ToothStage` that owns one column, so he never shares space with text.
  - `data-tooth-stop="id"` marks *when* he arrives; `data-tooth-slot="id"` (inside the stage) marks *where* and *how big*.
  - He faces the text automatically: stage on the left → faces right, stage on the right → faces left.
- `src/animation/toothLayout.js`: computes his position every frame from the stages' **live** positions, so he scrolls with the layout. When he changes columns he goes through the measured gap between content blocks and shrinks on the way. Sticky stages (appointment) are supported.
- `src/animation/toothConfig.js`: the pose and glow for each stop.
- `src/animation/ToothScrollTimeline.js`: one GSAP timeline, scrubbed by scroll, for glow, warmth and camera sway.
- **Mobile (≤ 820px):** content is one column and every section keeps its own stage above its text. He stays glued to the current section's stage and scrolls with it, slides away under the header with it (the canvas is clipped below the header), then hands over to the next stage: invisibly when neither is on screen, otherwise by growing in at the next stage. He never crosses text or the nav. Camera sway / parallax are off on mobile; everything is re-measured on resize and orientation change.
- Without WebGL, `FallbackTooth` makes the same journey with the same images, moved by CSS.

## Replace before launch

- Specialist names, qualifications, clinic address, phone and email are **sample content**.
- **Booking form:** set `VITE_BOOKING_ENDPOINT` (e.g. in `.env`) to a URL that accepts `POST` JSON `{ name, phone: "+91 98765 43210", date: "YYYY-MM-DD", source }`. A success message is shown only after a 2xx response. Without the endpoint, the form validates but tells the visitor online booking isn't connected and to call; it never shows a fake confirmation.
- Smile photos (`public/images/smile-*.webp`) are the supplied sample images. Confirm you have the rights and consent to use them. The `*-before.webp` files are shade simulations (only the teeth were tinted) and are labelled that way on the page.
