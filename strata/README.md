# Strata

An unofficial, personal concept for an expedition kit planner. Pick a place, set the weather, and get a layering system built from real Arc'teryx products, shown as 3D models.

- Scroll-driven opening: a lit fossil in rock that turns into a storm film
- Plan: place, weather (live snow, rain and wind), layers
- Gear: 24 products with listed prices and specs, each linked to its official page
- Kit: sizes, quantities, total and a concept confirmation (no payment)
- Generative soundtrack and interface sounds, made in the browser with Web Audio

Built with Three.js. Images, film and 3D models were generated with Higgsfield. The 3D models are generic stand-ins for each garment type, not the actual products.

Product data was read from arcteryx.com/us on 11 Nov 2026 and may be out of date. Not affiliated with Arc'teryx.

## Run it locally

The 3D models load over HTTP, so open it through a local server:

```
cd strata
python3 -m http.server
```

Then go to http://localhost:8000.
