/**
 * Comprehensive DOM Simulation Test for FLA-Lang
 * Accurately simulates the browser environment for:
 * - index.html DOM structure
 * - js/lexer.js
 * - js/parser.js
 * - js/automata.js
 * - js/test-suite.js
 * - js/app.js
 * - js/jff-integration.js
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(70));
console.log('  FLA-LANG BROWSER LOGIC & DOM SIMULATION TEST');
console.log('='.repeat(70));

const html = fs.readFileSync('index.html', 'utf8');

// Lightweight DOM Implementation for testing UI events & bindings
class MockElement {
  constructor(tagName, id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.className = className;
    this.classList = {
      _classes: new Set(className ? className.split(/\s+/).filter(Boolean) : []),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList._classes.has(c)) this.classList._classes.delete(c);
          else this.classList._classes.add(c);
        } else if (force) {
          this.classList._classes.add(c);
        } else {
          this.classList._classes.delete(c);
        }
      },
      contains: (c) => this.classList._classes.has(c)
    };
    this.attributes = new Map();
    this.children = [];
    this.parentNode = null;
    this._innerHTML = '';
    this.value = '';
    this.dataset = {};
    this.style = {};
    this.eventListeners = new Map();
    this.selectionStart = 0;
    this.selectionEnd = 0;
  }

  get textContent() {
    return this._innerHTML.replace(/<[^>]*>/g, '').trim();
  }

  set textContent(val) {
    this._innerHTML = String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = val;
    // Parse nested elements if any (rough)
    if (val.includes('<tr')) {
      const trCount = (val.match(/<tr/g) || []).length;
      this.children = Array.from({ length: trCount }, () => new MockElement('tr'));
    } else if (val.includes('<div class="derivation-item"')) {
      const divCount = (val.match(/class="derivation-item"/g) || []).length;
      this.children = Array.from({ length: divCount }, () => new MockElement('div', '', 'derivation-item'));
    }
  }

  addEventListener(event, fn) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(fn);
  }

  dispatchEvent(event) {
    const list = this.eventListeners.get(event.type) || [];
    for (const fn of list) {
      fn(event);
    }
  }

  click() {
    this.dispatchEvent({ type: 'click', target: this });
  }

  querySelector(selector) {
    const matches = this.querySelectorAll(selector);
    return matches.length > 0 ? matches[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    function search(node) {
      if (!node || !node.children) return;
      for (const child of node.children) {
        if (matchesSelector(child, selector)) results.push(child);
        search(child);
      }
    }
    search(this);
    return results;
  }
}

function matchesSelector(el, selector) {
  if (selector.includes('[data-target=')) {
    const match = selector.match(/\[data-target="([^"]+)"\]/);
    if (match && el.dataset.target !== match[1]) return false;
  }
  if (selector.includes('[data-subtarget=')) {
    const match = selector.match(/\[data-subtarget="([^"]+)"\]/);
    if (match && el.dataset.subtarget !== match[1]) return false;
  }
  if (selector.includes('#')) {
    const id = selector.match(/#([a-zA-Z0-9_-]+)/)[1];
    if (el.id !== id) return false;
  }
  if (selector.includes('.')) {
    const classes = [...selector.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map(m => m[1]);
    for (const c of classes) {
      if (!el.classList.contains(c)) return false;
    }
  }
  return true;
}

// Build Global DOM Mock
const elementsMap = new Map();
const allElements = [];

function registerElement(tag, id, className, dataAttrs = {}) {
  const el = new MockElement(tag, id, className);
  Object.assign(el.dataset, dataAttrs);
  if (id) elementsMap.set(id, el);
  allElements.push(el);
  return el;
}

// Parse index.html to register real DOM nodes with their IDs, classes, and data-attributes
const tagRegex = /<([a-zA-Z0-9]+)([^>]*)>/g;
let m;
while ((m = tagRegex.exec(html)) !== null) {
  const tag = m[1];
  const attrs = m[2];
  
  const idMatch = attrs.match(/id=["']([^"']+)["']/);
  const classMatch = attrs.match(/class=["']([^"']+)["']/);
  const dataTargetMatch = attrs.match(/data-target=["']([^"']+)["']/);
  const dataSubtargetMatch = attrs.match(/data-subtarget=["']([^"']+)["']/);
  const dataExampleMatch = attrs.match(/data-example=["']([^"']+)["']/);

  const id = idMatch ? idMatch[1] : '';
  const cls = classMatch ? classMatch[1] : '';
  const data = {};
  if (dataTargetMatch) data.target = dataTargetMatch[1];
  if (dataSubtargetMatch) data.subtarget = dataSubtargetMatch[1];
  if (dataExampleMatch) data.example = dataExampleMatch[1];

  registerElement(tag, id, cls, data);
}

// Setup Global Environment
const windowListeners = new Map();
global.window = {
  addEventListener(event, fn) {
    if (!windowListeners.has(event)) windowListeners.set(event, []);
    windowListeners.get(event).push(fn);
  },
  dispatchEvent(event) {
    const list = windowListeners.get(event.type) || [];
    for (const fn of list) fn(event);
  }
};

global.CustomEvent = class CustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail || {};
  }
};

global.document = {
  getElementById(id) {
    return elementsMap.get(id) || null;
  },
  querySelectorAll(selector) {
    return allElements.filter(el => matchesSelector(el, selector));
  },
  querySelector(selector) {
    const res = this.querySelectorAll(selector);
    return res.length > 0 ? res[0] : null;
  },
  addEventListener(event, fn) {
    if (event === 'DOMContentLoaded') {
      this._domContentLoaded = this._domContentLoaded || [];
      this._domContentLoaded.push(fn);
    }
  }
};

global.self = global;

// Load Modules
const FLALexer = require('./js/lexer.js');
const FLAParser = require('./js/parser.js');
const FLAAutomata = require('./js/automata.js');
const FLATestSuite = require('./js/test-suite.js');
const FLAML = require('./js/ml-predictor.js');

global.FLALexer = FLALexer;
global.FLAParser = FLAParser;
global.FLAAutomata = FLAAutomata;
global.FLATestSuite = FLATestSuite;
global.FLAML = FLAML;

// Initialize app.js and jff-integration.js
require('./js/app.js');
require('./js/jff-integration.js');

// Trigger DOMContentLoaded
if (document._domContentLoaded) {
  document._domContentLoaded.forEach(fn => fn());
}

console.log('DOM Environment and App initialized successfully.\n');

// ---------------------------------------------------------------------------
// VERIFICATION 1: Sidebar Navigation
// ---------------------------------------------------------------------------
console.log('--- CHECK 1: Sidebar Navigation ---');
const navItems = document.querySelectorAll('.tab-btn');
const pageHeaderTitle = document.getElementById('pageHeaderTitle');
const pageHeaderSubtitle = document.getElementById('pageHeaderSubtitle');

// Click automataTab
const automataBtn = document.querySelector('.tab-btn[data-target="automataTab"]');
automataBtn.click();
const automataActive = document.getElementById('automataTab').classList.contains('active');
const automataTitle = pageHeaderTitle.textContent;
console.log(`Automata Visualizer navigation: Active=${automataActive}, Title="${automataTitle}"`);

// Click testSuiteTab
const testSuiteBtn = document.querySelector('.tab-btn[data-target="testSuiteTab"]');
testSuiteBtn.click();
const testSuiteActive = document.getElementById('testSuiteTab').classList.contains('active');
const testSuiteTitle = pageHeaderTitle.textContent;
console.log(`Automated Test Suite navigation: Active=${testSuiteActive}, Title="${testSuiteTitle}"`);

// Click workspaceTab
const workspaceBtn = document.querySelector('.tab-btn[data-target="workspaceTab"]');
workspaceBtn.click();
const workspaceActive = document.getElementById('workspaceTab').classList.contains('active');
const workspaceTitle = pageHeaderTitle.textContent;
console.log(`Compiler Workspace navigation: Active=${workspaceActive}, Title="${workspaceTitle}"`);

const check1Passed = automataActive && testSuiteActive && workspaceActive &&
                     workspaceTitle === 'Compiler Workspace' &&
                     automataTitle === 'Automata Visualizer' &&
                     testSuiteTitle === 'Automated Test Suite';
console.log(`Check 1 Result: ${check1Passed ? 'PASSED' : 'FAILED'}\n`);

// ---------------------------------------------------------------------------
// VERIFICATION 2: Compiler Workspace Processing Valid Program
// ---------------------------------------------------------------------------
console.log('--- CHECK 2: Valid Program Analysis ---');
const codeEditor = document.getElementById('codeEditor');
const runBtn = document.getElementById('runBtn');
const analysisStatus = document.getElementById('analysisStatus');
const diagnosticsBanner = document.getElementById('diagnosticsBanner');
const tokenTableBody = document.getElementById('tokenTableBody');
const treeContainer = document.getElementById('treeContainer');
const derivationsContainer = document.getElementById('derivationsContainer');

codeEditor.value = "int x = 10;\nx = a + 5;";
runBtn.click();

const validStatusText = analysisStatus.textContent;
const validBannerClass = diagnosticsBanner.className;
const validTokensRendered = tokenTableBody.innerHTML.includes('<tr');
const validAstRendered = treeContainer.innerHTML.includes('Program');
const validDerivationsRendered = derivationsContainer.innerHTML.includes('derivation-item');

console.log(`Analysis Status: "${validStatusText}" (Expected "Syntax Valid")`);
console.log(`Diagnostics Banner Class: "${validBannerClass}"`);
console.log(`Tokens Table Populated: ${validTokensRendered}`);
console.log(`AST Root Populated: ${validAstRendered}`);
console.log(`Derivations Populated: ${validDerivationsRendered}`);

const check2Passed = validStatusText === 'Syntax Valid' &&
                     validBannerClass.includes('success') &&
                     validTokensRendered && validAstRendered && validDerivationsRendered;
console.log(`Check 2 Result: ${check2Passed ? 'PASSED' : 'FAILED'}\n`);

// ---------------------------------------------------------------------------
// VERIFICATION 3: Invalid Source Code Error Handling
// ---------------------------------------------------------------------------
console.log('--- CHECK 3: Invalid Program Error Reporting ---');

// 3a. Missing semicolon
codeEditor.value = "int x = 10\nx = 20;";
runBtn.click();
const errSemicolonStatus = analysisStatus.textContent;
const errSemicolonBanner = diagnosticsBanner.textContent;
const hasSemicolonMsg = errSemicolonBanner.includes("';'") || errSemicolonBanner.includes(";");
console.log(`Missing Semicolon: Status="${errSemicolonStatus}", Error Message detected=${hasSemicolonMsg}`);

// 3b. Illegal character @
codeEditor.value = "int x = 10 @ 5;";
runBtn.click();
const errAtStatus = analysisStatus.textContent;
const errAtBanner = diagnosticsBanner.textContent;
const hasAtMsg = errAtBanner.includes("@");
console.log(`Illegal character '@': Status="${errAtStatus}", Error Message detected=${hasAtMsg}`);

const check3Passed = errSemicolonStatus === 'Analysis Errors' && hasSemicolonMsg &&
                     errAtStatus === 'Analysis Errors' && hasAtMsg;
console.log(`Check 3 Result: ${check3Passed ? 'PASSED' : 'FAILED'}\n`);

// ---------------------------------------------------------------------------
// VERIFICATION 4: JFLAP Model Loading & DFA Simulation
// ---------------------------------------------------------------------------
console.log('--- CHECK 4: JFLAP Model Simulation Event Bridge ---');

// Test the 'fla-jff-model-loaded' event listener in app.js
const idJffXml = fs.readFileSync('JFLAP_Models/Identifier_DFA.jff', 'utf8');

// Construct mock JFLAP model as toVisualizerModel would do
const mockJffIdModel = {
  id: 'jff-loaded',
  name: 'JFLAP: Identifier_DFA.jff',
  formal: {
    Q: '{ q0, q1 (accept) }',
    Sigma: '{ L, D }',
    q0: 'q0',
    F: '{ q1 }',
    description: 'Identifier DFA from JFLAP'
  },
  states: [
    { id: '0', label: 'q0', isStart: true, isAccept: false },
    { id: '1', label: 'q1', isStart: false, isAccept: true }
  ],
  transitions: [
    { from: '0', to: '1', label: 'L' },
    { from: '1', to: '1', label: 'L' },
    { from: '1', to: '1', label: 'D' }
  ],
  delta(state, ch) {
    const letter = /^[A-Za-z]$/.test(ch), digit = /^[0-9]$/.test(ch);
    if (state === '0' && letter) return '1';
    if (state === '1' && (letter || digit)) return '1';
    return '__JFF_TRAP__';
  }
};

window.dispatchEvent(new CustomEvent('fla-jff-model-loaded', {
  detail: { model: mockJffIdModel, fileName: 'Identifier_DFA.jff' }
}));

const simInput = document.getElementById('simInput');
const simRunBtn = document.getElementById('simRunBtn');
const simStepBtn = document.getElementById('simStepBtn');
const simResetBtn = document.getElementById('simResetBtn');
const simVerdict = document.getElementById('simVerdict');

// Test totalScore2 -> Expect Accepted
simInput.value = 'totalScore2';
simInput.dispatchEvent({ type: 'input' });
simRunBtn.click();
const verdictTotalScore2 = simVerdict.textContent;
const acceptedTotalScore2 = verdictTotalScore2.includes('Accepted');
console.log(`JFLAP Identifier DFA ("totalScore2"): Verdict="${verdictTotalScore2}", Accepted=${acceptedTotalScore2}`);

// Test 2total -> Expect Rejected
simInput.value = '2total';
simInput.dispatchEvent({ type: 'input' });
simRunBtn.click();
const verdict2Total = simVerdict.textContent;
const rejected2Total = verdict2Total.includes('Rejected');
console.log(`JFLAP Identifier DFA ("2total"): Verdict="${verdict2Total}", Rejected=${rejected2Total}`);

// Test Step
simInput.value = 'abc';
simInput.dispatchEvent({ type: 'input' });
simStepBtn.click();
const stepState = simVerdict.textContent;
console.log(`JFLAP Step simulation: State="${stepState}"`);

// Test Reset
simResetBtn.click();
const resetState = simVerdict.textContent;
console.log(`JFLAP Reset simulation: State="${resetState}"`);

const check4Passed = acceptedTotalScore2 && rejected2Total;
console.log(`Check 4 Result: ${check4Passed ? 'PASSED' : 'FAILED'}\n`);

// ---------------------------------------------------------------------------
// VERIFICATION 5: JFLAP Grammar Files Structure
// ---------------------------------------------------------------------------
console.log('--- CHECK 5: JFLAP Grammar Files Presence & Content ---');
const cfgExists = fs.existsSync('JFLAP_Models/FLA_Language_CFG.jff');
const ll1Exists = fs.existsSync('JFLAP_Models/FLA_Language_CFG_LL1.jff');

const cfgText = fs.readFileSync('JFLAP_Models/FLA_Language_CFG.jff', 'utf8');
const ll1Text = fs.readFileSync('JFLAP_Models/FLA_Language_CFG_LL1.jff', 'utf8');

const hasCfgProductions = cfgText.includes('<production>') && cfgText.includes('<left>S</left>');
const hasLl1Productions = ll1Text.includes('<production>') && ll1Text.includes('<left>S</left>');

console.log(`FLA_Language_CFG.jff exists: ${cfgExists}, contains S -> productions: ${hasCfgProductions}`);
console.log(`FLA_Language_CFG_LL1.jff exists: ${ll1Exists}, contains S -> productions: ${hasLl1Productions}`);

const check5Passed = cfgExists && ll1Exists && hasCfgProductions && hasLl1Productions;
console.log(`Check 5 Result: ${check5Passed ? 'PASSED' : 'FAILED'}\n`);

// ---------------------------------------------------------------------------
// VERIFICATION 6: Automated Test Suite In-App Execution
// ---------------------------------------------------------------------------
console.log('--- CHECK 6: In-App Automated Test Suite Execution ---');
const runAllTestsBtn = document.getElementById('runAllTestsBtn');
runAllTestsBtn.click();

const testsTotalCount = document.getElementById('testsTotalCount').textContent;
const testsPassedCount = document.getElementById('testsPassedCount').textContent;
const testsFailedCount = document.getElementById('testsFailedCount').textContent;
const testsPercent = document.getElementById('testsPercent').textContent;
const testsTimeMs = document.getElementById('testsTimeMs').textContent;

console.log(`Test Metrics: Total=${testsTotalCount}, Passed=${testsPassedCount}, Failed=${testsFailedCount}, Success Rate=${testsPercent}, Time=${testsTimeMs}`);

const check6Passed = testsTotalCount === '14' && testsPassedCount === '14' &&
                     testsFailedCount === '0' && testsPercent === '100%';
console.log(`Check 6 Result: ${check6Passed ? 'PASSED' : 'FAILED'}\n`);

// ---------------------------------------------------------------------------
// VERIFICATION 7: ML Code Prediction Panel & DOM Wiring
// ---------------------------------------------------------------------------
console.log('--- CHECK 7: ML Code Prediction Panel & DOM Wiring ---');
const mlModelBadge = document.getElementById('mlModelBadge');
const mlLoadCustomBtn = document.getElementById('mlLoadCustomBtn');
const mlParserVerdictBadge = document.getElementById('mlParserVerdictBadge');
const mlPredictorVerdictBadge = document.getElementById('mlPredictorVerdictBadge');
const mlPredictedClass = document.getElementById('mlPredictedClass');
const mlConfidenceScore = document.getElementById('mlConfidenceScore');
const mlProbBreakdown = document.getElementById('mlProbBreakdown');

console.log(`ML Badge: "${mlModelBadge ? mlModelBadge.textContent : 'MISSING'}"`);
console.log(`Parser Verdict Badge: "${mlParserVerdictBadge ? mlParserVerdictBadge.textContent : 'MISSING'}"`);
console.log(`Predictor Verdict Badge: "${mlPredictorVerdictBadge ? mlPredictorVerdictBadge.textContent : 'MISSING'}"`);
console.log(`Predicted Class: "${mlPredictedClass ? mlPredictedClass.textContent : 'MISSING'}"`);
console.log(`Confidence: "${mlConfidenceScore ? mlConfidenceScore.textContent : 'MISSING'}"`);

const check7Passed = mlModelBadge !== null && mlLoadCustomBtn !== null &&
                     mlParserVerdictBadge !== null && mlPredictorVerdictBadge !== null &&
                     mlPredictedClass !== null && mlConfidenceScore !== null;
console.log(`Check 7 Result: ${check7Passed ? 'PASSED' : 'FAILED'}\n`);

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log('='.repeat(70));
const allChecks = [check1Passed, check2Passed, check3Passed, check4Passed, check5Passed, check6Passed, check7Passed];
const passedChecks = allChecks.filter(Boolean).length;
console.log(`SUMMARY: ${passedChecks}/${allChecks.length} verification checks passed.`);
console.log('='.repeat(70));

if (passedChecks !== allChecks.length) {
  process.exit(1);
} else {
  console.log('All smoke test checks completed successfully with 0 defects.');
  process.exit(0);
}
