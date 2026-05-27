/* ============================================================
   IC_TERMINAL · Tweaks
   Global controls + Tension-section (02) knobs.
   ============================================================ */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "signal": "#4d9fff",
  "tempo": 1,
  "voice": "editorial",
  "tnInputsStyle": "dots",
  "tnInputsAlign": "right",
  "tnTitleStyle": "mixed",
  "tnQuoteLayout": "stack",
  "tnRevealStyle": "blur",
  "tnStagger": 1,
  "tnSmoke": "soft",
  "tnInputsVisible": true,
  "tnInputsTicker": false,
  "tnCounter": false,
  "tnTitleSerifColor": "gray",
  "tnInputsAccent": "blue"
}/*EDITMODE-END*/;

/* Helper: set/unset a class prefix on <body> */
function setClassGroup(prefix, value) {
  const body = document.body;
  Array.from(body.classList).forEach(c => {
    if (c.startsWith(prefix)) body.classList.remove(c);
  });
  if (value) body.classList.add(prefix + value);
}

function ICTweaks() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // ── Global tweaks ──
  React.useEffect(() => {
    document.documentElement.style.setProperty('--signal', t.signal);
  }, [t.signal]);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--tempo', String(t.tempo));
    if (window.__icTerminalRotator?.restart) window.__icTerminalRotator.restart();
  }, [t.tempo]);

  React.useEffect(() => {
    document.body.classList.toggle('voice-direct', t.voice === 'direct');
    document.body.classList.toggle('voice-editorial', t.voice === 'editorial');
  }, [t.voice]);

  // ── Tension knobs ──
  React.useEffect(() => setClassGroup('tn-inputs-', t.tnInputsStyle === 'dots' ? '' : t.tnInputsStyle), [t.tnInputsStyle]);
  React.useEffect(() => setClassGroup('tn-inputs-', t.tnInputsAlign === 'right' ? '' : t.tnInputsAlign), [t.tnInputsAlign]);
  // NB: tnInputsStyle + tnInputsAlign share the 'tn-inputs-' prefix; we resolve to one combined effect:
  React.useEffect(() => {
    const body = document.body;
    Array.from(body.classList).forEach(c => { if (c.startsWith('tn-inputs-')) body.classList.remove(c); });
    if (t.tnInputsStyle && t.tnInputsStyle !== 'dots') body.classList.add('tn-inputs-' + t.tnInputsStyle);
    if (t.tnInputsAlign && t.tnInputsAlign !== 'right') body.classList.add('tn-inputs-' + t.tnInputsAlign);
    if (!t.tnInputsVisible) body.classList.add('tn-inputs-hidden');
    if (t.tnInputsTicker) body.classList.add('tn-inputs-ticker');
  }, [t.tnInputsStyle, t.tnInputsAlign, t.tnInputsVisible, t.tnInputsTicker]);

  React.useEffect(() => setClassGroup('tn-title-', t.tnTitleStyle === 'mixed' ? '' : t.tnTitleStyle), [t.tnTitleStyle]);
  React.useEffect(() => setClassGroup('tn-quote-', t.tnQuoteLayout === 'stack' ? '' : t.tnQuoteLayout), [t.tnQuoteLayout]);
  React.useEffect(() => setClassGroup('tn-reveal-', t.tnRevealStyle === 'blur' ? '' : t.tnRevealStyle), [t.tnRevealStyle]);
  React.useEffect(() => setClassGroup('tn-smoke-', t.tnSmoke === 'soft' ? '' : t.tnSmoke), [t.tnSmoke]);
  React.useEffect(() => setClassGroup('tn-tcolor-', t.tnTitleSerifColor === 'gray' ? '' : t.tnTitleSerifColor), [t.tnTitleSerifColor]);
  React.useEffect(() => setClassGroup('tn-acc-', t.tnInputsAccent === 'blue' ? '' : t.tnInputsAccent), [t.tnInputsAccent]);

  React.useEffect(() => {
    document.body.classList.toggle('tn-counter-on', !!t.tnCounter);
  }, [t.tnCounter]);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--stagger-mult', String(t.tnStagger));
  }, [t.tnStagger]);

  return (
    <TweaksPanel title="IC_TERMINAL · TWEAKS">
      <TweakSection label="Global · Signal" />
      <TweakColor
        label="Accent"
        value={t.signal}
        options={['#4d9fff', '#f0a932', '#4dd47e', '#ff5757']}
        onChange={(v) => setTweak('signal', v)}
      />

      <TweakSection label="Global · Motion" />
      <TweakSlider label="Tempo" value={t.tempo} min={0.5} max={2.0} step={0.1} unit="×"
        onChange={(v) => setTweak('tempo', v)} />

      <TweakSection label="Global · Voice" />
      <TweakRadio label="Headings" value={t.voice} options={['editorial', 'direct']}
        onChange={(v) => setTweak('voice', v)} />

      <TweakSection label="Tension · Title" />
      <TweakSelect label="Style" value={t.tnTitleStyle}
        options={['mixed', 'sans', 'serif', 'mono']}
        onChange={(v) => setTweak('tnTitleStyle', v)} />
      <TweakSelect label="Serif color" value={t.tnTitleSerifColor}
        options={['gray', 'blue', 'white']}
        onChange={(v) => setTweak('tnTitleSerifColor', v)} />

      <TweakSection label="Tension · Inputs" />
      <TweakToggle label="Show list" value={t.tnInputsVisible}
        onChange={(v) => setTweak('tnInputsVisible', v)} />
      <TweakSelect label="Marker" value={t.tnInputsStyle}
        options={['dots', 'dashes', 'numbered', 'none']}
        onChange={(v) => setTweak('tnInputsStyle', v)} />
      <TweakSelect label="Alignment" value={t.tnInputsAlign}
        options={['right', 'left', 'center']}
        onChange={(v) => setTweak('tnInputsAlign', v)} />
      <TweakSelect label="Accent color" value={t.tnInputsAccent}
        options={['blue', 'none', 'amber']}
        onChange={(v) => setTweak('tnInputsAccent', v)} />
      <TweakToggle label="Ticker mode" value={t.tnInputsTicker}
        onChange={(v) => setTweak('tnInputsTicker', v)} />

      <TweakSection label="Tension · Quote" />
      <TweakSelect label="Layout" value={t.tnQuoteLayout}
        options={['stack', 'inline', 'center']}
        onChange={(v) => setTweak('tnQuoteLayout', v)} />
      <TweakSelect label="Smoke intensity" value={t.tnSmoke}
        options={['soft', 'heavy', 'none']}
        onChange={(v) => setTweak('tnSmoke', v)} />

      <TweakSection label="Tension · Motion" />
      <TweakSelect label="Reveal style" value={t.tnRevealStyle}
        options={['blur', 'slide', 'none']}
        onChange={(v) => setTweak('tnRevealStyle', v)} />
      <TweakSlider label="Stagger" value={t.tnStagger} min={0.3} max={2.5} step={0.1} unit="×"
        onChange={(v) => setTweak('tnStagger', v)} />

      <TweakSection label="Tension · Watermark" />
      <TweakToggle label="07 counter" value={t.tnCounter}
        onChange={(v) => setTweak('tnCounter', v)} />
    </TweaksPanel>
  );
}

const __icMount = document.getElementById('tweaks-root');
if (__icMount) {
  ReactDOM.createRoot(__icMount).render(<ICTweaks />);
}
