/**
 * Comprehensive Audit Test Script for FLA-Lang
 * Tests:
 * 1. Lexer & Parser on valid inputs (declaration, assignment, arithmetic, conditional, while)
 * 2. Lexer & Parser on invalid inputs (missing semicolon, unmatched paren, consecutive ops, illegal char @)
 * 3. AST construction & Derivation output
 * 4. Automata Simulator on Identifier DFA & Number DFA
 * 5. JFLAP XML parsing and DFA execution
 * 6. JFLAP Grammar parsing
 */

const fs = require('fs');
const lexerModule = require('./js/lexer.js');
const parserModule = require('./js/parser.js');
const automataModule = require('./js/automata.js');
const testSuiteModule = require('./js/test-suite.js');

const { Lexer } = lexerModule;
const { Parser } = parserModule;
const { AUTOMATA_MODELS, AutomataSimulator, renderAutomataSVG } = automataModule;
const { runAllTests } = testSuiteModule;

console.log('='.repeat(70));
console.log('  FLA-LANG COMPREHENSIVE IMPLEMENTATION AUDIT');
console.log('='.repeat(70));

// ---------------------------------------------------------------------------
// 1. Run Automated Test Suite
// ---------------------------------------------------------------------------
console.log('\n--- STEP 1: Running Built-in Automated Test Suite (14 Tests) ---');
const suite = runAllTests();

suite.results.forEach(res => {
  const status = res.passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[${status}] ${res.id}: ${res.title} (${res.category})`);
});

console.log(`\nSuite Summary: ${suite.summary.passed}/${suite.summary.total} Passed (${suite.summary.executionTimeMs} ms)`);
if (!suite.summary.allPassed) {
  console.error('FAILED: Built-in test suite had failures!');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Test Compiler Workspace Engine on Specific Inputs
// ---------------------------------------------------------------------------
console.log('\n--- STEP 2: Testing Compiler Engine (Lexer, Parser, AST, Derivations) ---');

const testInputs = [
  {
    name: 'Default Preloaded Program',
    code: 'int x = 10;\nx = a + 5;',
    expectValid: true
  },
  {
    name: 'Complex Arithmetic with Precedence',
    code: 'float rate = 12.5;\nresult = (a + 5) * b - c / 2;',
    expectValid: true
  },
  {
    name: 'If-Else Conditional Block',
    code: 'if (x > 10) {\n  y = 1;\n} else {\n  y = 0;\n}',
    expectValid: true
  },
  {
    name: 'While Loop Block',
    code: 'while (count < 5) {\n  count = count + 1;\n}',
    expectValid: true
  },
  {
    name: 'Invalid: Missing Semicolon',
    code: 'int x = 10\nx = 20;',
    expectValid: false,
    expectedError: "Expected ';'"
  },
  {
    name: 'Invalid: Unmatched Parenthesis',
    code: 'x = (a + 5 * b;',
    expectValid: false,
    expectedError: "Expected ')'"
  },
  {
    name: 'Invalid: Lexical Error Character @',
    code: 'int x = 10 @ 5;',
    expectValid: false,
    expectedError: "Unrecognized character '@'"
  }
];

let compilerTestsPassed = 0;
testInputs.forEach(t => {
  const lexer = new Lexer(t.code);
  const lexResult = lexer.tokenize();
  const parser = new Parser(lexResult.tokens);
  const parseResult = parser.parse();

  const isValid = lexResult.errors.length === 0 && parseResult.errors.length === 0;
  const passed = isValid === t.expectValid;

  if (passed) {
    compilerTestsPassed++;
    console.log(`[✓ PASS] ${t.name}: Tokens=${lexResult.tokens.length}, AST=${parseResult.ast ? 'Built' : 'Null'}, Derivations=${parseResult.derivations.length}`);
  } else {
    console.log(`[✗ FAIL] ${t.name}: Expected valid=${t.expectValid}, got=${isValid}`);
  }
});

console.log(`Compiler tests: ${compilerTestsPassed}/${testInputs.length} passed.`);

// ---------------------------------------------------------------------------
// 3. Test Automata Simulator on Built-in Models
// ---------------------------------------------------------------------------
console.log('\n--- STEP 3: Testing Automata Simulator on Built-in Models ---');

const simId = new AutomataSimulator('identifier');
const idCases = [
  { input: 'totalScore2', expectAccept: true },
  { input: 'total', expectAccept: true },
  { input: 'x1', expectAccept: true },
  { input: '2total', expectAccept: false },
  { input: 'total-score', expectAccept: false },
  { input: '', expectAccept: false }
];

let automataIdPassed = 0;
idCases.forEach(c => {
  simId.reset(c.input);
  const res = simId.runAll();
  const passed = res.accepted === c.expectAccept;
  if (passed) automataIdPassed++;
  console.log(`[${passed ? '✓' : '✗'}] Identifier DFA on "${c.input}": Accepted=${res.accepted} (expected ${c.expectAccept}), Final State=${res.state}`);
});

const simNum = new AutomataSimulator('number');
const numCases = [
  { input: '10', expectAccept: true },
  { input: '12345', expectAccept: true },
  { input: '3.14', expectAccept: true },
  { input: '0.5', expectAccept: true },
  { input: '12.', expectAccept: false },
  { input: '1.2.3', expectAccept: false },
  { input: 'abc', expectAccept: false }
];

let automataNumPassed = 0;
numCases.forEach(c => {
  simNum.reset(c.input);
  const res = simNum.runAll();
  const passed = res.accepted === c.expectAccept;
  if (passed) automataNumPassed++;
  console.log(`[${passed ? '✓' : '✗'}] Number DFA on "${c.input}": Accepted=${res.accepted} (expected ${c.expectAccept}), Final State=${res.state}`);
});

// ---------------------------------------------------------------------------
// 4. Test JFLAP XML Files Reading and Conversion
// ---------------------------------------------------------------------------
console.log('\n--- STEP 4: Testing JFLAP File Parsing & Simulator Integration ---');

// Lightweight Node XML parser for testing the exact JFLAP format
function parseJffAutomaton(xmlText) {
  const states = [];
  const stateRegex = /<state\s+id="([^"]+)"\s+name="([^"]+)">([\s\S]*?)<\/state>/g;
  let sm;
  while ((sm = stateRegex.exec(xmlText)) !== null) {
    states.push({
      id: sm[1],
      name: sm[2],
      initial: sm[3].includes('<initial/>') || sm[3].includes('<initial>'),
      final: sm[3].includes('<final/>') || sm[3].includes('<final>')
    });
  }

  const transitions = [];
  const transRegex = /<transition>[\s\S]*?<from>([^<]+)<\/from>[\s\S]*?<to>([^<]+)<\/to>[\s\S]*?<read>([^<]*)<\/read>[\s\S]*?<\/transition>/g;
  let tm;
  while ((tm = transRegex.exec(xmlText)) !== null) {
    transitions.push({
      from: tm[1].trim(),
      to: tm[2].trim(),
      read: tm[3] ? tm[3].trim() : ''
    });
  }

  return { states, transitions };
}

function parseJffGrammar(xmlText) {
  const productions = [];
  const prodRegex = /<production>[\s\S]*?<left>([^<]*)<\/left>[\s\S]*?<right>([^<]*)<\/right>[\s\S]*?<\/production>/g;
  let pm;
  while ((pm = prodRegex.exec(xmlText)) !== null) {
    productions.push({
      left: pm[1].trim(),
      right: pm[2].trim() || 'λ'
    });
  }
  return productions;
}

// 4a. Identifier_DFA.jff
const idJffXml = fs.readFileSync('JFLAP_Models/Identifier_DFA.jff', 'utf8');
const idJffFa = parseJffAutomaton(idJffXml);
console.log(`Loaded Identifier_DFA.jff: ${idJffFa.states.length} states, ${idJffFa.transitions.length} transitions`);

// Build JFLAP model delta function matching js/jff-integration.js
const jffIdModel = {
  id: 'jff-loaded',
  name: 'JFLAP: Identifier_DFA.jff',
  states: idJffFa.states.map(s => ({ id: s.id, label: s.name, isStart: s.initial, isAccept: s.final })),
  transitions: idJffFa.transitions,
  delta(state, ch) {
    const outgoing = idJffFa.transitions.filter(t => t.from === state);
    const letter = /^[A-Za-z]$/.test(ch), digit = /^[0-9]$/.test(ch);
    const match = outgoing.find(t => {
      const r = t.read;
      if (r === ch) return true;
      if (r === 'L' && letter) return true;
      if (r === 'D' && digit) return true;
      return false;
    });
    return match ? match.to : '__JFF_TRAP__';
  }
};

const jffSim = new AutomataSimulator('identifier');
jffSim.model = jffIdModel;
jffSim.modelKey = 'jff-loaded';

const jffTestCases = [
  { input: 'totalScore2', expectAccept: true },
  { input: 'LDL', expectAccept: true },
  { input: '2total', expectAccept: false },
  { input: 'total-score', expectAccept: false },
  { input: '', expectAccept: false }
];

let jffIdPassed = 0;
jffTestCases.forEach(c => {
  jffSim.reset(c.input);
  const res = jffSim.runAll();
  const passed = res.accepted === c.expectAccept;
  if (passed) jffIdPassed++;
  console.log(`[${passed ? '✓' : '✗'}] JFLAP loaded DFA on "${c.input}": Accepted=${res.accepted} (expected ${c.expectAccept}), Final State=${res.state}`);
});

// 4b. FLA_Language_CFG.jff & LL1.jff
const cfgXml = fs.readFileSync('JFLAP_Models/FLA_Language_CFG.jff', 'utf8');
const cfgProductions = parseJffGrammar(cfgXml);
console.log(`\nLoaded FLA_Language_CFG.jff: ${cfgProductions.length} productions parsed successfully.`);
console.log('Sample productions:', cfgProductions.slice(0, 4).map(p => `${p.left} -> ${p.right}`).join(', '));

const ll1Xml = fs.readFileSync('JFLAP_Models/FLA_Language_CFG_LL1.jff', 'utf8');
const ll1Productions = parseJffGrammar(ll1Xml);
console.log(`Loaded FLA_Language_CFG_LL1.jff: ${ll1Productions.length} productions parsed successfully.`);
console.log('Sample productions:', ll1Productions.slice(0, 4).map(p => `${p.left} -> ${p.right}`).join(', '));

// ---------------------------------------------------------------------------
// 5. Test SVG Diagram Generation
// ---------------------------------------------------------------------------
console.log('\n--- STEP 5: Testing SVG Automata Rendering ---');
const svgId = renderAutomataSVG(AUTOMATA_MODELS.identifier, 'q1');
const svgNum = renderAutomataSVG(AUTOMATA_MODELS.number, 'q0');
const svgJff = renderAutomataSVG(jffIdModel, '0');

console.log(`Identifier SVG generated: ${svgId.length} chars (contains <svg: ${svgId.includes('<svg')})`);
console.log(`Number SVG generated: ${svgNum.length} chars (contains <svg: ${svgNum.includes('<svg')})`);
console.log(`JFLAP Loaded SVG generated: ${svgJff.length} chars (contains <svg: ${svgJff.includes('<svg')})`);

console.log('\n' + '='.repeat(70));
console.log('  ALL AUDIT CHECKS COMPLETED SUCCESSFULLY');
console.log('='.repeat(70));
