# FLA-Lang: Compiler Front-End Using Formal Languages and Automata

**Course:** Formal Languages and Automata (FLA)  
**Program:** Information Technology Undergraduate Semester Project  
**Submission Deadline:** October 28, 2026  
**Implementation:** HTML5, CSS3, Vanilla JavaScript (ES6+), Client-Side ML — Zero Backend, Zero Server Dependencies  

---

## 1. Project Overview

**FLA-Lang** is an interactive, educational developer tool and compiler front-end built to demonstrate the practical application of formal language theory, automata theory, and statistical machine learning within computer science. 

The software models the initial stages of a programming language compiler alongside a statistical validity predictor:
1. **Lexical Analysis (Scanner):** Maps character streams to tokens using Deterministic Finite Automata (DFA) patterns.
2. **Syntax Analysis (Parser):** Enforces a Context-Free Grammar (CFG) using LL(1) recursive descent parsing, generating an Abstract Syntax Tree (AST) and derivation rule traces.
3. **Machine Learning Code Predictor:** Client-side Multinomial Naive Bayes classifier trained on character n-grams to estimate syntax validity and compare statistical prediction against formal grammar guarantees.
4. **Automata Visualizer:** Provides interactive state transition diagrams with step-by-step tape simulation and native JFLAP (`.jff`) model execution.
5. **Automated Test Suite:** Runs 24 verified automated tests covering compiler stages, grammar errors, model parameters, and ML inference.

---

## 2. Theoretical Foundations

This project bridges theoretical concepts from the Chomsky hierarchy and statistical classification into software implementations:

| Theoretical Concept | Mathematical Model | Implementation |
| :--- | :--- | :--- |
| **Regular Expressions (RE)** | $L \subseteq \Sigma^*$ | Token definitions for keywords, identifiers, numbers, operators |
| **Deterministic Finite Automata (DFA)** | $M = (Q, \Sigma, \delta, q_0, F)$ | Scanner / Tokenizer loop (`js/lexer.js`) & visualizer (`js/automata.js`) |
| **Context-Free Grammar (CFG)** | $G = (V, \Sigma, R, S)$ | Production rules in EBNF (`js/parser.js`) |
| **Pushdown Automata (PDA)** | $M = (Q, \Sigma, \Gamma, \delta, q_0, z_0, F)$ | Recursive Descent Parser using the JS call stack as pushdown memory |
| **Derivations & Parse Trees** | Leftmost derivation sequence | AST & Derivation Tracer displaying applied grammar rules |
| **Statistical Code Classification** | $\arg\max_c [\log P(c) + \sum x_j \log \theta_{c,j}]$ | Multinomial Naive Bayes character n-gram predictor (`js/ml-predictor.js`) |

---

## 3. Critical Distinction: Authoritative Parser vs. Machine Learning

A foundational lesson in Formal Languages and Automata is the distinction between **formal language recognition** and **probabilistic statistical classification**:

* **Authoritative Deterministic Parser (LL(1) / PDA):**
  - **Theory:** Context-Free Grammar, Deterministic Pushdown Automata.
  - **Guarantee:** 100% deterministic decision. If a program conforms to the grammar, it is accepted; if it violates any production, it is rejected with precise line and column diagnostics. Zero false positives and zero false negatives.
  - **Role:** The **authoritative ground truth** for code validation in FLA-Lang.
* **Probabilistic ML Predictor (Multinomial Naive Bayes):**
  - **Theory:** Statistical natural language processing, character n-gram frequency distributions, Bayes' Theorem with conditional independence assumptions.
  - **Behavior:** Calculates the likelihood that character sequences resemble valid or invalid syntax patterns learned from training data.
  - **Limitation:** Cannot formally count nested parentheses to arbitrary depth (a CFL property) due to lack of a stack, meaning it produces statistical approximations.
  - **Role:** An educational comparative tool highlighting why production compilers rely on deterministic automata rather than statistical models for syntax verification.

---

## 4. Machine Learning Model: Training & Architecture

### Model Architecture
- **Classifier:** Multinomial Naive Bayes (`MultinomialNB(alpha=1.0)`) with Laplace smoothing.
- **Feature Extraction:** Character n-grams from length 1 to 4 (`ngram_range=(1, 4)`).
- **Vocabulary Size:** Top 2,000 discriminating character n-grams.
- **Inference Math:** Pure JavaScript implementation of log-likelihood summation with softmax normalization:
  $$\log P(c \mid x) = \log P(c) + \sum_{j=1}^{V} x_j \cdot \log \theta_{c, j}$$
  $$P(\text{Valid} \mid x) = \frac{\exp(\log P(\text{valid} \mid x) - \mu)}{\exp(\log P(\text{valid} \mid x) - \mu) + \exp(\log P(\text{invalid} \mid x) - \mu)}$$

### Training Dataset & Evaluation
- **Dataset:** Balanced corpus of 2,314 samples (1,157 valid code snippets generated from FLA-Lang grammar + 1,157 invalid / malformed samples with lexical, structural, and delimiter anomalies).
- **Data Split:** 80% Training (1,851 samples), 20% Testing (463 samples).
- **Test Set Evaluation Metrics:**
  - **Accuracy:** 80.13%
  - **Precision (Valid):** 87.74%
  - **Recall (Valid):** 73.81%
  - **F1-Score (Valid):** 80.17%
  - **Confusion Matrix:**
    - True Negatives (Correctly identified Invalid): **185**
    - False Positives (Invalid predicted as Valid): **26**
    - False Negatives (Valid predicted as Invalid): **66**
    - True Positives (Correctly identified Valid): **186**

### Reproducing Training in Google Colab
The project includes a self-contained Jupyter notebook: `FLA_Lang_ML_Model.ipynb`.

To train and export the model yourself:
1. Open [Google Colab](https://colab.research.google.com/).
2. Click **Upload** and select `FLA_Lang_ML_Model.ipynb` from this project folder.
3. Select **Runtime > Run all** (`Ctrl + F9`).
4. The notebook will:
   - Generate the grammar-consistent training and testing datasets.
   - Fit `CountVectorizer` and `MultinomialNB`.
   - Print classification metrics and the confusion matrix.
   - Export parameters into `ml_model.json`.
   - Trigger an automatic browser download of `ml_model.json`.
5. Place the newly downloaded `ml_model.json` in the root folder of this project.

---

## 5. Supported Grammar (EBNF)

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

---

## 6. File Structure

```
FLA-Compiler-Frontend/
├── index.html                 # Main responsive light dashboard UI
├── css/
│   └── styles.css             # Light SaaS dashboard styling & ML panel styles
├── js/
│   ├── lexer.js               # Lexical analyzer (Scanner & DFA Tokenizer)
│   ├── parser.js              # LL(1) Recursive descent parser & AST generator
│   ├── ml-predictor.js        # Client-side Naive Bayes ML inference engine
│   ├── automata.js            # DFA models, SVG renderer & tape simulator
│   ├── jff-integration.js     # JFLAP .jff XML loader & transition evaluator
│   ├── test-suite.js          # In-browser automated compiler test suite
│   └── app.js                 # Application controller & DOM wiring
├── ml_model.json              # Exported Naive Bayes model parameters & vocabulary
├── FLA_Lang_ML_Model.ipynb    # Google Colab notebook for dataset, training, & export
├── JFLAP_Models/              # Canonical JFLAP .jff models (DFA & CFG)
├── test-runner-node.js        # CLI test runner for compiler + ML verification
├── test-browser-simulation.js # Headless browser DOM and user flow smoke test
└── README.md                  # Comprehensive documentation and user manual
```

---

## 7. How to Run Locally

Because the application is built using pure client-side standard technologies without external server dependencies, running it is instantaneous:

### Option A: Using a Lightweight Local HTTP Server (Recommended)
Running via a local HTTP server ensures the browser can automatically load `ml_model.json` via `fetch()`:

Using Python:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

Using Node `npx serve`:
```bash
npx serve .
```

### Option B: Directly in any Web Browser via `file://`
You can double-click `index.html` to open it directly in Chrome, Firefox, Edge, or Safari.
> **Note on Local Security (CORS):** If opened via `file://`, standard browser security restricts `fetch()` from reading local JSON files. The application gracefully detects this and displays a **Load Model JSON** button. Simply click this button and select `ml_model.json` from your project folder to enable instant in-browser ML inference!

### Option C: Running Verification Tests in Terminal
Run the comprehensive verification suite via Node.js:
```bash
node test-runner-node.js
```
Run the DOM & browser simulation smoke test:
```bash
node test-browser-simulation.js
```

---

## 8. Automated Test Suite

The automated test runner executes 24 comprehensive test cases:

### Compiler Tests (14 Cases)
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

### Machine Learning Tests (10 Cases)
15. **ML-01:** Model file `ml_model.json` exists and is valid JSON.
16. **ML-02:** Model schema contains required Naive Bayes parameters (`classes`, `class_log_priors`, `feature_log_prob`).
17. **ML-03:** Vocabulary dimension conforms to training specification (2,000 features).
18. **ML-04:** `MLPredictor` successfully initializes from JSON model parameters.
19. **ML-05:** Prediction on canonical valid program returns `valid` with high confidence.
20. **ML-06:** Prediction on arithmetic expression returns `valid`.
21. **ML-07:** Prediction on conditional control flow block returns `valid`.
22. **ML-08:** Feature extraction returns top discriminating n-grams and weight differentials.
23. **ML-09:** Softmax normalized probability distribution sums exactly to 1.0.
24. **ML-10:** Independent execution of authoritative compiler parser and probabilistic predictor verified without cross-engine regression.

All 24 automated tests pass with 100% compliance.
