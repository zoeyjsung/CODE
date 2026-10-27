let starX;
let starY;
let vx = 4;
let vy = 3;
let radius1 = 20; // Inner radius
let radius2 = 45; // Outer radius
let npoints = 5;
let rotation = 0;
let rotationSpeed = 0.03;

// Background pulsation
let pulseAngle = 0;

// Sparkle trail
let trail = [];
ju
function setup() {
  createCanvas(windowWidth, windowHeight);
  starX = width / 2;
  starY = height / 2;
  angleMode(RADIANS);
}

function draw() {
  // Pulsate background between deep midnight blue and dark purple/indigo
  pulseAngle += 0.02;
  let pulse = (sin(pulseAngle) + 1) / 2; // Value normalized between 0 and 1

  let bgR = lerp(8, 28, pulse);
  let bgG = lerp(10, 14, pulse);
  let bgB = lerp(28, 55, pulse);

  // Redraw background with slight transparency for motion trails
  background(bgR, bgG, bgB, 90);

  // Update position
  starX += vx;
  starY += vy;
  rotation += rotationSpeed;

  // Bounce off horizontal borders
  if (starX + radius2 >= width) {
    starX = width - radius2;
    vx *= -1;
  } else if (starX - radius2 <= 0) {
    starX = radius2;
    vx *= -1;
  }

  // Bounce off vertical borders
  if (starY + radius2 >= height) {
    starY = height - radius2;
    vy *= -1;
  } else if (starY - radius2 <= 0) {
    starY = radius2;
    vy *= -1;
  }

  // Add trail particle
  trail.push({
    x: starX,
    y: starY,
    alpha: 255,
    size: random(4, 10),
  });

  // Draw trail
  noStroke();
  for (let i = trail.length - 1; i >= 0; i--) {
    let p = trail[i];
    fill(255, 230, 100, p.alpha);
    circle(p.x, p.y, p.size);
    p.alpha -= 8;
    p.size *= 0.95;

    if (p.alpha <= 0) {
      trail.splice(i, 1);
    }
  }

  // Draw the star with glow
  push();
  translate(starX, starY);
  rotate(rotation);

  // Soft glow
  fill(255, 215, 0, 70);
  drawStar(0, 0, radius1 + 8, radius2 + 10, npoints);

  // Core star
  stroke(255, 255, 220);
  strokeWeight(2);
  fill(255, 215, 0);
  drawStar(0, 0, radius1, radius2, npoints);
  pop();
}

// Function to draw a star shape
function drawStar(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;

  beginShape();
  for (let a = -PI / 2; a < TWO_PI - PI / 2; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

