// ─── sketch.js ─────────────────────────────────────────────
// Main p5.js sketch for Mille Fleurs.
// Views: title → garden → draw / bouquet-select → wrap → receive
// ────────────────────────────────────────────────────────────

// ─── CONSTANTS ─────────────────────────────────────────────
const PALETTE = [
  "#1E3A6B", // night indigo
  "#C9A7E0", // hydrangea lilac
  "#F2C6D0", // blush pink
  "#5E8C4A", // moss green
  "#C8D96A", // chartreuse
  "#D9A441", // ochre gold
  "#F7F2E3"  // paper cream
];
const BRUSH_SIZES    = [6, 14];       // small and large brush
const DRAW_SIZE      = 400;           // drawing canvas px
const MIN_POINT_DIST = 3;             // throttle distance (px)
const MAX_BOUQUET    = 7;             // max flowers in bouquet

// ─── STARTER LILIES (never saved to Firestore) ─────────────
const STARTER_LILIES = [
  { id: "lily-1", img: "lily-pink-blush.png",   x: 0.15, y: 0.52, name: "Mille Fleurs" },
  { id: "lily-2", img: "lily-pink-lilac.png",   x: 0.72, y: 0.48, name: "Mille Fleurs" },
  { id: "lily-3", img: "lily-pink-gold.png",    x: 0.40, y: 0.62, name: "Mille Fleurs" },
  { id: "lily-4", img: "lily-water-blue.png",   x: 0.60, y: 0.75, name: "Mille Fleurs" },
  { id: "lily-5", img: "lily-water-blush.png",  x: 0.28, y: 0.80, name: "Mille Fleurs" },
  { id: "lily-6", img: "lily-water-indigo.png", x: 0.82, y: 0.68, name: "Mille Fleurs" }
];

// ─── STATE ─────────────────────────────────────────────────
let currentView  = "title";       // title | garden | draw | planting | bouquet-select
let viewAlpha    = 0;             // for fade-in
let gardenReady  = false;         // set after first snapshot

// Images loaded in preload()
let bgImg;
const lilyImgs = {};              // keyed by id e.g. "lily-1"
let wrapImg, wrapFrontImg;

// All flowers visible in the garden (starter + Firestore)
let flowers = [];                 // { id, name, x, y, strokes?, imgKey?, growAnim }

// Drawing state
let drawGfx;                      // p5.Graphics for the draw canvas
let currentStrokes = [];          // [ { color, size, points: [{x,y}…] } ]
let currentColor   = PALETTE[2];  // start with blush
let currentBrush   = BRUSH_SIZES[0];
let isDrawing      = false;
let brushSoundTimer = 0;          // throttle brush sound

// Planting state (after "plant it")
let plantStrokes = null;
let plantName    = "";

// Bouquet-select state
let selectedFlowerIds = [];

// Floating dream pollen / firefly particles
let particles = [];
const NUM_PARTICLES = 28;

// Hovered flower index (-1 = none)
let hoveredFlower = -1;

// ─── PRELOAD ───────────────────────────────────────────────
function preload() {
  bgImg = loadImage("assets/garden-bg.jpg");
  for (const lily of STARTER_LILIES) {
    lilyImgs[lily.id] = loadImage("assets/" + lily.img);
  }
  wrapImg      = loadImage("assets/bouquet-wrap.png");
  wrapFrontImg = loadImage("assets/bouquet-wrap-front.png");
}

// ─── SETUP ─────────────────────────────────────────────────
function setup() {
  const cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent("canvas-container");
  pixelDensity(1);
  imageMode(CENTER);
  textAlign(CENTER, CENTER);

  // Initialize off-screen drawing / canvas
  setupDrawCanvasEvents();
  redrawPaintCanvas();

  // Initialize dreamy floating pollen particles
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      x: random(width),
      y: random(height * 0.25, height),
      radius: random(1.5, 3.5),
      speedX: random(-0.4, 0.4),
      speedY: random(-0.3, -0.7),
      phase: random(TWO_PI),
      alpha: random(80, 190)
    });
  }

  // Build the swatch & brush-size buttons
  buildSwatches();
  buildBrushSizes();

  // Add starter lilies
  for (const lily of STARTER_LILIES) {
    flowers.push({
      id: lily.id, name: lily.name,
      x: lily.x, y: lily.y,
      imgKey: lily.id, strokes: null,
      growAnim: 1                // already fully grown
    });
  }

  // Start listening for Firestore flowers (live)
  listenForFlowers((id, data) => {
    if (flowers.find(f => f.id === id)) return;
    flowers.push({
      id, name: data.name, x: data.x, y: data.y,
      strokes: data.strokes, imgKey: null,
      growAnim: 0               // will animate in
    });
    gardenReady = true;
  });

  // Mark garden ready after a short delay even without data
  setTimeout(() => { gardenReady = true; }, 2000);

  // Check URL for ?bouquet=ID
  const params = new URLSearchParams(window.location.search);
  const bqId   = params.get("bouquet");
  if (bqId) showReceiveView(bqId);
}

// ─── WINDOW RESIZE ─────────────────────────────────────────
function windowResized() { resizeCanvas(windowWidth, windowHeight); }

// ─── DRAW LOOP (runs every frame) ──────────────────────────
function draw() {
  background(0);

  switch (currentView) {
    case "title":           drawTitle();                     break;
    case "garden":
    case "planting":
    case "bouquet-select":  drawGarden();                    break;
    case "draw":            drawGarden(); drawDimOverlay();  break;
  }
}

// ─── TITLE VIEW ────────────────────────────────────────────
function drawTitle() {
  viewAlpha = min(viewAlpha + 3, 255);

  push();
  // Clean, crisp title typography with subtle shadow
  textFont("Caveat Brush");
  textSize(76);
  
  // Soft, crisp subtle warm glow
  drawingContext.shadowColor = "rgba(247, 242, 227, 0.4)";
  drawingContext.shadowBlur = 12;
  
  fill(247, 242, 227, viewAlpha);
  text("Mille Fleurs", width / 2, height / 2 - 10);

  // Clear shadow before smaller text
  drawingContext.shadowColor = "transparent";
  drawingContext.shadowBlur = 0;

  // Subtitle - crisp and legible
  textFont("Caveat");
  textSize(26);
  fill(247, 242, 227, viewAlpha * 0.85);
  text("a garden everyone plants", width / 2, height / 2 + 54);

  // Hint
  if (viewAlpha > 180) {
    let hintAlpha = (sin(frameCount * 0.04) * 0.35 + 0.65) * 200;
    fill(247, 242, 227, hintAlpha);
    textSize(20);
    text("click anywhere to enter", width / 2, height / 2 + 110);
  }
  pop();
}

// ─── GARDEN VIEW ───────────────────────────────────────────
function drawGarden() {
  drawBgCover(bgImg);

  // Sort back-to-front by y
  let sorted = flowers.slice().sort((a, b) => a.y - b.y);
  hoveredFlower = -1;

  for (let i = 0; i < sorted.length; i++) {
    let f = sorted[i];

    // Animate grow-in
    if (f.growAnim < 1) f.growAnim = min(f.growAnim + 0.02, 1);

    // Perspective scaling - lilies are drawn dainty & delicate, hand-drawn flowers are much larger!
    let perspective = map(f.y, 0.35, 1.0, 0.45, 1.15, true);
    let isLilies    = Boolean(f.imgKey);
    // Starter lilies scaled DOWN (~75px) so they don't overpower; hand-drawn scaled UP (~220px)!
    let baseMultiplier = isLilies ? 75 : 230;
    let baseSize       = baseMultiplier * perspective * easeOutBack(f.growAnim);

    let fx = f.x * width;
    let fy = f.y * height;

    // Gentle sway
    let swaySpeed  = 0.6 + (i % 7) * 0.15;
    let swayAmount = 2.5 * perspective;
    let swayAngle  = sin(frameCount * 0.015 * swaySpeed + i * 1.3)
                     * radians(swayAmount);

    // Hover detection
    let d = dist(mouseX, mouseY, fx, fy);
    let hovered = (d < baseSize * 0.5) &&
                  (currentView === "garden" || currentView === "bouquet-select");
    if (hovered) hoveredFlower = flowers.indexOf(f);
    let liftY = hovered ? -8 : 0;

    // Shadow
    push();
    noStroke();
    fill(0, 0, 0, 30 * perspective);
    ellipse(fx, fy + baseSize * 0.3, baseSize * 0.7, baseSize * 0.18);
    pop();

    // Flower
    push();
    translate(fx, fy + liftY);
    rotate(swayAngle);

    // Haze for far-away flowers
    if (perspective < 0.6) {
      tint(255, map(perspective, 0.35, 0.6, 120, 255));
    } else {
      noTint();
    }

    // Selected glow (bouquet mode)
    if (selectedFlowerIds.includes(f.id)) {
      drawingContext.shadowColor = "rgba(249,215,185,0.7)";
      drawingContext.shadowBlur  = 25;
    }

    if (f.imgKey && lilyImgs[f.imgKey]) {
      let img = lilyImgs[f.imgKey];
      let aspect = img.width / img.height;
      image(img, 0, 0, baseSize * aspect, baseSize);
    } else if (f.strokes) {
      drawStrokesAt(f.strokes, 0, 0, baseSize);
    }

    drawingContext.shadowColor = "transparent";
    drawingContext.shadowBlur  = 0;
    pop();

    // Hover tooltip
    if (hovered) {
      push();
      let lbl = "drawn by " + f.name;
      textFont("Caveat");
      textSize(16 * perspective + 6);
      let tw = textWidth(lbl) + 16;
      noStroke();
      fill(30, 58, 107, 180);
      rect(fx - tw / 2, fy - baseSize * 0.55 + liftY - 10, tw, 26, 12);
      fill(247, 242, 227);
      textAlign(CENTER, CENTER);
      text(lbl, fx, fy - baseSize * 0.55 + liftY + 3);
      pop();
    }
  }

  // Draw dreamy floating golden pollen / petal flecks
  drawFloatingParticles();

  // Show/hide garden buttons
  let btns = document.getElementById("garden-btns");
  btns.classList.toggle("hidden",
    currentView !== "garden" && currentView !== "bouquet-select");
}

/** Draw gentle animated pollen motes floating up across the meadow */
function drawFloatingParticles() {
  push();
  noStroke();
  for (let p of particles) {
    p.x += p.speedX + sin(frameCount * 0.02 + p.phase) * 0.4;
    p.y += p.speedY;

    // Wrap around screen
    if (p.y < height * 0.15) {
      p.y = height + random(10, 40);
      p.x = random(width);
    }
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;

    let flicker = sin(frameCount * 0.05 + p.phase) * 40 + p.alpha;
    fill(247, 242, 227, max(30, flicker));
    ellipse(p.x, p.y, p.radius, p.radius);
  }
  pop();
}

/** Background image: scale to fill, crop overflow. */
function drawBgCover(img) {
  let iw = img.width, ih = img.height;
  let cw = width,     ch = height;
  let sc = max(cw / iw, ch / ih);
  let dw = iw * sc, dh = ih * sc;
  push();
  imageMode(CORNER);
  noTint();
  image(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  pop();
}

/** Semi-transparent overlay when draw panel is open. */
function drawDimOverlay() {
  push();
  noStroke();
  fill(0, 0, 0, 120);
  rect(0, 0, width, height);
  pop();
}

// ─── DRAW STROKES AT A POSITION (Planted in Meadow) ────────
function drawStrokesAt(strokes, cx, cy, sz) {
  let sc = sz / DRAW_SIZE;
  push();
  translate(cx - sz / 2, cy - sz / 2);
  for (const s of strokes) {
    if (!s.points || s.points.length === 0) continue;
    
    // Pass 1: Saturated solid core
    let coreColor = color(s.color);
    coreColor.setAlpha(255);
    stroke(coreColor);
    strokeWeight(max(2.8, s.size * sc * 1.3));
    strokeCap(ROUND);
    strokeJoin(ROUND);
    noFill();
    beginShape();
    for (const p of s.points) {
      curveVertex(p.x * sc, p.y * sc);
    }
    endShape();

    // Pass 2: Vibrant luminous halo
    let haloColor = color(s.color);
    haloColor.setAlpha(110);
    stroke(haloColor);
    strokeWeight(max(4.0, s.size * sc * 1.9));
    beginShape();
    for (const p of s.points) {
      curveVertex(p.x * sc, p.y * sc);
    }
    endShape();
  }
  pop();
}

// ─── DRAW VIEW LOGIC (Direct 2D Canvas) ─────────────────────

function getPaintCanvas() {
  return document.getElementById("paint-canvas");
}

function enterDrawView() {
  currentView = "draw";
  currentStrokes = [];
  redrawPaintCanvas();
  document.getElementById("draw-panel").style.display = "flex";
  if (typeof playChime === "function") playChime(2);
}

function clearDrawing() {
  currentStrokes = [];
  redrawPaintCanvas();
}

/** Redraw the 400x400 paint canvas with rich, vibrant watercolor effect */
function redrawPaintCanvas() {
  const cvs = getPaintCanvas();
  if (!cvs) return;
  const ctx = cvs.getContext("2d");
  
  // Background cream paper
  ctx.fillStyle = "#F7F2E3";
  ctx.fillRect(0, 0, cvs.width, cvs.height);

  for (const s of currentStrokes) {
    if (!s.points || s.points.length === 0) continue;
    
    // Core vibrant stroke (crisp and saturated)
    ctx.save();
    ctx.strokeStyle = hexToRGBA(s.color, 0.88);
    ctx.lineWidth   = max(2, s.size * 0.9);
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x, s.points[i].y);
    }
    ctx.stroke();
    ctx.restore();

    // Watercolor wet-edge bloom layers
    for (let pass = 0; pass < 2; pass++) {
      ctx.save();
      ctx.strokeStyle = hexToRGBA(s.color, 0.28 - pass * 0.1);
      ctx.lineWidth   = s.size * (1.3 + pass * 0.4);
      ctx.lineCap     = "round";
      ctx.lineJoin    = "round";
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        const pt = s.points[i];
        const jx = pt.x + (Math.sin(i * 1.5 + pass) * 0.6);
        const jy = pt.y + (Math.cos(i * 1.5 + pass) * 0.6);
        ctx.lineTo(jx, jy);
      }
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ─── DRAW CANVAS DOM EVENTS ────────────────────────────────
function setupDrawCanvasEvents() {
  const cvs = getPaintCanvas();
  if (!cvs) return;

  function getCanvasCoords(e) {
    const rect = cvs.getBoundingClientRect();
    const scaleX = cvs.width / rect.width;
    const scaleY = cvs.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  cvs.addEventListener("pointerdown", (e) => {
    isDrawing = true;
    cvs.setPointerCapture(e.pointerId);
    const pos = getCanvasCoords(e);
    currentStrokes.push({
      color:  currentColor,
      size:   currentBrush,
      points: [{ x: Math.round(pos.x), y: Math.round(pos.y) }]
    });
    redrawPaintCanvas();
    if (typeof playBrushDab === "function") playBrushDab();
  });

  cvs.addEventListener("pointermove", (e) => {
    if (!isDrawing || currentStrokes.length === 0) return;
    const pos = getCanvasCoords(e);
    const stroke = currentStrokes[currentStrokes.length - 1];
    const last   = stroke.points[stroke.points.length - 1];
    
    const dx = pos.x - last.x;
    const dy = pos.y - last.y;
    if (dx * dx + dy * dy < MIN_POINT_DIST * MIN_POINT_DIST) return;

    stroke.points.push({ x: Math.round(pos.x), y: Math.round(pos.y) });
    redrawPaintCanvas();

    if (millis() - brushSoundTimer > 140) {
      if (typeof playBrushDab === "function") playBrushDab();
      brushSoundTimer = millis();
    }
  });

  const stopDrawing = (e) => {
    if (isDrawing) {
      isDrawing = false;
      try { cvs.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  };

  cvs.addEventListener("pointerup", stopDrawing);
  cvs.addEventListener("pointercancel", stopDrawing);
}

// ─── PLANT FLOW (with pretty modal) ───────────────────────

function plantFlower() {
  if (currentStrokes.length === 0) return;       // nothing drawn
  // Show the name modal instead of prompt()
  document.getElementById("draw-panel").style.display = "none";
  document.getElementById("name-modal").style.display = "flex";
  document.getElementById("name-input").value = "";
  document.getElementById("name-input").focus();
  playChime(3);
}

/** Called from the name modal's "plant" button. */
function confirmPlant() {
  let nameVal = document.getElementById("name-input").value.trim();
  if (!nameVal) return;                          // need a name

  plantName    = nameVal;
  plantStrokes = currentStrokes.slice();

  // Hide modal, show plant banner
  document.getElementById("name-modal").style.display   = "none";
  document.getElementById("plant-banner").style.display = "block";
  currentView = "planting";
  playTransition();
}

/** Called from the name modal's "cancel" button. */
function cancelPlant() {
  document.getElementById("name-modal").style.display  = "none";
  document.getElementById("draw-panel").style.display  = "flex";
}

// ─── BOUQUET SELECT LOGIC ──────────────────────────────────

function enterBouquetSelect() {
  currentView       = "bouquet-select";
  selectedFlowerIds = [];
  updateBouquetInfo();
  document.getElementById("bouquet-info").style.display = "block";
  document.getElementById("garden-btns").classList.add("hidden");
  playChime(1);
}

function cancelBouquetSelect() {
  currentView       = "garden";
  selectedFlowerIds = [];
  document.getElementById("bouquet-info").style.display = "none";
}

function updateBouquetInfo() {
  document.getElementById("bouquet-count").textContent = selectedFlowerIds.length;
}

function finishBouquetSelect() {
  if (selectedFlowerIds.length === 0) return;
  document.getElementById("bouquet-info").style.display = "none";
  currentView = "garden";
  drawBouquetPreview("bouquet-preview", selectedFlowerIds);
  document.getElementById("bouquet-panel").style.display = "flex";
  document.getElementById("link-display").style.display  = "none";
  playSparkle();
}

function closeBouquetPanel() {
  document.getElementById("bouquet-panel").style.display = "none";
  selectedFlowerIds = [];
  currentView       = "garden";
}

async function sendBouquet() {
  let toVal   = document.getElementById("bq-to").value.trim();
  let msgVal  = document.getElementById("bq-msg").value.trim();
  let fromVal = document.getElementById("bq-from").value.trim();
  if (!toVal || !fromVal) { alert("please fill in 'to' and 'from'"); return; }

  const ref = await saveBouquet({
    to: toVal, from: fromVal,
    message: msgVal, flowerIds: selectedFlowerIds
  });

  let link = window.location.origin + window.location.pathname + "?bouquet=" + ref.id;
  document.getElementById("bq-link").value  = link;
  document.getElementById("link-display").style.display = "block";
  playSparkle();
}

// ─── BOUQUET PREVIEW DRAWING ───────────────────────────────
function drawBouquetPreview(canvasId, flowerIds) {
  const cvs = document.getElementById(canvasId);
  const ctx = cvs.getContext("2d");
  const W = cvs.width, H = cvs.height;
  ctx.clearRect(0, 0, W, H);

  let wrapScale = Math.min(W / 598, H / 865) * 0.95;
  let ww = 598 * wrapScale, wh = 865 * wrapScale;
  let wx = (W - ww) / 2,   wy = (H - wh) / 2;

  // 1. Back wrap (full paper wrap with pink lining backdrop)
  ctx.drawImage(wrapImg.canvas || wrapImg.elt, wx, wy, ww, wh);

  // 2. Flowers arranged properly to bloom out of the front scoop
  // The front sleeve scoop lowest point is around y = 0.52 * wh.
  // Placing flower centers at y = 0.30 * wh lets their blossoms burst out of the wrap,
  // while their bottoms get neatly tucked under the front sleeve!
  let fCount     = flowerIds.length;
  let flowerSize = ww * 0.55; // Full, lush bloom size
  let openCx     = wx + ww / 2;
  let openCy     = wy + wh * 0.31; // Shifted up so blossoms fill the pink backdrop

  for (let i = 0; i < fCount; i++) {
    const f = flowers.find(fl => fl.id === flowerIds[i]);
    if (!f) continue;

    // Fan arrangement: spread nicely within the wrap's upper wings
    let norm = fCount === 1 ? 0.5 : i / (fCount - 1); // 0 to 1
    // Keep flowers well inside the left and right paper wings
    let spreadX = (norm - 0.5) * (ww * 0.44);
    // Slight downward stagger on the sides so center flower crowns the top
    let archY   = Math.abs(norm - 0.5) * (wh * 0.08) + (i % 2 === 0 ? -8 : 8);

    let fx = openCx + spreadX;
    let fy = openCy + archY;
    let rotAngle = (norm - 0.5) * 0.35; // Gentle tilt following the wrap cone

    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(rotAngle);

    if (f.imgKey && lilyImgs[f.imgKey]) {
      let img = lilyImgs[f.imgKey];
      let aspect = img.width / img.height;
      let fw = flowerSize * aspect;
      let fh = flowerSize;
      ctx.drawImage(img.canvas || img.elt, -fw / 2, -fh / 2, fw, fh);
    } else if (f.strokes) {
      drawStrokesToCanvas(ctx, f.strokes, 0, 0, flowerSize);
    }
    ctx.restore();
  }

  // 3. Front wrap sleeve (covers lower stems/bottoms so flowers look tucked inside!)
  ctx.drawImage(wrapFrontImg.canvas || wrapFrontImg.elt, wx, wy, ww, wh);
}

function drawStrokesToCanvas(ctx, strokes, cx, cy, sz) {
  let sc = sz / DRAW_SIZE;
  ctx.save();
  ctx.translate(cx - sz / 2, cy - sz / 2);
  for (const s of strokes) {
    if (!s.points || s.points.length === 0) continue;
    
    // Vibrant solid core for bouquet
    ctx.strokeStyle = hexToRGBA(s.color, 0.85);
    ctx.lineWidth   = max(1.6, s.size * sc * 0.95);
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.beginPath();
    ctx.moveTo(s.points[0].x * sc, s.points[0].y * sc);
    for (let j = 1; j < s.points.length; j++) {
      ctx.lineTo(s.points[j].x * sc, s.points[j].y * sc);
    }
    ctx.stroke();

    // Soft outer bloom
    ctx.strokeStyle = hexToRGBA(s.color, 0.22);
    ctx.lineWidth   = s.size * sc * 1.35;
    ctx.beginPath();
    ctx.moveTo(s.points[0].x * sc, s.points[0].y * sc);
    for (let j = 1; j < s.points.length; j++) {
      ctx.lineTo(s.points[j].x * sc, s.points[j].y * sc);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function hexToRGBA(hex, a) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ─── ARCHIVE / HERBARIUM VIEW ─────────────────────────────

function openArchiveView() {
  currentView = "archive";
  const panel = document.getElementById("archive-panel");
  const grid  = document.getElementById("archive-grid");
  grid.innerHTML = "";
  panel.style.display = "flex";
  if (typeof playChime === "function") playChime(2);

  flowers.forEach((f, idx) => {
    // Specimen frame card
    const card = document.createElement("div");
    card.style.background = "#F7F2E3";
    card.style.borderRadius = "8px";
    card.style.padding = "16px";
    card.style.boxShadow = "0 8px 24px rgba(0,0,0,0.35)";
    card.style.border = "2px solid #E5DEC9";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.alignItems = "center";
    card.style.transition = "transform 0.25s ease";
    card.onmouseenter = () => { card.style.transform = "translateY(-4px)"; };
    card.onmouseleave = () => { card.style.transform = "translateY(0)"; };

    // Canvas inside the frame
    const cvs = document.createElement("canvas");
    cvs.width = 180;
    cvs.height = 180;
    cvs.style.width = "100%";
    cvs.style.borderRadius = "4px";
    cvs.style.background = "#FAF7EE";
    card.appendChild(cvs);

    const ctx = cvs.getContext("2d");

    if (f.imgKey && lilyImgs[f.imgKey]) {
      const img = lilyImgs[f.imgKey];
      const asp = img.width / img.height;
      const sz = 135;
      ctx.drawImage(img.canvas || img.elt, 90 - (sz * asp) / 2, 90 - sz / 2, sz * asp, sz);
    } else if (f.strokes) {
      drawStrokesToCanvas(ctx, f.strokes, 90, 90, 140);
    }

    // Herbarium caption label
    const label = document.createElement("div");
    label.style.marginTop = "10px";
    label.style.textAlign = "center";
    label.style.fontFamily = "'Caveat', cursive";
    label.style.color = "#1E3A6B";

    const titleEl = document.createElement("div");
    titleEl.textContent = f.name === "Mille Fleurs" ? "Wild Meadow Lily" : f.name + "'s Flower";
    titleEl.style.fontSize = "20px";
    titleEl.style.fontWeight = "bold";

    const byEl = document.createElement("div");
    byEl.textContent = "planted by " + f.name;
    byEl.style.fontSize = "16px";
    byEl.style.color = "#5E8C4A";

    label.appendChild(titleEl);
    label.appendChild(byEl);
    card.appendChild(label);

    grid.appendChild(card);
  });
}

function closeArchiveView() {
  document.getElementById("archive-panel").style.display = "none";
  currentView = "garden";
}

// ─── RECEIVE VIEW ──────────────────────────────────────────

async function showReceiveView(bouquetId) {
  currentView = "receive";
  document.getElementById("receive-panel").style.display = "flex";

  const data = await loadBouquet(bouquetId);
  if (!data) {
    document.getElementById("recv-to").textContent = "this bouquet wasn't found 🥀";
    return;
  }

  document.getElementById("recv-to").textContent   = "dear " + data.to + ",";
  document.getElementById("recv-msg").textContent  = data.message || "";
  document.getElementById("recv-from").textContent = "— " + data.from;

  setTimeout(() => {
    drawBouquetPreview("receive-preview", data.flowerIds);
  }, 2500);
}

function visitGarden() {
  document.getElementById("receive-panel").style.display = "none";
  window.history.replaceState({}, "", window.location.pathname);
  currentView = "garden";
  viewAlpha   = 0;
}

// ─── MOUSE / TOUCH INTERACTION ─────────────────────────────

function mousePressed() {
  // --- First click anywhere: start audio ---
  if (typeof initAudio === "function") initAudio();
  if (typeof startMusic === "function" && !isMusicPlaying) startMusic();

  // --- Title: click to enter garden ---
  if (currentView === "title") {
    currentView = "garden";
    viewAlpha   = 0;
    if (typeof playTransition === "function") playTransition();
    return;
  }

  // --- Planting: place the flower ---
  if (currentView === "planting") {
    let fy = mouseY / height;
    if (fy < 0.35) return;      // above the allowed zone

    let fx = mouseX / width;
    saveFlower({
      name: plantName,
      x: round(fx * 1000) / 1000,
      y: round(fy * 1000) / 1000,
      strokes: plantStrokes
    });

    plantStrokes = null;
    plantName    = "";
    document.getElementById("plant-banner").style.display = "none";
    currentView = "garden";
    playPlantSound();
    return;
  }

  // --- Bouquet select: pick a flower ---
  if (currentView === "bouquet-select" && hoveredFlower >= 0) {
    let fid = flowers[hoveredFlower].id;
    let idx = selectedFlowerIds.indexOf(fid);
    if (idx >= 0) {
      selectedFlowerIds.splice(idx, 1);
    } else if (selectedFlowerIds.length < MAX_BOUQUET) {
      selectedFlowerIds.push(fid);
      playChime(selectedFlowerIds.length);
    }
    updateBouquetInfo();
    return;
  }
}

// ─── SWATCH & BRUSH UI ────────────────────────────────────

function buildSwatches() {
  let container = document.getElementById("swatches");
  for (const c of PALETTE) {
    let el = document.createElement("div");
    el.className = "swatch" + (c === currentColor ? " active" : "");
    el.style.background = c;
    el.onclick = () => {
      currentColor = c;
      container.querySelectorAll(".swatch").forEach(s => s.classList.remove("active"));
      el.classList.add("active");
    };
    container.appendChild(el);
  }
}

function buildBrushSizes() {
  let container = document.getElementById("brush-sizes");
  for (const sz of BRUSH_SIZES) {
    let el = document.createElement("div");
    el.className = "brush-dot" + (sz === currentBrush ? " active" : "");
    el.style.width  = sz + 6 + "px";
    el.style.height = sz + 6 + "px";
    el.onclick = () => {
      currentBrush = sz;
      container.querySelectorAll(".brush-dot").forEach(d => d.classList.remove("active"));
      el.classList.add("active");
    };
    container.appendChild(el);
  }
}

// ─── EASING ────────────────────────────────────────────────
function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
