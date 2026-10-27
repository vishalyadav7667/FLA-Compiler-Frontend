# FLA-Lang: Compiler Front-End Using Formal Languages and Automata

**Course:** Formal Languages and Automata (FLA)  
**Program:** Information Technology Undergraduate Semester Project  
**Submission Deadline:** October 28, 2026  
**Implementation:** HTML5, CSS3, Vanilla JavaScript (ES6+) — Zero Backend, Zero Dependencies  

---

## 1. Project Overview

**FLA-Lang** is an interactive, educational developer tool and compiler front-end built to demonstrate the practical application of formal language theory and automata within computer science. 

The software models the initial stages of a programming language compiler:
1. **Lexical Analysis (Scanner):** Maps character streams to tokens using Deterministic Finite Automata (DFA) patterns.
2. **Syntax Analysis (Parser):** Enforces a Context-Free Grammar (CFG) using LL(1) recursive descent parsing, generating both an Abstract Syntax Tree (AST) and a derivation rule trace.
3. **Automata Visualizer:** Provides interactive state transition diagrams with step-by-step tape simulation.
4. **Automated Test Suite:** Runs 14 verified test cases across valid syntax, syntax errors, and lexical errors.

---

## 2. Theoretical Foundations

This project bridges theoretical concepts from the Chomsky hierarchy into software implementations:

| Theoretical Concept | Mathematical Model | Compiler Implementation |
| :--- | :--- | :--- |
| **Regular Expressions (RE)** | $L \subseteq \Sigma^*$ | Token definitions for keywords, identifiers, numbers, operators |
| **Deterministic Finite Automata (DFA)** | $M = (Q, \Sigma, \delta, q_0, F)$ | Scanner / Tokenizer loop (`js/lexer.js`) |
| **Context-Free Grammar (CFG)** | $G = (V, \Sigma, R, S)$ | Production rules in EBNF (`js/parser.js`) |
| **Pushdown Automata (PDA)** | $M = (Q, \Sigma, \Gamma, \delta, q_0, z_0, F)$ | Recursive Descent Parser using the JS call stack as pushdown memory |
| **Derivations & Parse Trees** | Leftmost derivation sequence | AST & Derivation Tracer displaying applied grammar rules |

---

## 3. Critical Distinction: JFLAP vs. JavaScript Front-End

In undergraduate FLA courses, **JFLAP** (Java Formal Languages and Automata Package) is often utilized as a theoretical lab environment. It is critical to distinguish between JFLAP and this software:

* **JFLAP:** An offline desktop simulation tool written in Java. It allows students to draw state machines, compute $\epsilon$-closures, perform NFA-to-DFA conversions, and construct formal Turing machines saved in `.jff` XML format.
* **FLA-Lang (This Project):** A modern, client-side web application implementing a **real compiler front-end**. It does not claim that its internal JavaScript scripts are JFLAP files; rather, the state diagrams in the Automata Visualizer are illustrative educational models verified to be mathematically equivalent to canonical JFLAP 7.1 DFA definitions.
* **Compiler Scope:** This system implements a **compiler front-end** (Lexer + Parser + AST Generator). It intentionally does not implement semantic type checking, intermediate code generation (IR), or code generation/machine synthesis.

---

## 4. Supported Grammar (EBNF)

The parser implements a deterministic, unambiguous LL(1) grammar:

```ebnf
[R1]  <Program>      ::= <StmtList>
[R2]  <StmtList>     ::= <Stmt> <StmtList> | ε
[R3]  <Stmt>         ::= <DeclStmt> | <AssignStmt> | <IfStmt> | <WhileStmt> | <BlockStmt>
[R4]  <DeclStmt>     ::= <Type> IDENT [ '=' <Expr> ] ';'
[R5]  <Type>         ::= 'int' | 'float' | 'bool'
[R6]  <AssignStmt>   ::= IDENT '=' <Expr> ';'
[R7]  <IfStmt>       ::= 'if' '(' <CondExpr> ')' <Stmt> [ 'else' <Stmt> ]
[R8]  <WhileStmt>    ::= 'while' '(' <CondExpr> ')' <Stmt>
[R9]  <BlockStmt>    ::= '{' <StmtList> '}'
[R10] <CondExpr>     ::= <Expr> <RelOp> <Expr>
[R11] <RelOp>        ::= '==' | '<' | '>'
[R12] <Expr>         ::= <Term> ( ('+' | '-') <Term> )*
[R13] <Term>         ::= <Factor> ( ('*' | '/') <Factor> )*
[R14] <Factor>       ::= IDENT | NUMBER | '(' <Expr> ')' | '-' <Factor>
```

### Precedence Hierarchy:
1. Primary / Grouping: Parentheses `( Expr )`, atomic literals, identifiers, unary minus `- Factor`.
2. Multiplicative: `*`, `/` (left-associative).
3. Additive: `+`, `-` (left-associative).
4. Relational: `==`, `<`, `>` in conditional expressions.

---

## 5. File Structure

```
FLA-Compiler-Frontend/
├── index.html              # Main responsive web interface (Light dashboard layout)
├── css/
│   └── styles.css          # Light SaaS developer dashboard styling
├── js/
│   ├── lexer.js            # Lexical analyzer (Scanner & Tokenizer)
│   ├── parser.js           # LL(1) Recursive descent parser & AST generator
│   ├── automata.js         # DFA models, SVG renderer & interactive tape simulator
│   ├── jff-integration.js  # JFLAP .jff XML loader & transition evaluator
│   ├── test-suite.js       # 14 automated test cases & benchmark suite
│   └── app.js              # Application controller & UI event binding
├── JFLAP_Models/           # Canonical JFLAP .jff models (DFA & CFG)
├── test-runner-node.js     # Headless CLI test runner for terminal verification
└── README.md               # Project documentation and user guide
```

---

## 6. How to Run Locally

Because the application is built using pure client-side standard technologies without external dependencies or build tools, running it is instantaneous:

### Option A: Directly in any Web Browser (Recommended)
Simply double-click `index.html` or right-click `index.html` and choose **Open with > Chrome / Firefox / Edge / Safari**.

### Option B: Using a Lightweight Local HTTP Server
If you prefer running via a local web server:

Using Python:
```bash
# Python 3
python -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

Using Node `http-server` or `npx serve`:
```bash
npx serve .
```

### Option C: Running the Automated Test Suite in Terminal
You can run the full automated verification test suite directly via Node.js:
```bash
node test-runner-node.js
```

---

## 7. Verification and Automated Test Cases

The built-in test suite evaluates 14 scenarios:

1. **TC-01:** Simple Variable Declaration (`int x;`) — *Valid Syntax*
2. **TC-02:** Initialized Variable Declaration (`int x = 10;`) — *Valid Syntax*
3. **TC-03:** Float Declaration with Decimal Number (`float rate = 12.75;`) — *Valid Syntax*
4. **TC-04:** Basic Assignment Expression (`x = a + 5;`) — *Valid Syntax*
5. **TC-05:** Operator Precedence and Parentheses (`result = (a + 5) * b - c / 2;`) — *Valid Syntax*
6. **TC-06:** Preloaded Multi-Statement Default (`int x = 10;\nx = a + 5;`) — *Valid Syntax*
7. **TC-07:** Conditional If-Else Block (`if (x > 10) { y = 1; } else { y = 0; }`) — *Valid Syntax*
8. **TC-08:** While Loop with Block Statement (`while (count < 5) { count = count + 1; }`) — *Valid Syntax*
9. **TC-09:** Syntax Error: Missing Semicolon (`int x = 10`) — *Rejected with Line & Column*
10. **TC-10:** Syntax Error: Mismatched Parenthesis (`x = (a + 5;`) — *Rejected with Line & Column*
11. **TC-11:** Syntax Error: Consecutive Operators (`x = a + * 5;`) — *Rejected with Line & Column*
12. **TC-12:** Lexical Error: Unrecognized Character (`int x = 10 @ 5;`) — *Rejected with Line & Column*
13. **TC-13:** Lexical Error: Identifier Starting with Digit (`int 9total = 100;`) — *Rejected with Line & Column*
14. **TC-14:** Lexical Error: Multiple Decimal Points (`float v = 3.14.15;`) — *Rejected with Line & Column*

All 14 tests pass with 100% compliance in under 3 milliseconds.

---

## 8. Limitations & Future Scope

### Limitations:
* **Front-End Scope:** No backend database, code optimization, or assembly/bytecode generation is performed.
* **Semantic Analysis:** Type-checking rules (e.g. assigning a float to an int without explicit cast) are not evaluated in this syntactic parser.

### Future Scope:
* Addition of a symbol table manager showing variable scope and memory offsets.
* Three-Address Code (TAC) intermediate representation viewer.
* JFLAP `.jff` XML file export directly from the visual automata tab.
