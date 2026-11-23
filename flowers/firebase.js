// ─── firebase.js ───────────────────────────────────────────
// Firebase configuration and all Firestore read/write helpers.
// We load Firebase from CDN in index.html (compat builds),
// so `firebase` is a global variable here.
// ────────────────────────────────────────────────────────────

// Your Firebase configuration (spread-florals project)
const firebaseConfig = {
  apiKey:            "AIzaSyAcuNppJpeaXZIL-2lVP4Au5ksPUS_XsNQ",
  authDomain:        "spread-florals.firebaseapp.com",
  projectId:         "spread-florals",
  storageBucket:     "spread-florals.firebasestorage.app",
  messagingSenderId: "343526400260",
  appId:             "1:343526400260:web:b19312de883eabe520b051"
};

// Initialize Firebase and get a Firestore reference.
// Wrapped in try-catch so the app still runs if something
// goes wrong with the connection.
let db = null;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
} catch (e) {
  console.warn("Firebase init failed — running offline.", e);
}

// ─── FLOWERS ───────────────────────────────────────────────

/**
 * Save a new flower to Firestore.
 * @param {object} flower - { name, x, y, strokes }
 *   strokes: [ { color, size, points: [ {x,y}, … ] } ]
 *   x and y are fractions of screen (0–1)
 * @returns the new document reference
 */
function saveFlower(flower) {
  if (!db) { console.warn("Firestore not ready"); return Promise.resolve({ id: "offline" }); }
  return db.collection("flowers").add({
    name:    flower.name,
    x:       flower.x,          // fractional x (0–1)
    y:       flower.y,          // fractional y (0–1)
    strokes: flower.strokes,    // array of stroke objects
    t:       firebase.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Listen for newly added flowers in real time.
 * Calls `callback(id, data)` for each new flower.
 */
function listenForFlowers(callback) {
  if (!db) { console.warn("Firestore not ready — no live sync"); return; }
  db.collection("flowers")
    .orderBy("t")                       // oldest first
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === "added") {  // only new ones
          callback(change.doc.id, change.doc.data());
        }
      });
    });
}

// ─── BOUQUETS ──────────────────────────────────────────────

/**
 * Save a bouquet document.
 * @param {object} bouquet - { to, from, message, flowerIds }
 * @returns the new document reference
 */
function saveBouquet(bouquet) {
  if (!db) { console.warn("Firestore not ready"); return Promise.resolve({ id: "offline" }); }
  return db.collection("bouquets").add({
    to:        bouquet.to,
    from:      bouquet.from,
    message:   bouquet.message,
    flowerIds: bouquet.flowerIds,   // mix of Firestore ids and "lily-#"
    t:         firebase.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Load a single bouquet by its document id.
 * @param {string} id - Firestore document id
 * @returns the document data, or null
 */
async function loadBouquet(id) {
  if (!db) { console.warn("Firestore not ready"); return null; }
  const doc = await db.collection("bouquets").doc(id).get();
  return doc.exists ? doc.data() : null;
}
