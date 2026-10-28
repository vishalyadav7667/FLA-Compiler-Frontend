/**
 * CLI Node.js Test Runner for FLA-Lang
 * Verifies both the Compiler Pipeline (Lexer + Parser) and ML Model Predictor
 */

const fs = require('fs');
const { runAllTests } = require('./js/test-suite.js');
const { MLPredictor } = require('./js/ml-predictor.js');

console.log('='.repeat(70));
console.log('  FLA-Lang Front-End: Automated Verification Suite');
console.log('  Course: Formal Languages and Automata (FLA)');
console.log('='.repeat(70));

// ---------------------------------------------------------------------------
// 1. Compiler Verification Tests (Lexer & LL(1) Parser)
// ---------------------------------------------------------------------------
console.log('\n--- Section 1: Lexer & LL(1) Parser Verification (Authoritative) ---');
const suite = runAllTests();

suite.results.forEach((res) => {
  const status = res.passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[${status}] ${res.id}: ${res.title} (${res.category})`);
  if (!res.passed) {
    console.log(`       Code: ${JSON.stringify(res.code)}`);
    console.log(`       Expected Lexer: ${res.expected.lexerSuccess}, Parser: ${res.expected.parserSuccess}`);
    console.log(`       Actual Lexer:   ${res.actual.lexerSuccess}, Parser: ${res.actual.parserSuccess}`);
    console.log(`       Errors: ${res.actual.errors.join('; ')}`);
  }
});

console.log('-'.repeat(70));
console.log(`Compiler Tests: ${suite.summary.passed}/${suite.summary.total} Passed (${suite.summary.executionTimeMs}ms)`);

if (!suite.summary.allPassed) {
  console.error('Compiler verification failed!');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Machine Learning Model & Browser Predictor Tests
// ---------------------------------------------------------------------------
console.log('\n--- Section 2: Machine Learning Code Predictor (Multinomial Naive Bayes) ---');

let mlPassed = 0;
let mlTotal = 0;

function assertML(testId, title, condition, details = '') {
  mlTotal++;
  if (condition) {
    mlPassed++;
    console.log(`[✓ PASS] ${testId}: ${title}`);
  } else {
    console.error(`[✗ FAIL] ${testId}: ${title} - ${details}`);
  }
}

// Test 2.1: Model File Existence and Schema
let modelData = null;
try {
  const raw = fs.readFileSync('./ml_model.json', 'utf8');
  modelData = JSON.parse(raw);
  assertML('ML-01', 'Model file ml_model.json exists and is valid JSON', true);
} catch (e) {
  assertML('ML-01', 'Model file ml_model.json exists and is valid JSON', false, e.message);
}

if (modelData) {
  assertML(
    'ML-02',
    'Model schema contains required Naive Bayes parameters',
    (modelData.algorithm === 'Multinomial Naive Bayes' || modelData.model_type === 'MultinomialNB') &&
    Array.isArray(modelData.classes) &&
    modelData.classes.length === 2 &&
    typeof modelData.vocabulary === 'object' &&
    (Array.isArray(modelData.class_log_priors) || Array.isArray(modelData.class_log_prior)) &&
    Array.isArray(modelData.feature_log_prob)
  );

  assertML(
    'ML-03',
    `Vocabulary contains expected feature dimension (size: ${Object.keys(modelData.vocabulary).length})`,
    Object.keys(modelData.vocabulary).length === 2000
  );

  // Test 2.2: MLPredictor instantiation and loading
  const predictor = new MLPredictor();
  const loaded = predictor.loadModelFromJSON(modelData);
  assertML('ML-04', 'MLPredictor successfully initialized from JSON object', loaded && predictor.isLoaded());

  // Test 2.3: Inference on Canonical Valid Code
  const validSnippet1 = 'int x = 10;\nx = a + 5;';
  const pred1 = predictor.predict(validSnippet1);
  assertML(
    'ML-05',
    `Prediction on default canonical program: predicted ${pred1.prediction} (confidence: ${(pred1.confidence * 100).toFixed(1)}%)`,
    pred1.prediction === 'valid' && pred1.confidence > 0.8
  );

  // Test 2.4: Inference on Arithmetic Expressions
  const validSnippet2 = 'float rate = 12.5;\nresult = (a + 5) * b - c / 2;';
  const pred2 = predictor.predict(validSnippet2);
  assertML(
    'ML-06',
    `Prediction on arithmetic expression: predicted ${pred2.prediction} (confidence: ${(pred2.confidence * 100).toFixed(1)}%)`,
    pred2.prediction === 'valid'
  );

  // Test 2.5: Inference on Control Flow Block
  const validSnippet3 = 'if (x > 10) {\n  y = 1;\n} else {\n  y = 0;\n}';
  const pred3 = predictor.predict(validSnippet3);
  assertML(
    'ML-07',
    `Prediction on if-else block: predicted ${pred3.prediction} (confidence: ${(pred3.confidence * 100).toFixed(1)}%)`,
    pred3.prediction === 'valid'
  );

  // Test 2.6: Discriminating Feature Extraction
  const predFeatures = predictor.predict('int x = 10 @ 5;');
  assertML(
    'ML-08',
    'Feature extraction returns top discriminating n-grams',
    Array.isArray(predFeatures.topFeatures) && predFeatures.topFeatures.length > 0 &&
    typeof predFeatures.topFeatures[0].ngram === 'string' &&
    typeof predFeatures.topFeatures[0].favors === 'string'
  );

  // Test 2.7: Normalization & Probability Sum
  const sumProb = pred1.probabilities.valid + pred1.probabilities.invalid;
  assertML(
    'ML-09',
    `Softmax probability distribution sums to 1.0 (actual: ${sumProb.toFixed(4)})`,
    Math.abs(sumProb - 1.0) < 0.0001
  );

  // Test 2.8: Authoritative Parser vs Statistical ML Distinction
  // Both engines should be callable independently and agree or differ without crash
  assertML(
    'ML-10',
    'Authoritative parser and probabilistic ML predictor execute independently',
    typeof predictor.predict === 'function' && typeof suite.results === 'object'
  );
}

console.log('-'.repeat(70));
console.log(`ML Tests: ${mlPassed}/${mlTotal} Passed`);
console.log('='.repeat(70));

if (mlPassed !== mlTotal) {
  process.exit(1);
}

console.log('\n✓ All compiler and machine learning verification tests passed successfully!\n');
