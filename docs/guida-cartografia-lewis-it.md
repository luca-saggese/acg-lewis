# Guida rapida: Cartografia di Lewis e lettura del JSON

Questa libreria calcola le mappe Astro*Carto*Graphy (ACG) in stile Jim Lewis. Qui trovi una spiegazione sintetica di come funziona e di come interpretare il payload JSON restituito dall'API o dallo script demo.

## Idee di base (cartografia di Lewis)
- Si parte da una carta natale: data/ora (con timezone), luogo di nascita (lat, lon, alt) e i corpi scelti.
- Ogni corpo puo trovarsi su quattro angoli geografici: MC (culminazione), IC (anticulminazione), ASC (sorgere), DSC (tramonto). Ogni angolo diventa una linea che attraversa il globo.
- Le linee MC/IC sono meridiani: longitudine costante. Le ASC/DSC sono curve che seguono dove il corpo e appena sopra o sotto l'orizzonte.
- Le linee di Local Space mostrano la direzione azimutale dal luogo natale verso ciascun corpo (grande cerchio che parte dal luogo natale).
- I crossing indicano incroci tra linee (reali o pseudo-incroci vicini).
- Le parans sono combinazioni di due corpi che toccano angoli diversi alla stessa latitudine (fenomeno tipico delle latitudini temperate e polari).

## Cosa inserire (input)
- `datetime`: anno, mese, giorno, ora, minuto, timezone IANA (es. "Europe/Rome").
- `location`: `lat`, `lon`, opzionale `alt` (metri).
- `bodies`: elenco di corpi (es. `sun, moon, mercury, venus, mars`).
- `options`: sistema zodiacale (`tropical`/`sidereal`), orb angolare, passo campionamento per ASC/DSC, larghezza geo (`geoOrbKm`), ecc.
- `radiusKm`: raggio di ricerca per l'analisi locale.

## Cosa restituiamo (output JSON)
Ogni chiave qui sotto corrisponde a una sezione del payload (`{ acg, parans, localSpace, relocation, analysis }`).

### `acg`
- `gst`: tempo siderale di Greenwich (ore) per la data.
- `bodies`: posizioni calcolate (RA, DEC, longitudine eclittica, ecc.).
- `lines`: tutte le linee ACG. Ogni linea ha:
  - `kind`: `MC | IC | ASC | DSC`.
  - `body`: corpo associato.
  - `coordinates`: array di { lat, lon } lungo la linea.
  - `geojson`: LineString per consumo GeoJSON.
- `crossings`: incroci tra linee; `classification` puo essere `real` o `pseudo` (vicinanza). `lines` contiene la coppia di linee che incrocia.

### `parans`
- `parans`: array di oggetti con
  - `latitude`: latitudine dove il fenomeno avviene.
  - `bodies`: coppia di corpi.
  - `angles`: coppia di angoli coinvolti (es. ASC/MC).
  - `orbDeg`: orb angolare residuo (quanto sono vicini all'esatto paran).

### `localSpace`
- `origin`: luogo natale usato come origine.
- `lines`: per ogni corpo:
  - `bearing`: azimut (gradi da Nord) della direzione iniziale.
  - `coordinates`: grande cerchio che parte da `origin` nella direzione del corpo.

### `relocation`
- `angles`: valori di ASC/MC/IC/DSC per il luogo considerato (se fornito nella richiesta).
- `houses`: cuspidi per sistemi di case (quando calcolate).

### `analysis`
- Valuta quanto il luogo scelto e vicino alle linee e alle parans.
- `city`: coordinate usate per l'analisi.
- `radiusKm`: raggio considerato.
- `active`: linee ACG entro `radiusKm`, con
  - `body`, `angle`, `distanceKm`, `strength` (strong/medium/weak da `geoOrbKm`), `force` (decadimento esponenziale della distanza).
- `parans`: parans rilevanti per la latitudine della citta (entro `radiusKm/111` gradi di latitudine).
- `ranking`: gli stessi elementi di `active` ordinati per peso composito (priorita di angolo, corpo personale/sociale, strength e force).
- Se `active` e `ranking` sono vuoti, nessuna linea cade nel raggio scelto: aumentare `radiusKm` o `geoOrbKm` se si vuole allargare la finestra.

## Come leggere il file di esempio
Lo script `scripts/generate-demo-json.js` salva in `scripts/output/demo-1974-08-12T09-00.json` il payload completo per: 12/08/1974 09:00, lat 42, lon 12, timezone Europe/Rome, corpi base (Sun, Moon, Mercury, Venus, Mars).

## Suggerimenti pratici
- Per visualizzare su mappa: usa `acg.lines` (polilinee) e `acg.crossings` (marker). Local Space: polilinee radiali da `localSpace.origin`.
- Per domande di interpretazione: le linee mostrano dove nel mondo quel pianeta e angolare; la forza decresce con la distanza dalla linea (usa `distanceKm`, `strength`, `force`).
- Per avere piu dati locali: aumenta `radiusKm` (es. 800-1200 km) e un `geoOrbKm` coerente (es. 300-500 km).
