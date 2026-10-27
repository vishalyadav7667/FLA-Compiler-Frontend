/**
 * CLI Node.js Test Runner for FLA-Lang
 */

const { runAllTests } = require('./js/test-suite.js');

console.log('='.repeat(70));
console.log('  FLA-Lang Front-End: Automated Verification Suite');
console.log('  Course: Formal Languages and Automata (FLA)');
console.log('='.repeat(70));

const suite = runAllTests();

suite.results.forEach((res, i) => {
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
console.log(`Summary: ${suite.summary.passed}/${suite.summary.total} Passed (${suite.summary.executionTimeMs}ms)`);
console.log('='.repeat(70));

if (!suite.summary.allPassed) {
  process.exit(1);
} else {
  console.log('All automated tests passed successfully!');
}
