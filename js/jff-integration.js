/* Direct JFLAP .jff integration: reads the user's actual files in-browser (no upload to a server). */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let models = { fa: null, cfg: null, ll1: null };
  function parseXML(text) {
    const xml = new DOMParser().parseFromString(text, 'application/xml');
    if (xml.querySelector('parsererror')) throw new Error('This file is not valid XML.');
    return xml;
  }
  function readFA(xml, name) {
    const states = [...xml.querySelectorAll('automaton state')].map(s => ({ id:s.getAttribute('id'), name:s.querySelector('name')?.textContent || s.getAttribute('id'), initial:!!s.querySelector('initial'), final:!!s.querySelector('final') }));
    const transitions = [...xml.querySelectorAll('automaton transition')].map(t => ({ from:t.querySelector('from')?.textContent, to:t.querySelector('to')?.textContent, read:t.querySelector('read')?.textContent ?? '' }));
    if (!states.length) throw new Error('No finite-automaton states found in this .jff file.');
    if (!states.some(s=>s.initial)) throw new Error('The automaton has no initial state.');
    return { name, states, transitions };
  }
  function readGrammar(xml, name) {
    const productions = [...xml.querySelectorAll('production')].map(p => ({ left:p.querySelector('left')?.textContent ?? '', right:p.querySelector('right')?.textContent ?? 'λ' }));
    if (!productions.length) throw new Error('No CFG productions found in this .jff file.');
    return { name, productions };
  }
  function showStatus(message, bad=false) { const el=$('jffStatus'); if(el){el.textContent=message;el.style.color=bad?'#dc2626':'#15803d';} }
  function toVisualizerModel(m) {
    const count = m.states.length;
    const width = 560, height = Math.max(320, Math.ceil(count / 3) * 150 + 80);
    const states = m.states.map((s, i) => {
      const cols = Math.min(3, count);
      const rows = Math.ceil(count / cols);
      const col = i % cols, row = Math.floor(i / cols);
      return { id: s.id, label: s.name, x: 90 + col * (width - 180) / Math.max(1, cols - 1), y: 70 + row * (height - 140) / Math.max(1, rows - 1), isStart: s.initial, isAccept: s.final };
    });
    const transitions = m.transitions.map((t, i) => {
      const loop = t.from === t.to;
      return { from: t.from, to: t.to, label: t.read === '' ? 'λ' : t.read, isLoop: loop, loopDir: i % 2 ? 'bottom' : 'top', textOffset: {x:0,y:-12} };
    });
    const start = m.states.find(s => s.initial);
    return {
      id: 'jff-loaded', name: `JFLAP: ${m.name}`,
      formal: {
        Q: `{ ${m.states.map(s => `${s.name}${s.final ? ' (accept)' : ''}`).join(', ')} }`,
        Sigma: `{ ${[...new Set(m.transitions.map(t => t.read || 'λ'))].join(', ')} }`,
        q0: start ? start.name : '—',
        F: `{ ${m.states.filter(s => s.final).map(s => s.name).join(', ')} }`,
        description: 'Loaded from the selected JFLAP .jff file. Transition rules are read from that file.'
      }, states, transitions,
      delta(state, ch) {
        const outgoing = m.transitions.filter(t => t.from === state);
        // JFLAP models may use abstract category symbols L (letter) and D (digit).
        const letter = /^[A-Za-z]$/.test(ch), digit = /^[0-9]$/.test(ch);
        const match = outgoing.find(t => {
          const r = t.read;
          if (r === ch) return true;
          if (r === 'L' && letter) return true;
          if (r === 'D' && digit) return true;
          if ((r === '[a-zA-Z]' || r === '[a-zA-Z]') && letter) return true;
          if (r === '[0-9]' && digit) return true;
          if (r === '[a-zA-Z0-9]' && (letter || digit)) return true;
          return false;
        });
        return match ? match.to : '__JFF_TRAP__';
      }
    };
  }
  function notifyVisualizer() {
    if (models.fa) {
      window.dispatchEvent(new CustomEvent('fla-jff-model-loaded', { detail: { model: toVisualizerModel(models.fa), fileName: models.fa.name } }));
    } else {
      window.dispatchEvent(new CustomEvent('fla-jff-model-cleared'));
    }
  }

  function renderModels() {
    const box=$('jffModelsView'); if(!box) return;
    let html='';
    if(models.fa) {
      html += `<section class="panel-card" style="margin-top:1rem;padding:1rem"><h3>${esc(models.fa.name)}</h3><p>States: ${models.fa.states.map(s=>`${s.initial?'→ ':''}${s.final?'*':''}${esc(s.name)}`).join(', ')}</p><h4>Transitions loaded from the actual .jff file</h4><div style="overflow:auto"><table><thead><tr><th>From</th><th>Input</th><th>To</th></tr></thead><tbody>${models.fa.transitions.map(t=>`<tr><td>${esc(models.fa.states.find(s=>s.id===t.from)?.name||t.from)}</td><td>${esc(t.read||'λ')}</td><td>${esc(models.fa.states.find(s=>s.id===t.to)?.name||t.to)}</td></tr>`).join('')}</tbody></table></div><label for="jffInput">Test input against loaded DFA</label><div style="display:flex;gap:.5rem;flex-wrap:wrap;margin:.5rem 0"><input id="jffInput" class="text-input" value="LDL" placeholder="Enter string (L/D models accept real letters/digits too)"><button id="jffRunDfa" class="btn btn-primary">Run loaded DFA</button></div><div id="jffDfaResult" aria-live="polite"></div></section>`;
    }
    const grammar = models.ll1 || models.cfg;
    if(grammar) html += `<section class="panel-card" style="margin-top:1rem;padding:1rem"><h3>${esc(grammar.name)} — productions loaded from .jff</h3><ol>${grammar.productions.map(p=>`<li><code>${esc(p.left)} → ${esc(p.right || 'λ')}</code></li>`).join('')}</ol>${models.ll1 && models.cfg ? `<p>Both canonical CFG and LL(1) grammar are loaded. Select the LL(1) grammar above to inspect its transformed productions.</p>`:''}</section>`;
    box.innerHTML=html || '<p>No JFLAP model loaded yet.</p>';
    const run=$('jffRunDfa'); if(run) run.addEventListener('click', runDFA);
  }
  function runDFA() {
    const input=$('jffInput')?.value ?? ''; const m=models.fa; const out=$('jffDfaResult'); if(!m||!out)return;
    let state=m.states.find(s=>s.initial); const trace=[state.name]; let error='';
    for(const ch of input) {
      const letter = /^[A-Za-z]$/.test(ch), digit = /^[0-9]$/.test(ch);
      const tr = m.transitions.find(t => {
        if (t.from !== state.id) return false;
        const r = t.read;
        if (r === ch) return true;
        if (r === 'L' && letter) return true;
        if (r === 'D' && digit) return true;
        if ((r === '[a-zA-Z]' || r === '[a-zA-Z]') && letter) return true;
        if (r === '[0-9]' && digit) return true;
        if (r === '[a-zA-Z0-9]' && (letter || digit)) return true;
        return false;
      });
      if(!tr){ error=`No transition from ${state.name} on "${ch}".`; state=null; break; }
      state=m.states.find(s=>s.id===tr.to); if(!state){error='Transition points to a missing state.';break;} trace.push(state.name);
    }
    const accepted=!!state && state.final && !error;
    out.innerHTML=`<p style="font-weight:700;color:${accepted?'#15803d':'#dc2626'}">${accepted?'ACCEPTED':'REJECTED'}</p><p>State trace: ${trace.map(esc).join(' → ')}</p>${error?`<p>${esc(error)}</p>`:''}<p style="font-size:.85em;color:var(--text-secondary,#6b7280)">This result is computed from the transitions parsed from the selected .jff file.</p>`;
  }
  async function loadFiles(fileList) {
    const files=[...fileList]; if(!files.length)return;
    let loaded=[]; let errors=[];
    for(const file of files) {
      try {
        const xml=parseXML(await file.text()); const type=xml.querySelector('type')?.textContent?.trim();
        const lower=file.name.toLowerCase();
        if(type==='fa' || xml.querySelector('automaton')) { models.fa=readFA(xml,file.name); loaded.push(file.name+' (finite automaton)'); }
        else if(type==='grammar' || xml.querySelector('production')) {
          const g=readGrammar(xml,file.name);
          if(lower.includes('ll1') || lower.includes('ll(1)')) models.ll1=g; else models.cfg=g;
          loaded.push(file.name+' (CFG)');
        } else errors.push(file.name+': unrecognized JFLAP model type');
      } catch(e) { errors.push(file.name+': '+e.message); }
    }
    renderModels();
    notifyVisualizer();
    showStatus((loaded.length?'Loaded: '+loaded.join(', '):'No models loaded.')+(errors.length?' | Issues: '+errors.join('; '):''),!loaded.length || !!errors.length);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const input=$('jffFilesInput'); if(input) input.addEventListener('change',e=>loadFiles(e.target.files));
    const load=$('jffLoadButton'); if(load) load.addEventListener('click',()=>input?.click());
    const clear=$('jffClearButton'); if(clear) clear.addEventListener('click',()=>{models={fa:null,cfg:null,ll1:null};if(input)input.value='';renderModels();notifyVisualizer();showStatus('Loaded models cleared.');});
  });
})();
