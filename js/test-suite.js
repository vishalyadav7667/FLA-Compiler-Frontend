/**
 * FLA-Lang Automated Test Suite
 * Subject: Formal Languages and Automata (FLA)
 * 
 * Contains at least 10 comprehensive test cases covering:
 * - Valid declarations, assignments, arithmetic expressions, control structures
 * - Syntax errors (missing semicolon, mismatched parentheses, malformed expression)
 * - Lexical errors (unrecognized characters, identifiers starting with digit, malformed decimals)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const lexerModule = require('./lexer.js');
    const parserModule = require('./parser.js');
    module.exports = factory(lexerModule, parserModule);
  } else {
    root.FLATestSuite = factory(root.FLALexer, root.FLAParser);
  }
}(typeof self !== 'undefined' ? self : this, function (lexerModule, parserModule) {

  const { Lexer } = lexerModule;
  const { Parser } = parserModule;

  const TEST_CASES = [
    {
      id: 'TC-01',
      title: 'Simple Variable Declaration',
      category: 'Valid Syntax',
      code: 'int x;',
      expectedLexerSuccess: true,
      expectedParserSuccess: true,
      description: 'Tests rule <DeclStmt> ::= <Type> IDENT \';\' without initializer.'
    },
    {
      id: 'TC-02',
      title: 'Initialized Variable Declaration',
      category: 'Valid Syntax',
      code: 'int x = 10;',
      expectedLexerSuccess: true,
      expectedParserSuccess: true,
      description: 'Tests declaration with integer literal initialization.'
    },
    {
      id: 'TC-03',
      title: 'Float Declaration with Decimal Number',
      category: 'Valid Syntax',
      code: 'float rate = 12.75;',
      expectedLexerSuccess: true,
      expectedParserSuccess: true,
      description: 'Tests float keyword, decimal tokenization, and declaration grammar.'
    },
    {
      id: 'TC-04',
      title: 'Basic Assignment Expression',
      category: 'Valid Syntax',
      code: 'x = a + 5;',
      expectedLexerSuccess: true,
      expectedParserSuccess: true,
      description: 'Tests assignment statement with identifier and integer addition.'
    },
    {
      id: 'TC-05',
      title: 'Operator Precedence and Parentheses',
      category: 'Valid Syntax',
      code: 'result = (a + 5) * b - c / 2;',
      expectedLexerSuccess: true,
      expectedParserSuccess: true,
      description: 'Verifies correct precedence hierarchy: * and / before + and -, parentheses evaluated first.'
    },
    {
      id: 'TC-06',
      title: 'Multi-Statement Default Program',
      category: 'Valid Syntax',
      code: 'int x = 10;\nx = a + 5;',
      expectedLexerSuccess: true,
      expectedParserSuccess: true,
      description: 'Preloaded sample program demonstrating multi-statement sequence.'
    },
    {
      id: 'TC-07',
      title: 'Conditional If-Else Block',
      category: 'Valid Syntax',
      code: 'if (x > 10) {\n  y = 1;\n} else {\n  y = 0;\n}',
      expectedLexerSuccess: true,
      expectedParserSuccess: true,
      description: 'Tests boolean comparison expression and if-else branching.'
    },
    {
      id: 'TC-08',
      title: 'While Loop with Block Statement',
      category: 'Valid Syntax',
      code: 'while (count < 5) {\n  count = count + 1;\n}',
      expectedLexerSuccess: true,
      expectedParserSuccess: true,
      description: 'Tests while loop syntax, condition expression, and block statements.'
    },
    {
      id: 'TC-09',
      title: 'Syntax Error: Missing Semicolon',
      category: 'Syntax Error',
      code: 'int x = 10',
      expectedLexerSuccess: true,
      expectedParserSuccess: false,
      expectedErrorMessage: "Expected ';' at end of declaration",
      description: 'Verifies parser rejects statements missing terminating semicolon.'
    },
    {
      id: 'TC-10',
      title: 'Syntax Error: Mismatched Parenthesis',
      category: 'Syntax Error',
      code: 'x = (a + 5;',
      expectedLexerSuccess: true,
      expectedParserSuccess: false,
      expectedErrorMessage: "Expected ')' to close parenthesized expression",
      description: 'Verifies parser detects unmatched open parenthesis in expressions.'
    },
    {
      id: 'TC-11',
      title: 'Syntax Error: Consecutive Operators',
      category: 'Syntax Error',
      code: 'x = a + * 5;',
      expectedLexerSuccess: true,
      expectedParserSuccess: false,
      expectedErrorMessage: "Expected identifier, number, or '(' expression",
      description: 'Verifies parser rejects illegal binary operator sequences.'
    },
    {
      id: 'TC-12',
      title: 'Lexical Error: Unrecognized Character',
      category: 'Lexical Error',
      code: 'int x = 10 @ 5;',
      expectedLexerSuccess: false,
      expectedParserSuccess: false,
      expectedErrorMessage: "Unrecognized character '@'",
      description: 'Verifies lexer detects characters outside the FLA-Lang alphabet.'
    },
    {
      id: 'TC-13',
      title: 'Lexical Error: Identifier Starting with Digit',
      category: 'Lexical Error',
      code: 'int 9total = 100;',
      expectedLexerSuccess: false,
      expectedParserSuccess: false,
      expectedErrorMessage: "identifiers cannot start with a digit",
      description: 'Verifies DFA transition rejecting leading digits for identifiers.'
    },
    {
      id: 'TC-14',
      title: 'Lexical Error: Multiple Decimal Points',
      category: 'Lexical Error',
      code: 'float v = 3.14.15;',
      expectedLexerSuccess: false,
      expectedParserSuccess: false,
      expectedErrorMessage: "multiple decimal points",
      description: 'Verifies number DFA rejects malformed floating point literals.'
    }
  ];

  function runSingleTest(testCase) {
    const lexer = new Lexer(testCase.code);
    const lexResult = lexer.tokenize();

    const lexerPassed = (lexResult.errors.length === 0) === testCase.expectedLexerSuccess;

    let parserPassed = false;
    let parseResult = null;

    if (lexResult.errors.length > 0 && !testCase.expectedLexerSuccess) {
      // Expected lexer failure
      parserPassed = true; // Handled correctly at lexical stage
    } else {
      const parser = new Parser(lexResult.tokens);
      parseResult = parser.parse();
      const parserSuccess = parseResult.errors.length === 0;
      parserPassed = parserSuccess === testCase.expectedParserSuccess;
    }

    const overallPassed = lexerPassed && parserPassed;

    // Collect error messages for reporting
    const allErrors = [];
    if (lexResult.errors.length > 0) {
      lexResult.errors.forEach(e => allErrors.push(e.toString()));
    }
    if (parseResult && parseResult.errors.length > 0) {
      parseResult.errors.forEach(e => allErrors.push(e.toString()));
    }

    return {
      id: testCase.id,
      title: testCase.title,
      category: testCase.category,
      code: testCase.code,
      description: testCase.description,
      expected: {
        lexerSuccess: testCase.expectedLexerSuccess,
        parserSuccess: testCase.expectedParserSuccess,
        errorMessage: testCase.expectedErrorMessage || null
      },
      actual: {
        lexerSuccess: lexResult.errors.length === 0,
        parserSuccess: parseResult ? parseResult.errors.length === 0 : false,
        tokenCount: lexResult.tokens.length,
        errors: allErrors
      },
      passed: overallPassed
    };
  }

  function runAllTests() {
    const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const results = TEST_CASES.map(tc => runSingleTest(tc));
    const endTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.length - passedCount;

    return {
      results,
      summary: {
        total: results.length,
        passed: passedCount,
        failed: failedCount,
        allPassed: failedCount === 0,
        executionTimeMs: Math.round((endTime - startTime) * 100) / 100
      }
    };
  }

  return {
    TEST_CASES,
    runSingleTest,
    runAllTests
  };
}));
