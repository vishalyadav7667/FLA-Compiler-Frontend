/**
 * FLA-Lang: Main Application Controller
 * Connects Lexer, Parser, Automata Simulator, Test Suite and UI
 */

document.addEventListener('DOMContentLoaded', () => {
  // Instances
  const lexer = new FLALexer.Lexer();
  const parser = new FLAParser.Parser();
  const automataSim = new FLAAutomata.AutomataSimulator('identifier');

  // DOM Elements - Editor
  const codeEditor = document.getElementById('codeEditor');
  const lineNumbers = document.getElementById('lineNumbers');
  const runBtn = document.getElementById('runBtn');
  const clearBtn = document.getElementById('clearBtn');
  const copyBtn = document.getElementById('copyBtn');
  const cursorStatus = document.getElementById('cursorStatus');
  const analysisStatus = document.getElementById('analysisStatus');

  // DOM Elements - Workspace Output
  const tokenTableBody = document.getElementById('tokenTableBody');
  const tokenCountBadge = document.getElementById('tokenCountBadge');
  const treeContainer = document.getElementById('treeContainer');
  const derivationsContainer = document.getElementById('derivationsContainer');
  const diagnosticsBanner = document.getElementById('diagnosticsBanner');

  // DOM Elements - Automata
  const automataSvgContainer = document.getElementById('automataSvgContainer');
  const modelIdentifierBtn = document.getElementById('modelIdentifierBtn');
  const modelNumberBtn = document.getElementById('modelNumberBtn');
  const simInput = document.getElementById('simInput');
  const simStepBtn = document.getElementById('simStepBtn');
  const simRunBtn = document.getElementById('simRunBtn');
  const simResetBtn = document.getElementById('simResetBtn');
  const tapeContainer = document.getElementById('tapeContainer');
  const traceLog = document.getElementById('traceLog');
  const simVerdict = document.getElementById('simVerdict');
  const specQ = document.getElementById('specQ');
  const specSigma = document.getElementById('specSigma');
  const specQ0 = document.getElementById('specQ0');
  const specF = document.getElementById('specF');
  const specDesc = document.getElementById('specDesc');

  // DOM Elements - Test Suite
  const runAllTestsBtn = document.getElementById('runAllTestsBtn');
  const testsGrid = document.getElementById('testsGrid');
  const testsPassedCount = document.getElementById('testsPassedCount');
  const testsTotalCount = document.getElementById('testsTotalCount');
  const testsTimeMs = document.getElementById('testsTimeMs');

  // =========================================================================
  // 1. Line Numbers & Cursor Tracking
  // =========================================================================
  function updateLineNumbers() {
    const lines = codeEditor.value.split('\n').length;
    let numbersHtml = '';
    for (let i = 1; i <= Math.max(lines, 1); i++) {
      numbersHtml += `${i}<br>`;
    }
    lineNumbers.innerHTML = numbersHtml;
  }

  function updateCursorPosition() {
    const pos = codeEditor.selectionStart;
    const textToCursor = codeEditor.value.substring(0, pos);
    const lines = textToCursor.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    cursorStatus.textContent = `Ln ${line}, Col ${col}`;
  }

  codeEditor.addEventListener('input', () => {
    updateLineNumbers();
    updateCursorPosition();
  });

  codeEditor.addEventListener('keyup', updateCursorPosition);
  codeEditor.addEventListener('click', updateCursorPosition);

  // Sync scrolling between line numbers and code editor
  codeEditor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = codeEditor.scrollTop;
  });

  // Handle Tab key in editor
  codeEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeEditor.selectionStart;
      const end = codeEditor.selectionEnd;
      codeEditor.value = codeEditor.value.substring(0, start) + '  ' + codeEditor.value.substring(end);
      codeEditor.selectionStart = codeEditor.selectionEnd = start + 2;
      updateLineNumbers();
    }
  });

  // =========================================================================
  // 2. Navigation Tabs & Subtabs
  // =========================================================================
  const pageHeaderTitle = document.getElementById('pageHeaderTitle');
  const pageHeaderSubtitle = document.getElementById('pageHeaderSubtitle');

  const HEADER_CONFIG = {
    workspaceTab: {
      title: 'Compiler Workspace',
      subtitle: 'Write, analyze, and validate source code.'
    },
    automataTab: {
      title: 'Automata Visualizer',
      subtitle: 'Inspect state transitions, DFAs, and simulate string acceptance.'
    },
    testSuiteTab: {
      title: 'Automated Test Suite',
      subtitle: 'Run regression test cases and verify compiler stages.'
    }
  };

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(btn.dataset.target);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }

      const conf = HEADER_CONFIG[btn.dataset.target];
      if (conf) {
        if (pageHeaderTitle) pageHeaderTitle.textContent = conf.title;
        if (pageHeaderSubtitle) pageHeaderSubtitle.textContent = conf.subtitle;
      }

      // Close mobile sidebar on nav click
      const appSidebar = document.getElementById('appSidebar');
      if (appSidebar) {
        appSidebar.classList.remove('open');
      }

      // If switching to automata tab, refresh SVG
      if (btn.dataset.target === 'automataTab') {
        renderCurrentAutomata();
      }
    });
  });

  const mobileToggle = document.getElementById('mobileSidebarToggle');
  const appSidebar = document.getElementById('appSidebar');
  if (mobileToggle && appSidebar) {
    mobileToggle.addEventListener('click', () => {
      appSidebar.classList.toggle('open');
    });
  }

  document.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.subpanel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetSubpanel = document.getElementById(btn.dataset.subtarget);
      if (targetSubpanel) {
        targetSubpanel.classList.add('active');
      }
    });
  });

  // =========================================================================
  // 3. Examples Loading
  // =========================================================================
  const EXAMPLES = {
    default: "int x = 10;\nx = a + 5;",
    arithmetic: "float rate = 12.5;\nresult = (a + 5) * b - c / 2;",
    conditional: "if (x > 10) {\n  y = 1;\n} else {\n  y = 0;\n}",
    whileLoop: "while (count < 5) {\n  count = count + 1;\n}",
    errSemicolon: "int x = 10\nx = 20;",
    errParen: "x = (a + 5 * b;",
    errLexical: "int x = 10 @ 5;"
  };

  document.querySelectorAll('.chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      const exKey = chip.dataset.example;
      if (EXAMPLES[exKey]) {
        codeEditor.value = EXAMPLES[exKey];
        updateLineNumbers();
        updateCursorPosition();
        runAnalysis();
      }
    });
  });

  // Clear Button
  clearBtn.addEventListener('click', () => {
    codeEditor.value = '';
    updateLineNumbers();
    updateCursorPosition();
    resetOutputPanels();
  });

  // Copy Code
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(codeEditor.value).then(() => {
      const orig = copyBtn.innerHTML;
      copyBtn.innerHTML = '✓ Copied';
      setTimeout(() => { copyBtn.innerHTML = orig; }, 1500);
    });
  });

  // =========================================================================
  // 4. Run Analysis (Lexer + Parser)
  // =========================================================================
  function runAnalysis() {
    const source = codeEditor.value;
    if (!source.trim()) {
      resetOutputPanels();
      return;
    }

    // Phase 1: Lexical Analysis
    lexer.reset(source);
    const lexResult = lexer.tokenize();

    // Populate Token Table
    renderTokenTable(lexResult.tokens);
    tokenCountBadge.textContent = `${lexResult.tokens.length} tokens`;

    // Phase 2: Syntax Analysis
    parser.reset(lexResult.tokens);
    const parseResult = parser.parse();

    // Render Diagnostics & Status
    const hasLexErrors = lexResult.errors.length > 0;
    const hasParseErrors = parseResult.errors.length > 0;

    if (!hasLexErrors && !hasParseErrors) {
      analysisStatus.className = 'status-badge success';
      analysisStatus.textContent = 'Syntax Valid';
      if (mlParserVerdictBadge) {
        mlParserVerdictBadge.className = 'badge badge-success';
        mlParserVerdictBadge.textContent = 'PASS';
      }
      diagnosticsBanner.className = 'diagnostics-banner success';
      diagnosticsBanner.style.display = 'block';
      diagnosticsBanner.innerHTML = `
        <div>
          <div class="diag-title">Lexical and Syntactic Analysis Succeeded</div>
        </div>
      `;
    } else {
      analysisStatus.className = 'status-badge error';
      analysisStatus.textContent = 'Analysis Errors';
      if (mlParserVerdictBadge) {
        mlParserVerdictBadge.className = 'badge badge-danger';
        mlParserVerdictBadge.textContent = 'FAIL';
      }
      diagnosticsBanner.className = 'diagnostics-banner error';
      diagnosticsBanner.style.display = 'block';

      const errorMessages = [];
      lexResult.errors.forEach(e => errorMessages.push(`<strong>Lexical:</strong> ${escapeHtml(e.toString())}`));
      parseResult.errors.forEach(e => errorMessages.push(`<strong>Syntax:</strong> ${escapeHtml(e.toString())}`));

      diagnosticsBanner.innerHTML = `
        <div>
          <div class="diag-title">Analysis Found ${errorMessages.length} Diagnostic Issue(s)</div>
          <div style="font-size: 0.8rem; margin-top: 0.25rem;">${errorMessages.join('<br>')}</div>
        </div>
      `;
    }

    // Render AST / Parse Tree
    renderAST(parseResult.ast || parseResult.partialAst);

    // Render Derivations
    renderDerivations(parseResult.derivations);

    // Run Machine Learning Code Prediction
    updateMLPrediction(source);
  }

  runBtn.addEventListener('click', runAnalysis);

  function resetOutputPanels() {
    tokenTableBody.innerHTML = `<tr><td colspan="5" class="empty-state">No source code analyzed yet. Click "Run Analysis".</td></tr>`;
    tokenCountBadge.textContent = '0 tokens';
    treeContainer.innerHTML = `<div class="empty-state">Parse tree will appear here after running analysis.</div>`;
    derivationsContainer.innerHTML = `<div class="empty-state">Derivation sequence will appear here after analysis.</div>`;
    diagnosticsBanner.className = 'diagnostics-banner';
    diagnosticsBanner.style.display = 'none';
    analysisStatus.className = 'status-badge ready';
    analysisStatus.textContent = 'Ready';
    resetMLPredictionPanel();
  }

  // =========================================================================
  // 5. Renderers: Tokens, AST, Derivations
  // =========================================================================
  function renderTokenTable(tokens) {
    if (!tokens || tokens.length === 0) {
      tokenTableBody.innerHTML = `<tr><td colspan="5" class="empty-state">No tokens found.</td></tr>`;
      return;
    }

    let html = '';
    tokens.forEach((t, i) => {
      const escapedVal = escapeHtml(t.value);
      html += `
        <tr>
          <td style="color: var(--text-faint);">${i + 1}</td>
          <td style="font-weight: 600; color: var(--text-bright);">${escapedVal}</td>
          <td><span class="token-tag tag-${t.type}">${t.type}</span></td>
          <td style="color: var(--text-muted);">${t.subtype || '-'}</td>
          <td style="color: var(--text-faint);">Line ${t.line}, Col ${t.column}</td>
        </tr>
      `;
    });
    tokenTableBody.innerHTML = html;
  }

  function renderAST(node) {
    if (!node) {
      treeContainer.innerHTML = `<div class="empty-state">Parse tree could not be generated due to fatal syntax errors.</div>`;
      return;
    }

    function buildNodeHtml(n) {
      if (!n || typeof n !== 'object') {
        return `<span class="tree-val">${escapeHtml(String(n))}</span>`;
      }

      if (Array.isArray(n)) {
        if (n.length === 0) return `<span style="color: var(--text-faint);">[]</span>`;
        return n.map(child => `<div class="tree-node">${buildNodeHtml(child)}</div>`).join('');
      }

      let header = `<span class="tree-label node-type">${n.type || 'Node'}</span>`;
      let details = [];

      if (n.dataType) details.push(`<span style="color: var(--accent-amber);">type: ${n.dataType}</span>`);
      if (n.id) details.push(`<span class="tree-val">id: "${n.id}"</span>`);
      if (n.operator) details.push(`<span class="tree-val">op: "${n.operator}"</span>`);
      if (n.name) details.push(`<span class="tree-val">name: "${n.name}"</span>`);
      if (n.value !== undefined) details.push(`<span class="tree-val">val: ${n.value} (${n.literalType || 'lit'})</span>`);

      if (details.length > 0) {
        header += ' ' + details.join(' ');
      }

      let childrenHtml = '';
      if (n.statements) {
        childrenHtml += `<div class="tree-node"><span class="tree-label">statements</span>${buildNodeHtml(n.statements)}</div>`;
      }
      if (n.init) {
        childrenHtml += `<div class="tree-node"><span class="tree-label">init</span>${buildNodeHtml(n.init)}</div>`;
      }
      if (n.expr) {
        childrenHtml += `<div class="tree-node"><span class="tree-label">expr</span>${buildNodeHtml(n.expr)}</div>`;
      }
      if (n.condition) {
        childrenHtml += `<div class="tree-node"><span class="tree-label">condition</span>${buildNodeHtml(n.condition)}</div>`;
      }
      if (n.thenBranch) {
        childrenHtml += `<div class="tree-node"><span class="tree-label">then</span>${buildNodeHtml(n.thenBranch)}</div>`;
      }
      if (n.elseBranch) {
        childrenHtml += `<div class="tree-node"><span class="tree-label">else</span>${buildNodeHtml(n.elseBranch)}</div>`;
      }
      if (n.body) {
        childrenHtml += `<div class="tree-node"><span class="tree-label">body</span>${buildNodeHtml(n.body)}</div>`;
      }
      if (n.left) {
        childrenHtml += `<div class="tree-node"><span class="tree-label">left</span>${buildNodeHtml(n.left)}</div>`;
      }
      if (n.right) {
        childrenHtml += `<div class="tree-node"><span class="tree-label">right</span>${buildNodeHtml(n.right)}</div>`;
      }
      if (n.argument) {
        childrenHtml += `<div class="tree-node"><span class="tree-label">operand</span>${buildNodeHtml(n.argument)}</div>`;
      }

      return `<div>${header}${childrenHtml}</div>`;
    }

    treeContainer.innerHTML = `<div class="tree-root">${buildNodeHtml(node)}</div>`;
  }

  function renderDerivations(derivations) {
    if (!derivations || derivations.length === 0) {
      derivationsContainer.innerHTML = `<div class="empty-state">No derivation steps recorded.</div>`;
      return;
    }

    let html = '';
    derivations.forEach((d, i) => {
      html += `
        <div class="derivation-item">
          <span style="color: var(--text-faint); min-width: 25px;">${i + 1}.</span>
          <span class="rule-tag">${d.ruleId}</span>
          <span class="rule-desc">${escapeHtml(d.description)}</span>
        </div>
      `;
    });
    derivationsContainer.innerHTML = html;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // 6. Automata Visualization & Interactive Step Simulator
  // =========================================================================
  // Direct bridge for models parsed from real JFLAP .jff files.
  const builtInIdentifierModel = automataSim.model;
  let builtInModelKey = 'identifier';
  window.addEventListener('fla-jff-model-loaded', event => {
    const model = event.detail && event.detail.model;
    if (!model) return;
    automataSim.model = model;
    automataSim.modelKey = 'jff-loaded';
    modelIdentifierBtn.classList.remove('active');
    modelNumberBtn.classList.remove('active');
    simInput.value = /number/i.test(event.detail.fileName || '') ? '12345' : 'totalScore2';
    automataSim.reset(simInput.value);
    renderCurrentAutomata();
    if (simVerdict) simVerdict.innerHTML = '<span style="color:var(--accent-cyan)">Using the selected JFLAP model. L = letter and D = digit when those abstract symbols are present.</span>';
  });
  window.addEventListener('fla-jff-model-cleared', () => {
    automataSim.loadModel(builtInModelKey);
    modelIdentifierBtn.classList.toggle('active', builtInModelKey === 'identifier');
    modelNumberBtn.classList.toggle('active', builtInModelKey === 'number');
    simInput.value = builtInModelKey === 'number' ? '123.45' : 'totalScore2';
    automataSim.reset(simInput.value);
    renderCurrentAutomata();
  });

  function renderCurrentAutomata() {
    const model = automataSim.model;
    automataSvgContainer.innerHTML = FLAAutomata.renderAutomataSVG(model, automataSim.currentState);

    // Update specs card
    specQ.textContent = model.formal.Q;
    specSigma.textContent = model.formal.Sigma;
    specQ0.textContent = model.formal.q0;
    specF.textContent = model.formal.F;
    specDesc.textContent = model.formal.description;

    // Render Tape
    renderTape();

    // Render Trace Log
    renderTraceLog();

    // Update Verdict
    updateVerdict();
  }

  function renderTape() {
    const input = automataSim.inputString;
    const curIdx = automataSim.currentIndex;

    if (!input) {
      tapeContainer.innerHTML = `<span style="color: var(--text-faint); font-size: 0.8rem;">(Tape empty: enter an input string above)</span>`;
      return;
    }

    let html = '';
    for (let i = 0; i < input.length; i++) {
      let cls = 'tape-cell';
      if (i < curIdx) cls += ' processed';
      if (i === curIdx && !automataSim.isFinished) cls += ' active-head';
      html += `<div class="${cls}">${escapeHtml(input[i])}</div>`;
    }
    tapeContainer.innerHTML = html;
  }

  function renderTraceLog() {
    let html = '';
    automataSim.history.forEach((h, i) => {
      const isLatest = i === automataSim.history.length - 1;
      html += `<div class="trace-entry ${isLatest ? 'highlight' : ''}">Step ${i}: ${h.action} → state: [${h.state}]</div>`;
    });
    traceLog.innerHTML = html;
    traceLog.scrollTop = traceLog.scrollHeight;
  }

  function updateVerdict() {
    if (!automataSim.inputString) {
      simVerdict.innerHTML = `<span style="color: var(--text-secondary); font-size: 0.85rem;">Awaiting input string...</span>`;
      return;
    }

    if (automataSim.isFinished) {
      if (automataSim.isAccepted()) {
        simVerdict.innerHTML = `<span style="color: var(--success); font-weight: 600;">Accepted by ${escapeHtml(automataSim.model.name)}</span>`;
      } else {
        simVerdict.innerHTML = `<span style="color: var(--error); font-weight: 600;">Rejected (Halted in non-accepting state: ${escapeHtml(automataSim.currentState)})</span>`;
      }
    } else {
      simVerdict.innerHTML = `<span style="color: var(--primary);">Simulating (Current state: <strong>${escapeHtml(automataSim.currentState)}</strong>, position ${automataSim.currentIndex}/${automataSim.inputString.length})</span>`;
    }
  }

  modelIdentifierBtn.addEventListener('click', () => {
    modelIdentifierBtn.classList.add('active');
    modelNumberBtn.classList.remove('active');
    builtInModelKey = 'identifier';
    automataSim.loadModel('identifier');
    simInput.value = 'totalScore2';
    automataSim.reset(simInput.value);
    renderCurrentAutomata();
  });

  modelNumberBtn.addEventListener('click', () => {
    modelNumberBtn.classList.add('active');
    modelIdentifierBtn.classList.remove('active');
    builtInModelKey = 'number';
    automataSim.loadModel('number');
    simInput.value = '123.45';
    automataSim.reset(simInput.value);
    renderCurrentAutomata();
  });

  simInput.addEventListener('input', () => {
    automataSim.reset(simInput.value);
    renderCurrentAutomata();
  });

  simStepBtn.addEventListener('click', () => {
    automataSim.step();
    renderCurrentAutomata();
  });

  simRunBtn.addEventListener('click', () => {
    automataSim.runAll();
    renderCurrentAutomata();
  });

  simResetBtn.addEventListener('click', () => {
    automataSim.reset(simInput.value);
    renderCurrentAutomata();
  });

  // =========================================================================
  // 7. Test Suite Execution
  // =========================================================================
  function renderTestSuite() {
    const suite = FLATestSuite.runAllTests();

    const passedCountEl = document.getElementById('testsPassedCount');
    const totalCountEl = document.getElementById('testsTotalCount');
    const failedCountEl = document.getElementById('testsFailedCount');
    const percentEl = document.getElementById('testsPercent');
    const timeMsEl = document.getElementById('testsTimeMs');

    if (passedCountEl) passedCountEl.textContent = `${suite.summary.passed}`;
    if (totalCountEl) totalCountEl.textContent = `${suite.summary.total}`;
    if (failedCountEl) failedCountEl.textContent = `${suite.summary.failed}`;
    if (percentEl) percentEl.textContent = `${Math.round((suite.summary.passed / suite.summary.total) * 100)}%`;
    if (timeMsEl) timeMsEl.textContent = `${suite.summary.executionTimeMs} ms`;

    // Also update any sidebar badges if present
    const sidebarBadge = document.getElementById('sidebarTestBadge');
    if (sidebarBadge) sidebarBadge.textContent = `${suite.summary.passed}/${suite.summary.total}`;

    let html = `
      <div class="test-table-card">
        <div style="overflow-x: auto;">
          <table class="test-table">
            <thead>
              <tr>
                <th style="min-width: 240px;">Test</th>
                <th>Category</th>
                <th>Expected</th>
                <th>Actual</th>
                <th>Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
    `;

    suite.results.forEach(res => {
      const statusBadge = res.passed
        ? '<span class="status-badge success">Passed</span>'
        : '<span class="status-badge error">Failed</span>';

      const expectedSummary = res.expected.errorMessage
        ? `Error: ${escapeHtml(res.expected.errorMessage)}`
        : `Lexer: ${res.expected.lexerSuccess ? 'Pass' : 'Fail'}, Parser: ${res.expected.parserSuccess ? 'Pass' : 'Fail'}`;

      let actualSummary = '';
      if (res.actual.errors && res.actual.errors.length > 0) {
        actualSummary = `<span style="color: var(--error);">${escapeHtml(res.actual.errors[0])}</span>`;
      } else {
        actualSummary = `Tokens: ${res.actual.tokenCount}, Syntax: Pass`;
      }

      html += `
        <tr>
          <td>
            <div style="font-weight: 600; color: var(--text-heading); margin-bottom: 0.25rem;">
              <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-secondary); margin-right: 0.35rem;">${res.id}</span>
              ${escapeHtml(res.title)}
            </div>
            <code class="test-code-snippet">${escapeHtml(res.code.replace(/\n/g, ' '))}</code>
          </td>
          <td>
            <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">${escapeHtml(res.category)}</span>
          </td>
          <td>
            <div style="font-size: 0.75rem; color: var(--text-secondary); max-width: 200px;">${expectedSummary}</div>
          </td>
          <td>
            <div style="font-size: 0.75rem; color: var(--text-primary); max-width: 220px;">${actualSummary}</div>
          </td>
          <td>${statusBadge}</td>
          <td style="text-align: right;">
            <button class="btn btn-sm load-test-btn" data-code="${escapeHtml(res.code)}">Load in Editor</button>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (testsGrid) {
      testsGrid.innerHTML = html;
    }

    // Attach event listeners to "Load in Editor" buttons
    document.querySelectorAll('.load-test-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        codeEditor.value = code;
        updateLineNumbers();
        updateCursorPosition();

        // Switch to Workspace Tab
        document.querySelector('.tab-btn[data-target="workspaceTab"]').click();
        runAnalysis();
      });
    });
  }

  runAllTestsBtn.addEventListener('click', renderTestSuite);

  // =========================================================================
  // 6. Machine Learning Code Predictor Integration
  // =========================================================================
  const mlModelBadge = document.getElementById('mlModelBadge');
  const mlLoadCustomBtn = document.getElementById('mlLoadCustomBtn');
  const mlModelFileInput = document.getElementById('mlModelFileInput');
  const mlModelAlert = document.getElementById('mlModelAlert');
  const mlParserVerdictBadge = document.getElementById('mlParserVerdictBadge');
  const mlPredictorVerdictBadge = document.getElementById('mlPredictorVerdictBadge');
  const mlPredictedClass = document.getElementById('mlPredictedClass');
  const mlConfidenceScore = document.getElementById('mlConfidenceScore');
  const mlProbBreakdown = document.getElementById('mlProbBreakdown');
  const mlTopFeaturesContainer = document.getElementById('mlTopFeaturesContainer');

  const mlPredictor = (typeof FLAML !== 'undefined' && FLAML.MLPredictor) ? new FLAML.MLPredictor() : null;

  function updateMLPrediction(source) {
    if (!mlPredictor || !mlPredictor.isLoaded()) {
      if (mlPredictedClass) mlPredictedClass.textContent = 'Model Not Loaded';
      if (mlConfidenceScore) mlConfidenceScore.textContent = '--';
      if (mlProbBreakdown) mlProbBreakdown.textContent = 'Load ml_model.json to enable statistical predictions';
      if (mlPredictorVerdictBadge) {
        mlPredictorVerdictBadge.className = 'badge badge-neutral';
        mlPredictorVerdictBadge.textContent = 'N/A';
      }
      return;
    }

    if (!source || !source.trim()) {
      resetMLPredictionPanel();
      return;
    }

    const pred = mlPredictor.predict(source);
    const isValid = pred.prediction === 'valid';

    if (mlPredictorVerdictBadge) {
      mlPredictorVerdictBadge.className = isValid ? 'badge badge-success' : 'badge badge-danger';
      mlPredictorVerdictBadge.textContent = isValid ? 'VALID' : 'INVALID';
    }

    if (mlPredictedClass) {
      mlPredictedClass.className = isValid ? 'success-text' : 'error-text';
      mlPredictedClass.textContent = isValid ? 'Valid Code' : 'Invalid / Malformed Code';
    }

    if (mlConfidenceScore) {
      mlConfidenceScore.textContent = `${(pred.confidence * 100).toFixed(1)}%`;
    }

    if (mlProbBreakdown) {
      mlProbBreakdown.textContent = `P(Valid)=${pred.probabilities.valid.toFixed(3)}, P(Invalid)=${pred.probabilities.invalid.toFixed(3)}`;
    }

    if (mlTopFeaturesContainer) {
      mlTopFeaturesContainer.innerHTML = '';
      if (!pred.topFeatures || pred.topFeatures.length === 0) {
        mlTopFeaturesContainer.innerHTML = '<span class="text-muted" style="font-size: 0.8rem;">No discriminating vocabulary n-grams found in input.</span>';
      } else {
        pred.topFeatures.forEach(f => {
          const tag = document.createElement('span');
          const isFavValid = f.favors === 'valid';
          tag.className = `ml-feature-tag ${isFavValid ? 'favors-valid' : 'favors-invalid'}`;
          const sign = f.diff > 0 ? '+' : '';
          tag.innerHTML = `<code>${escapeHtml(JSON.stringify(f.ngram))}</code> <span style="font-size: 0.7rem; opacity: 0.85;">(${f.favors} ${sign}${f.diff.toFixed(2)})</span>`;
          mlTopFeaturesContainer.appendChild(tag);
        });
      }
    }
  }

  function resetMLPredictionPanel() {
    if (mlPredictorVerdictBadge) {
      mlPredictorVerdictBadge.className = 'badge badge-neutral';
      mlPredictorVerdictBadge.textContent = '--';
    }
    if (mlPredictedClass) {
      mlPredictedClass.className = '';
      mlPredictedClass.textContent = '--';
    }
    if (mlConfidenceScore) mlConfidenceScore.textContent = '--';
    if (mlProbBreakdown) mlProbBreakdown.textContent = '--';
    if (mlTopFeaturesContainer) {
      mlTopFeaturesContainer.innerHTML = '<span class="text-muted" style="font-size: 0.8rem;">Run analysis on code to extract influential character n-grams.</span>';
    }
    if (mlParserVerdictBadge) {
      mlParserVerdictBadge.className = 'badge badge-neutral';
      mlParserVerdictBadge.textContent = 'READY';
    }
  }

  function initMLPredictor() {
    if (!mlPredictor) return;

    if (mlLoadCustomBtn && mlModelFileInput) {
      mlLoadCustomBtn.addEventListener('click', () => {
        mlModelFileInput.click();
      });

      mlModelFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const json = JSON.parse(evt.target.result);
            mlPredictor.loadModelFromJSON(json);
            if (mlModelBadge) {
              mlModelBadge.className = 'badge badge-success';
              mlModelBadge.textContent = 'Model Loaded (Custom)';
            }
            if (mlModelAlert) {
              mlModelAlert.style.display = 'none';
            }
            updateMLPrediction(codeEditor.value);
          } catch (err) {
            alert('Failed to parse model JSON: ' + err.message);
          }
        };
        reader.readAsText(file);
      });
    }

    // Attempt default fetch
    mlPredictor.loadModel('./ml_model.json')
      .then(loaded => {
        if (loaded && mlModelBadge) {
          mlModelBadge.className = 'badge badge-success';
          mlModelBadge.textContent = 'Model Ready (v1.0)';
          if (mlModelAlert) mlModelAlert.style.display = 'none';
          updateMLPrediction(codeEditor.value);
        }
      })
      .catch(err => {
        console.warn('Could not auto-fetch ml_model.json:', err);
        if (mlModelBadge) {
          mlModelBadge.className = 'badge badge-warning';
          mlModelBadge.textContent = 'Model Not Loaded';
        }
        if (mlModelAlert) {
          mlModelAlert.style.display = 'block';
          mlModelAlert.innerHTML = '<strong>Notice:</strong> Browser security restrictions (CORS) block direct <code>fetch()</code> of local JSON files when opened via <code>file://</code> protocol. Click <strong>Load Model JSON</strong> to select <code>ml_model.json</code> directly from your project directory, or launch a local web server (<code>python -m http.server 8000</code>).';
        }
      });
  }

  // =========================================================================
  // Initialization
  // =========================================================================
  updateLineNumbers();
  updateCursorPosition();
  initMLPredictor();
  runAnalysis();
  renderCurrentAutomata();
  renderTestSuite();
});
