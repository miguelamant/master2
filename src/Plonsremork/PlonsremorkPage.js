import React, { useState, useEffect } from 'react';
import './PlonsremorkPage.css';

const PHOTOS = [
  '/plonsremork/PLO_1.jpg',
  '/plonsremork/PLO_2.jpg',
  '/plonsremork/PLO_3.jpg',
  '/plonsremork/PLO_4.jpg',
  '/plonsremork/PLO_5.jpg',
  '/plonsremork/PLO_6.jpg',
  '/plonsremork/PLO_7.jpg',
  '/plonsremork/PLO_8.jpg',
  '/plonsremork/PLO_9.jpg',
  '/plonsremork/PLO_10.jpg',
  '/plonsremork/PLO_11.jpg',
];

const SPECS = [
  { icon: '👥', label: '8–10 personen', sub: 'comfortabele groepsgrootte' },
  { icon: '💧', label: '1.500 liter water', sub: '2 uur vullen' },
  { icon: '🌡️', label: '3 uur opwarmen', sub: '~25 houtblokken per avond' },
  { icon: '⚡', label: 'Geen elektriciteit', sub: 'convectie circulatie' },
  { icon: '⏱️', label: '40 min opstellen', sub: 'inclusief instructies' },
  { icon: '⚖️', label: '400 kg', sub: 'gewicht van de remork' },
  { icon: '📍', label: 'Afhaallocatie', sub: '1 Meilaan, Leuven' },
  { icon: '🚗', label: 'Levering tot 30 km', sub: 'rond Leuven' },
];

const STAPPEN = [
  { num: '01', titel: 'Ophalen of afspreken', tekst: 'Haal de Plonsremork op aan de 1 Meilaan in Leuven, of we leveren tot 30 km rond Leuven.' },
  { num: '02', titel: 'Opstellen (40 min)', tekst: 'Op een vlakke ondergrond. We geven je alles mee wat je nodig hebt.' },
  { num: '03', titel: 'Vullen (2 uur)', tekst: 'Sluit een tuinslang aan. 1.500 liter water – klaar in zo\'n 2 uur.' },
  { num: '04', titel: 'Opwarmen (3 uur)', tekst: 'Steek het vuur aan met de meegeleverde houtblokken. Na 3 uur is het water heerlijk warm.' },
  { num: '05', titel: 'Genieten! 🎉', tekst: 'Spring erin met je vrienden of familie. Houd het vuurtje brandend voor de perfecte avond.' },
];

const TARIEVEN = [
  { type: 'Zelf afhalen', icon: '🚗', periode3: 100, periodew: 150, beschrijving: '1 Meilaan, Leuven' },
  { type: 'Levering & installatie', icon: '📦', periode3: 200, periodew: 250, beschrijving: 'Tot 30 km rond Leuven' },
];

// ── Kalender hulpfuncties ──────────────────────────────────────────────────────

function dateToIso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isBooked(date, bezetteDatums) {
  const d = dateToIso(date);
  return bezetteDatums.some(r => d >= r.start_datum && d <= r.eind_datum);
}

function isRangeVrij(startDate, endDate, bezetteDatums) {
  let cur = new Date(startDate);
  while (cur <= endDate) {
    if (isBooked(cur, bezetteDatums)) return false;
    cur = addDays(cur, 1);
  }
  return true;
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year, month) {
  let d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Maandag = 0
}

// ── Kalender component ────────────────────────────────────────────────────────

function Kalender({ bezetteDatums, geselecteerdeStart, onSelectStart, periodeInDagen }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [jaar, setJaar] = useState(today.getFullYear());
  const [maand, setMaand] = useState(today.getMonth());

  const geselecteerdeEind = geselecteerdeStart
    ? addDays(geselecteerdeStart, periodeInDagen - 1)
    : null;

  function prevMaand() {
    if (maand === 0) { setMaand(11); setJaar(j => j - 1); }
    else setMaand(m => m - 1);
  }

  function nextMaand() {
    if (maand === 11) { setMaand(0); setJaar(j => j + 1); }
    else setMaand(m => m + 1);
  }

  const maandNamen = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'];
  const dagNamen = ['Ma','Di','Wo','Do','Vr','Za','Zo'];

  const totaalDagen = daysInMonth(jaar, maand);
  const eersteWeekdag = firstDayOfMonth(jaar, maand);

  function handleDagKlik(dag) {
    const datum = new Date(jaar, maand, dag);
    if (datum < today) return;
    const eindDatum = addDays(datum, periodeInDagen - 1);
    if (!isRangeVrij(datum, eindDatum, bezetteDatums)) return;
    onSelectStart(datum);
  }

  function getDagKlasse(dag) {
    const datum = new Date(jaar, maand, dag);
    datum.setHours(0, 0, 0, 0);
    const isoStr = dateToIso(datum);

    if (datum < today) return 'dag verleden';
    if (isBooked(datum, bezetteDatums)) return 'dag bezet';

    if (geselecteerdeStart && geselecteerdeEind) {
      if (isoStr === dateToIso(geselecteerdeStart)) return 'dag geselecteerd start';
      if (isoStr === dateToIso(geselecteerdeEind)) return 'dag geselecteerd eind';
      if (datum > geselecteerdeStart && datum < geselecteerdeEind) return 'dag geselecteerd midden';
    }

    // Check of dit als startdatum een vrije range zou geven
    const mogelijkeEind = addDays(datum, periodeInDagen - 1);
    if (!isRangeVrij(datum, mogelijkeEind, bezetteDatums)) return 'dag conflict';

    return 'dag beschikbaar';
  }

  const cellen = [];
  for (let i = 0; i < eersteWeekdag; i++) cellen.push(null);
  for (let d = 1; d <= totaalDagen; d++) cellen.push(d);

  return (
    <div className="kalender">
      <div className="kalender-header">
        <button className="kalender-nav" onClick={prevMaand}>‹</button>
        <span className="kalender-titel">{maandNamen[maand]} {jaar}</span>
        <button className="kalender-nav" onClick={nextMaand}>›</button>
      </div>
      <div className="kalender-grid">
        {dagNamen.map(d => <div key={d} className="dag-naam">{d}</div>)}
        {cellen.map((dag, i) =>
          dag === null
            ? <div key={`leeg-${i}`} />
            : (
              <button
                key={dag}
                className={getDagKlasse(dag)}
                onClick={() => handleDagKlik(dag)}
              >
                {dag}
              </button>
            )
        )}
      </div>
      <div className="kalender-legende">
        <span><span className="legende-dot beschikbaar" />Beschikbaar</span>
        <span><span className="legende-dot bezet" />Bezet</span>
        <span><span className="legende-dot geselecteerd-dot" />Geselecteerd</span>
      </div>
    </div>
  );
}

// ── Foto galerij ──────────────────────────────────────────────────────────────

function FotoGalerij() {
  const [actief, setActief] = useState(null);

  return (
    <>
      <div className="galerij-grid">
        {PHOTOS.map((src, i) => (
          <button key={i} className="galerij-item" onClick={() => setActief(i)}>
            <img src={src} alt={`Plonsremork ${i + 1}`} loading="lazy" />
          </button>
        ))}
      </div>
      {actief !== null && (
        <div className="lightbox" onClick={() => setActief(null)}>
          <button className="lightbox-sluit" onClick={() => setActief(null)}>✕</button>
          <button className="lightbox-nav links" onClick={e => { e.stopPropagation(); setActief((actief - 1 + PHOTOS.length) % PHOTOS.length); }}>‹</button>
          <img src={PHOTOS[actief]} alt="" onClick={e => e.stopPropagation()} />
          <button className="lightbox-nav rechts" onClick={e => { e.stopPropagation(); setActief((actief + 1) % PHOTOS.length); }}>›</button>
        </div>
      )}
    </>
  );
}

// ── Hoofd pagina ──────────────────────────────────────────────────────────────

export default function PlonsremorkPage() {
  const [bezetteDatums, setBezetteDatums] = useState([]);
  const [formData, setFormData] = useState({
    naam: '', email: '', telefoon: '', type: 'afhalen', periode: '3dagen',
    adres: '', bericht: '',
  });
  const [geselecteerdeStart, setGeselecteerdeStart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultaat, setResultaat] = useState(null);

  useEffect(() => {
    fetch('/api/plonsremork/bezet')
      .then(r => r.json())
      .then(data => setBezetteDatums(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const periodeInDagen = formData.periode === '3dagen' ? 3 : 7;

  const eindDatum = geselecteerdeStart ? addDays(geselecteerdeStart, periodeInDagen - 1) : null;

  function handleChange(e) {
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));
    if (e.target.name === 'periode') setGeselecteerdeStart(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!geselecteerdeStart) {
      alert('Kies een startdatum in de kalender.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/plonsremork/reservatie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          start_datum: dateToIso(geselecteerdeStart),
          eind_datum: dateToIso(eindDatum),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fout bij verzenden.');
      setResultaat({ succes: true });
      // Voeg nieuwe reservatie toe aan de bezette datums
      setBezetteDatums(prev => [...prev, {
        start_datum: dateToIso(geselecteerdeStart),
        eind_datum: dateToIso(eindDatum),
      }]);
    } catch (err) {
      setResultaat({ succes: false, bericht: err.message });
    } finally {
      setLoading(false);
    }
  }

  const prijs = TARIEVEN.find(t => t.type === (formData.type === 'afhalen' ? 'Zelf afhalen' : 'Levering & installatie'));
  const huidigePrijs = prijs ? (formData.periode === '3dagen' ? prijs.periode3 : prijs.periodew) : null;

  return (
    <div className="plons-page">

      {/* ── NAV ── */}
      <nav className="plons-nav">
        <span className="plons-nav-logo">Eventus</span>
        <div className="plons-nav-links">
          <a href="#info">Info</a>
          <a href="#fotos">Foto's</a>
          <a href="#tarieven">Tarieven</a>
          <a href="#reserveer">Reserveer</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="plons-hero" style={{ backgroundImage: `url('/plonsremork/PLO_1.jpg')` }}>
        <div className="plons-hero-overlay">
          <div className="plons-hero-content">
            <p className="plons-hero-sub">Eventus Verhuur · Leuven</p>
            <h1 className="plons-hero-titel">Plonsremork</h1>
            <p className="plons-hero-omschr">Een hot tub op wielen — perfect voor groepen van 8 tot 10 personen. Op hout gestookt, zonder elektriciteit, overal inzetbaar.</p>
            <div className="plons-hero-ctas">
              <a href="#reserveer" className="btn-primary">Reserveer nu</a>
              <a href="#info" className="btn-outline">Meer info</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPECS ── */}
      <section id="info" className="plons-sectie plons-specs">
        <div className="plons-container">
          <h2 className="sectie-titel">Alles wat je moet weten</h2>
          <div className="specs-grid">
            {SPECS.map((s, i) => (
              <div key={i} className="spec-kaart">
                <span className="spec-icon">{s.icon}</span>
                <strong className="spec-label">{s.label}</strong>
                <span className="spec-sub">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOTOS ── */}
      <section id="fotos" className="plons-sectie plons-fotos">
        <div className="plons-container">
          <h2 className="sectie-titel">Foto's</h2>
          <FotoGalerij />
        </div>
      </section>

      {/* ── HOE WERKT HET ── */}
      <section className="plons-sectie plons-stappen">
        <div className="plons-container">
          <h2 className="sectie-titel">Hoe werkt het?</h2>
          <div className="stappen-lijst">
            {STAPPEN.map((s, i) => (
              <div key={i} className="stap">
                <div className="stap-num">{s.num}</div>
                <div className="stap-tekst">
                  <strong>{s.titel}</strong>
                  <p>{s.tekst}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARIEVEN ── */}
      <section id="tarieven" className="plons-sectie plons-tarieven">
        <div className="plons-container">
          <h2 className="sectie-titel">Tarieven</h2>
          <p className="sectie-sub">Inclusief houtblokken voor één avond en volledige instructies.</p>
          <div className="tarieven-tabel-wrapper">
            <table className="tarieven-tabel">
              <thead>
                <tr>
                  <th></th>
                  <th>3 dagen</th>
                  <th>1 week</th>
                </tr>
              </thead>
              <tbody>
                {TARIEVEN.map((t, i) => (
                  <tr key={i}>
                    <td>
                      <span className="tarief-icon">{t.icon}</span>
                      <span className="tarief-naam">{t.type}</span>
                      <br />
                      <span className="tarief-omschr">{t.beschrijving}</span>
                    </td>
                    <td className="prijs-cel">€{t.periode3}</td>
                    <td className="prijs-cel">€{t.periodew}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tarieven-nota">Leveringsgebied: max. 30 km rond Leuven. Prijs is inclusief levering, installatie en ophaling.</p>
        </div>
      </section>

      {/* ── RESERVEER ── */}
      <section id="reserveer" className="plons-sectie plons-reserveer">
        <div className="plons-container reserveer-wrapper">

          {/* Formulier */}
          <div className="reserveer-form-kant">
            <h2 className="sectie-titel">Reserveer de Plonsremork</h2>
            <p className="sectie-sub">Vul het formulier in en we bevestigen zo snel mogelijk per mail of telefoon.</p>

            {resultaat?.succes ? (
              <div className="succes-bericht">
                <span className="succes-icon">✓</span>
                <h3>Aanvraag verzonden!</h3>
                <p>We nemen zo snel mogelijk contact op ter bevestiging. Check ook je spam-map.</p>
              </div>
            ) : (
              <form className="reserveer-form" onSubmit={handleSubmit}>
                <div className="form-rij">
                  <div className="form-groep">
                    <label>Naam *</label>
                    <input name="naam" value={formData.naam} onChange={handleChange} required placeholder="Voor- en achternaam" />
                  </div>
                  <div className="form-groep">
                    <label>Telefoon *</label>
                    <input name="telefoon" value={formData.telefoon} onChange={handleChange} required placeholder="+32 ..." type="tel" />
                  </div>
                </div>

                <div className="form-groep">
                  <label>E-mailadres *</label>
                  <input name="email" value={formData.email} onChange={handleChange} required placeholder="jouw@email.be" type="email" />
                </div>

                <div className="form-rij">
                  <div className="form-groep">
                    <label>Type *</label>
                    <select name="type" value={formData.type} onChange={handleChange}>
                      <option value="afhalen">Zelf afhalen (1 Meilaan, Leuven)</option>
                      <option value="levering">Levering & installatie op locatie</option>
                    </select>
                  </div>
                  <div className="form-groep">
                    <label>Periode *</label>
                    <select name="periode" value={formData.periode} onChange={handleChange}>
                      <option value="3dagen">3 dagen</option>
                      <option value="week">1 week</option>
                    </select>
                  </div>
                </div>

                {formData.type === 'levering' && (
                  <div className="form-groep">
                    <label>Leveringsadres *</label>
                    <input name="adres" value={formData.adres} onChange={handleChange} required={formData.type === 'levering'} placeholder="Straat, nr, gemeente" />
                  </div>
                )}

                <div className="form-groep">
                  <label>Extra bericht</label>
                  <textarea name="bericht" value={formData.bericht} onChange={handleChange} rows={3} placeholder="Vragen, opmerkingen, ..." />
                </div>

                {geselecteerdeStart && (
                  <div className="geselecteerde-datum-info">
                    <span>📅</span>
                    <span>
                      <strong>{geselecteerdeStart.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })}</strong>
                      {' '}t.e.m.{' '}
                      <strong>{eindDatum.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                      {huidigePrijs && <span className="datum-prijs"> — €{huidigePrijs}</span>}
                    </span>
                  </div>
                )}

                {resultaat?.succes === false && (
                  <div className="fout-bericht">{resultaat.bericht}</div>
                )}

                <button type="submit" className="btn-primary btn-submit" disabled={loading || !geselecteerdeStart}>
                  {loading ? 'Verzenden...' : 'Aanvraag verzenden'}
                </button>
              </form>
            )}
          </div>

          {/* Kalender */}
          <div className="reserveer-kalender-kant">
            <h3 className="kalender-label">Kies een startdatum</h3>
            <p className="kalender-hint">Groene datums zijn beschikbaar. Klik om te selecteren.</p>
            <Kalender
              bezetteDatums={bezetteDatums}
              geselecteerdeStart={geselecteerdeStart}
              onSelectStart={setGeselecteerdeStart}
              periodeInDagen={periodeInDagen}
            />
          </div>

        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="plons-footer">
        <div className="plons-container">
          <div className="footer-inhoud">
            <div>
              <strong>Eventus</strong>
              <p>Plonsremork verhuur in en rond Leuven.</p>
            </div>
            <div>
              <strong>Contact</strong>
              <p><a href="mailto:miguelamant@gmail.com">miguelamant@gmail.com</a></p>
            </div>
            <div>
              <strong>Afhaallocatie</strong>
              <p>1 Meilaan, Leuven</p>
            </div>
          </div>
          <p className="footer-copy">© {new Date().getFullYear()} Eventus. Alle rechten voorbehouden.</p>
        </div>
      </footer>

    </div>
  );
}
