# JFLAP 7.1 Models: FLA-Lang Compiler Front-End

**Course:** Formal Languages and Automata (FLA)  
**Parent Project:** FLA-Lang — Compiler Front-End Using Formal Languages and Automata  
**Target Simulator:** JFLAP 7.1 (Java Formal Languages and Automata Package)  
**Format:** Validated JFLAP XML (`.jff`)  

---

## 1. Directory Catalog & Manifest

This directory contains validated JFLAP 7.1 `.jff` XML files, backup archives of original drafts, automated Python test harnesses, and theoretical specifications for the lexical and syntactic phases of the **FLA-Lang** compiler front-end:

| File Name | Model Type | JFLAP `<type>` | Status | Description |
| :--- | :--- | :--- | :--- | :--- |
| `Identifier_DFA.jff` | Deterministic Finite Automaton | `fa` | Active | Recognizes abstract identifier patterns $L(L \mid D)^*$ |
| `Number_DFA.jff` | Deterministic Finite Automaton | `fa` | Active | Recognizes non-empty digit sequences $D^+$ |
| `FLA_Language_CFG.jff` | Context-Free Grammar (Canonical) | `grammar` | **Corrected** | Unambiguous CFG using single-character terminals; supports declarations, initialized declarations, assignments, and precedence |
| `FLA_Language_CFG_LL1.jff` | Context-Free Grammar (LL(1)) | `grammar` | **Corrected** | Non-left-recursive, left-factored equivalent CFG verified strictly LL(1) with 0 table conflicts |
| `FLA_Language_CFG_backup.jff` | Context-Free Grammar (Original) | `grammar` | Backup | Original uncorrected draft with multi-character tokens |
| `FLA_Language_CFG_LL1_backup.jff` | Context-Free Grammar (Original) | `grammar` | Backup | Original uncorrected draft with left-recursion conflicts |
| `test_cfg_models.py` | Python Test Suite | CLI Tool | Active | Automated 31-case verification harness for CFG and LL(1) parsers |
| `verify_grammars.py` | Python LL(1) Analyzer | CLI Tool | Active | Mathematical FIRST/FOLLOW and LL(1) table generator |
| `README_JFLAP.md` | Documentation | Markdown | Active | Comprehensive specifications, token mapping, and testing guide |

---

## 2. Model 1: Identifier Recognizer DFA (`Identifier_DFA.jff`)

### 2.1 Formal 5-Tuple Definition
The identifier recognizer is modeled as a deterministic finite automaton:
$$M_{\text{id}} = (Q, \Sigma, \delta, q_0, F)$$

Where:
* **States:** $Q = \{q_0, q_1\}$
* **Alphabet:** $\Sigma = \{L, D\}$
  * $L$: Abstract letter input symbol
  * $D$: Abstract digit input symbol
* **Initial State:** $q_0 \in Q$ (non-final)
* **Final / Accepting States:** $F = \{q_1\}$
* **Transition Function ($\delta$):**
  $$\delta: Q \times \Sigma \rightarrow Q$$
  $$\delta(q_0, L) = q_1$$
  $$\delta(q_1, L) = q_1$$
  $$\delta(q_1, D) = q_1$$
  *Note: $\delta(q_0, D)$ is intentionally undefined (implicit trap/rejection).*

### 2.2 Transition Table
| State | Input $L$ | Input $D$ | Status |
| :---: | :---: | :---: | :---: |
| $\rightarrow q_0$ | $q_1$ | $\varnothing$ (Reject) | Initial, Non-Final |
| $* q_1$ | $q_1$ | $q_1$ | Final / Accepting |

### 2.3 Regular Language & Expression
$$L(M_{\text{id}}) = \{ w \in \{L, D\}^* \mid w \text{ begins with } L \} = \mathcal{L}(L(L \mid D)^*)$$

### 2.4 Verification & Test Suite
| Input String | Expected Result | Transition Path | Explanation |
| :--- | :---: | :--- | :--- |
| `L` | **ACCEPT** | $q_0 \xrightarrow{L} q_1$ | Single letter identifier (ends in $q_1 \in F$) |
| `LL` | **ACCEPT** | $q_0 \xrightarrow{L} q_1 \xrightarrow{L} q_1$ | Two consecutive letters |
| `LD` | **ACCEPT** | $q_0 \xrightarrow{L} q_1 \xrightarrow{D} q_1$ | Letter followed by digit |
| `LDL` | **ACCEPT** | $q_0 \xrightarrow{L} q_1 \xrightarrow{D} q_1 \xrightarrow{L} q_1$ | Mixed letters and digits starting with letter |
| `D` | **REJECT** | $q_0 \xrightarrow{D} \varnothing$ | No transition defined from $q_0$ on $D$ |
| `DL` | **REJECT** | $q_0 \xrightarrow{D} \varnothing$ | Machine halts/crashes on first symbol |
| $\varepsilon$ (empty) | **REJECT** | $q_0$ (remains) | Machine stays in $q_0 \notin F$ |

---

## 3. Model 2: Number Recognizer DFA (`Number_DFA.jff`)

### 3.1 Formal 5-Tuple Definition
The number recognizer is modeled as a deterministic finite automaton:
$$M_{\text{num}} = (Q, \Sigma, \delta, q_0, F)$$

Where:
* **States:** $Q = \{q_0, q_1\}$
* **Alphabet:** $\Sigma = \{D\}$ (where $D$ represents an abstract digit)
* **Initial State:** $q_0 \in Q$ (non-final)
* **Final / Accepting States:** $F = \{q_1\}$
* **Transition Function ($\delta$):**
  $$\delta: Q \times \Sigma \rightarrow Q$$
  $$\delta(q_0, D) = q_1$$
  $$\delta(q_1, D) = q_1$$

### 3.2 Transition Table
| State | Input $D$ | Other / $L$ | Status |
| :---: | :---: | :---: | :---: |
| $\rightarrow q_0$ | $q_1$ | $\varnothing$ (Reject) | Initial, Non-Final |
| $* q_1$ | $q_1$ | $\varnothing$ (Reject) | Final / Accepting |

### 3.3 Regular Language & Expression
$$L(M_{\text{num}}) = \{ D^n \mid n \ge 1 \} = \mathcal{L}(D^+)$$

### 3.4 Verification & Test Suite
| Input String | Expected Result | Transition Path | Explanation |
| :--- | :---: | :--- | :--- |
| `D` | **ACCEPT** | $q_0 \xrightarrow{D} q_1$ | Single digit (ends in $q_1 \in F$) |
| `DD` | **ACCEPT** | $q_0 \xrightarrow{D} q_1 \xrightarrow{D} q_1$ | Two digits |
| `DDD` | **ACCEPT** | $q_0 \xrightarrow{D} q_1 \xrightarrow{D} q_1 \xrightarrow{D} q_1$ | Three digits |
| $\varepsilon$ (empty) | **REJECT** | $q_0$ (remains) | Zero digits; ends in $q_0 \notin F$ |
| `L` | **REJECT** | $q_0 \xrightarrow{L} \varnothing$ | Symbol $L \notin \Sigma$; no transition from $q_0$ |
| `LD` | **REJECT** | $q_0 \xrightarrow{L} \varnothing$ | Machine halts immediately on $L$ |

---

## 4. Root Cause Analysis: Why JFLAP 7.1 Rejected the Original CFG Models

When testing `FLA_Language_CFG.jff` in JFLAP 7.1's **Brute Force Parse**, entering the natural declaration statement `int id;` failed. The exact technical causes were:

### 4.1 JFLAP 7.1 Treats Symbols as Individual Characters, Not Lexical Tokens
* In standard JFLAP 7.1, grammars do not possess a lexical scanner layer.
* Any character sequence entered into a production RHS is evaluated character-by-character:
  * `<right>int</right>` does not define a single token `INT`; it generates the sequence of three literal characters `'i'`, `'n'`, `'t'`.
  * `<right>id</right>` does not define an identifier category; it generates the two literal characters `'i'`, `'d'`.
  * `<right>num</right>` generates the three literal characters `'n'`, `'u'`, `'m'`.

### 4.2 Spaces in JFLAP Productions are Literal Terminals
* In `FLA_Language_CFG.jff`, production 3 was:
  ```xml
  <production>
      <left>D</left>
      <right>T id ;</right>
  </production>
  ```
* JFLAP treats the ASCII space character (`' '`) as an explicit terminal symbol.
* When $T \Rightarrow \text{int}$, the generated string of terminal characters is:
  `'i', 'n', 't', ' ', 'i', 'd', ' ', ';'` (length 8, containing a space before the semicolon).
* When a user inputs standard syntax `int id;` (length 7, no space before `;`), JFLAP compares character 6: input has `';'`, but the grammar requires `' '`. Hence, Brute Force Parse **rejects** the input.

### 4.3 Overlapping Prefix Collisions
* Both `int` and `id` begin with the letter `'i'`. When expanding rules character-by-character, JFLAP's combinatorial search explores branches where `'i'` comes from `id` versus `int`, degrading parse performance.

### 4.4 Original LL(1) Grammar Contained Un-Factored FIRST/FIRST Conflicts
* In `FLA_Language_CFG_LL1.jff`, the declaration rules were:
  $$D \rightarrow T\text{ id ;} \mid T\text{ id = num ;}$$
* Because both alternatives begin with $T$, their FIRST sets overlap: $\text{FIRST}(T) = \{\text{int}, \text{float}\}$.
* When JFLAP generates the LL(1) parse table (`Test -> Build LL(1) Parse Table`), cells $(D, \text{int})$ and $(D, \text{float})$ receive two candidate productions, causing LL(1) table conflicts. The grammar was not left-factored.

---

## 5. Model 3: Corrected Character-Level CFG (`FLA_Language_CFG.jff`)

To adhere to JFLAP 7.1's character-level parser architecture, the corrected grammar utilizes **single-character terminals** representing token classes.

### 5.1 Terminal Symbol Mapping
| JFLAP Terminal | Programming Language Token | Real Source Code Equivalent | Semantic Role |
| :---: | :--- | :--- | :--- |
| **`i`** | `INT_TYPE` | `int` | Integer type keyword |
| **`f`** | `FLOAT_TYPE` | `float` | Floating-point type keyword |
| **`v`** | `IDENTIFIER` | `x`, `count`, `total` | Variable identifier placeholder |
| **`n`** | `NUMBER` | `0`, `42`, `3.14` | Numeric literal placeholder |
| **`=`** | `ASSIGN_OP` | `=` | Assignment operator |
| **`+`** | `ADD_OP` | `+` | Arithmetic addition |
| **`*`** | `MUL_OP` | `*` | Arithmetic multiplication |
| **`;`** | `SEMICOLON` | `;` | Statement terminator |
| **`(`** | `LPAREN` | `(` | Left grouping parenthesis |
| **`)`** | `RPAREN` | `)` | Right grouping parenthesis |

### 5.2 Non-Terminal Symbol Mapping
| Non-Terminal | Canonical Role | Definition |
| :---: | :--- | :--- |
| **`S`** | Statement (Start Symbol) | Generates either a declaration ($D$) or an assignment ($A$) |
| **`D`** | Declaration | Generates uninitialized ($Tv;$) or initialized ($Tv=E;$) declarations |
| **`T`** | Type Specifier | Generates primitive type ($i$ or $f$) |
| **`A`** | Assignment | Generates assignment statement ($v=E;$) |
| **`E`** | Expression (Additive) | Left-recursive addition of terms ($E+B \mid B$) |
| **`B`** | Term (Multiplicative) | Left-recursive multiplication of factors ($B*F \mid F$) |
| **`F`** | Factor (Primary) | Atomic operand: variable ($v$), number ($n$), or sub-expression ($(E)$) |

### 5.3 Complete Production Rule Set (14 Rules)
```text
[R1]   S -> D
[R2]   S -> A
[R3]   D -> Tv;
[R4]   D -> Tv=E;
[R5]   T -> i
[R6]   T -> f
[R7]   A -> v=E;
[R8]   E -> E+B
[R9]   E -> B
[R10]  B -> B*F
[R11]  B -> F
[R12]  F -> v
[R13]  F -> n
[R14]  F -> (E)
```

### 5.4 Operator Precedence and Left-Associativity
1. **Multiplication over Addition:** Multiplications are generated at the $B$ level ($B \rightarrow B*F \mid F$), while additions are generated at the $E$ level ($E \rightarrow E+B \mid B$). Because $E$ derives $B$, all $*$ operations sit deeper in the parse tree and bind before $+$.
2. **Left-Associativity:** The rules $E \rightarrow E+B$ and $B \rightarrow B*F$ are left-recursive, enforcing left-to-right evaluation: $a+b+c \equiv (a+b)+c$.
3. **Primary Parentheses:** Production $F \rightarrow (E)$ permits sub-expressions to override normal precedence.

### 5.5 Canonical Derivation Walkthroughs

#### Derivation 1: Variable Declaration (`iv;` $\equiv$ `int id;`)
$$S \Rightarrow D \Rightarrow Tv; \Rightarrow iv;$$

#### Derivation 2: Initialized Declaration with Precedence (`iv=n+v*n;` $\equiv$ `int id = num + id * num;`)
$$\begin{aligned}
S &\Rightarrow D \\
  &\Rightarrow Tv=E; \\
  &\Rightarrow iv=E; \\
  &\Rightarrow iv=E+B; \\
  &\Rightarrow iv=B+B; \\
  &\Rightarrow iv=F+B; \\
  &\Rightarrow iv=n+B; \\
  &\Rightarrow iv=n+B*F; \\
  &\Rightarrow iv=n+F*F; \\
  &\Rightarrow iv=n+v*F; \\
  &\Rightarrow iv=n+v*n;
\end{aligned}$$
*In the resulting derivation, $v*n$ is grouped under term $B$, confirming multiplication binds tighter than addition.*

#### Derivation 3: Parenthesized Assignment (`v=(n+v)*n;` $\equiv$ `id = (num + id) * num;`)
$$\begin{aligned}
S &\Rightarrow A \\
  &\Rightarrow v=E; \\
  &\Rightarrow v=B; \\
  &\Rightarrow v=B*F; \\
  &\Rightarrow v=F*F; \\
  &\Rightarrow v=(E)*F; \\
  &\Rightarrow v=(E+B)*F; \\
  &\Rightarrow v=(B+B)*F; \\
  &\Rightarrow v=(F+B)*F; \\
  &\Rightarrow v=(n+B)*F; \\
  &\Rightarrow v=(n+F)*F; \\
  &\Rightarrow v=(n+v)*F; \\
  &\Rightarrow v=(n+v)*n;
\end{aligned}$$

---

## 6. Model 4: Corrected Non-Left-Recursive LL(1) CFG (`FLA_Language_CFG_LL1.jff`)

The file `FLA_Language_CFG_LL1.jff` is fully transformed to allow JFLAP's LL(1) parse table generator to build a conflict-free predictive parsing table.

### 6.1 Transformations Applied

#### 1. Elimination of Immediate Left Recursion
* For $E \rightarrow E+B \mid B$:
  $$E \rightarrow BX$$
  $$X \rightarrow +BX \mid \lambda$$
* For $B \rightarrow B*F \mid F$:
  $$B \rightarrow FY$$
  $$Y \rightarrow *FY \mid \lambda$$

#### 2. Left-Factoring Declaration Rules (Eliminating FIRST/FIRST Conflict)
The canonical declaration rules share a common prefix:
$$D \rightarrow Tv; \mid Tv=E;$$
Factoring out the shared prefix $Tv$ introduces the continuation variable $C$:
$$D \rightarrow TvC$$
$$C \rightarrow ;$$
$$C \rightarrow =E;$$

* **Lambda Minimization:** In this left-factored formulation, variable $C$ resolves strictly between $;$ and $=E;$. It does **not** introduce an unnecessary lambda production ($\lambda$ is only used for $X$ and $Y$ where mathematically required for left-recursion elimination).
* $\text{FIRST}(;) = \{ ; \}$ and $\text{FIRST}(=E;) = \{ = \}$.
* Since $\{ ; \} \cap \{ = \} = \varnothing$, there is **zero conflict** on $C$.

### 6.2 Complete Production Rule Set (17 Rules)
```text
[R1]   S -> D
[R2]   S -> A
[R3]   D -> TvC
[R4]   C -> ;
[R5]   C -> =E;
[R6]   T -> i
[R7]   T -> f
[R8]   A -> v=E;
[R9]   E -> BX
[R10]  X -> +BX
[R11]  X -> λ
[R12]  B -> FY
[R13]  Y -> *FY
[R14]  Y -> λ
[R15]  F -> v
[R16]  F -> n
[R17]  F -> (E)
```
*(In JFLAP XML, $\lambda$ productions [R11] and [R14] are written with empty `<right></right>` tags).*

### 6.3 Mathematical FIRST and FOLLOW Sets

| Variable | $\text{FIRST}(V)$ | $\text{FOLLOW}(V)$ |
| :---: | :--- | :--- |
| **`S`** | $\{ f, i, v \}$ | $\{ \$ \}$ |
| **`D`** | $\{ f, i \}$ | $\{ \$ \}$ |
| **`C`** | $\{ ;, = \}$ | $\{ \$ \}$ |
| **`T`** | $\{ f, i \}$ | $\{ v \}$ |
| **`A`** | $\{ v \}$ | $\{ \$ \}$ |
| **`E`** | $\{ (, n, v \}$ | $\{ ), ; \}$ |
| **`X`** | $\{ +, \lambda \}$ | $\{ ), ; \}$ |
| **`B`** | $\{ (, n, v \}$ | $\{ ), +, ; \}$ |
| **`Y`** | $\{ *, \lambda \}$ | $\{ ), +, ; \}$ |
| **`F`** | $\{ (, n, v \}$ | $\{ ), *, +, ; \}$ |

### 6.4 LL(1) Parse Table Matrix

| Non-Terminal | `(` | `)` | `*` | `+` | `;` | `=` | `f` | `i` | `n` | `v` | `$` |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`S`** | | | | | | | $S \rightarrow D$ | $S \rightarrow D$ | | $S \rightarrow A$ | |
| **`D`** | | | | | | | $D \rightarrow TvC$ | $D \rightarrow TvC$ | | | |
| **`C`** | | | | | $C \rightarrow ;$ | $C \rightarrow =E;$ | | | | | |
| **`T`** | | | | | | | $T \rightarrow f$ | $T \rightarrow i$ | | | |
| **`A`** | | | | | | | | | | $A \rightarrow v=E;$ | |
| **`E`** | $E \rightarrow BX$ | | | | | | | | $E \rightarrow BX$ | $E \rightarrow BX$ | |
| **`X`** | | $X \rightarrow \lambda$ | | $X \rightarrow +BX$ | $X \rightarrow \lambda$ | | | | | | |
| **`B`** | $B \rightarrow FY$ | | | | | | | | $B \rightarrow FY$ | $B \rightarrow FY$ | |
| **`Y`** | | $Y \rightarrow \lambda$ | $Y \rightarrow *FY$ | $Y \rightarrow \lambda$ | $Y \rightarrow \lambda$ | | | | | | |
| **`F`** | $F \rightarrow (E)$ | | | | | | | | $F \rightarrow n$ | $F \rightarrow v$ | |

**Conflict Count:** Exactly **0 conflicts**. Every table entry is unique. The grammar is strictly LL(1).

---

## 7. Automated Test Suite Results

All grammar models have been verified programmatically via `test_cfg_models.py` across 31 test cases covering syntax features, operator precedence, associativity, and error rejection:

```text
======================================================================
1. GRAMMAR STRUCTURE & SYMBOL VERIFICATION
======================================================================
FLA_Language_CFG.jff:
  Productions count : 14
  Variables (V)     : ['A', 'B', 'D', 'E', 'F', 'S', 'T']
  Terminals (Sigma) : ['(', ')', '*', '+', ';', '=', 'f', 'i', 'n', 'v']

FLA_Language_CFG_LL1.jff:
  Productions count : 17
  Variables (V)     : ['A', 'B', 'C', 'D', 'E', 'F', 'S', 'T', 'X', 'Y']
  Terminals (Sigma) : ['(', ')', '*', '+', ';', '=', 'f', 'i', 'n', 'v']

======================================================================
2. LL(1) MATHEMATICAL VERIFICATION (FIRST, FOLLOW, PARSE TABLE)
======================================================================
LL(1) Table Conflicts: 0
  RESULT: SUCCESS — The grammar is STRICTLY LL(1) with ZERO conflicts!

======================================================================
3. BATCH STRING ACCEPTANCE & REJECTION TEST SUITE
======================================================================
Test Input       | Expected | CFG      | LL(1)    | Status | Description
-----------------------------------------------------------------------------------------------
iv;              | ACCEPT   | ACCEPT   | ACCEPT   | PASS   | Uninitialized int declaration
fv;              | ACCEPT   | ACCEPT   | ACCEPT   | PASS   | Uninitialized float declaration
iv=n;            | ACCEPT   | ACCEPT   | ACCEPT   | PASS   | Initialized int declaration with number literal
fv=n;            | ACCEPT   | ACCEPT   | ACCEPT   | PASS   | Initialized float declaration with number literal
iv=v;            | ACCEPT   | ACCEPT   | ACCEPT   | PASS   | Initialized int declaration with identifier
iv=n+v*n;        | ACCEPT   | ACCEPT   | ACCEPT   | PASS   | Initialized declaration with precedence expression
iv=(n+v)*n;      | ACCEPT   | ACCEPT   | ACCEPT   | PASS   | Initialized declaration with parenthesized expression
v=n;             | ACCEPT   | ACCEPT   | ACCEPT   | PASS   | Simple assignment with number
v=v;             | ACCEPT   | ACCEPT   | ACCEPT   | PASS   | Simple assignment with identifier
v=n+n;           | ACCEPT   | ACCEPT   | ACCEPT   | PASS   | Assignment with addition
v=n*n;           | ACCEPT   | ACCEPT   | ACCEPT   | PASS   | Assignment with multiplication
v=n+v*n;         | ACCEPT   | ACCEPT   | ACCEPT   | PASS   | Assignment with addition and multiplication precedence
v=v*n+n;         | ACCEPT   | ACCEPT   | ACCEPT   | PASS   | Assignment with multiplication before addition
v=(n+v)*n;       | ACCEPT   | ACCEPT   | ACCEPT   | PASS   | Assignment with parentheses overriding precedence
v=((n));         | ACCEPT   | ACCEPT   | ACCEPT   | PASS   | Assignment with nested parentheses
v=v+v+v;         | ACCEPT   | ACCEPT   | ACCEPT   | PASS   | Assignment with chained addition
v=v*v*v;         | ACCEPT   | ACCEPT   | ACCEPT   | PASS   | Assignment with chained multiplication
iv               | REJECT   | REJECT   | REJECT   | PASS   | Missing statement terminating semicolon
v=               | REJECT   | REJECT   | REJECT   | PASS   | Incomplete assignment statement
i;               | REJECT   | REJECT   | REJECT   | PASS   | Missing identifier in declaration
v=;              | REJECT   | REJECT   | REJECT   | PASS   | Missing right-hand expression in assignment
v=n+             | REJECT   | REJECT   | REJECT   | PASS   | Trailing binary addition operator
v=*n;            | REJECT   | REJECT   | REJECT   | PASS   | Leading multiplication operator in expression
v=n+*v;          | REJECT   | REJECT   | REJECT   | PASS   | Consecutive operators without operand
v=(n+n;          | REJECT   | REJECT   | REJECT   | PASS   | Unclosed parenthesis
v=n+n);          | REJECT   | REJECT   | REJECT   | PASS   | Unmatched closing parenthesis
v=();            | REJECT   | REJECT   | REJECT   | PASS   | Empty parentheses without inner expression
int id;          | REJECT   | REJECT   | REJECT   | PASS   | Old multi-character token format (rejected by character-level grammar)
iv==n;           | REJECT   | REJECT   | REJECT   | PASS   | Relational operator == not part of statement CFG
n=v;             | REJECT   | REJECT   | REJECT   | PASS   | Assignment target is numeric literal instead of identifier
+v;              | REJECT   | REJECT   | REJECT   | PASS   | Expression statement without assignment
-----------------------------------------------------------------------------------------------
CFG Model Pass Rate:   31/31 (100.0%)
LL(1) Model Pass Rate: 31/31 (100.0%)
```

---

## 8. Verification Matrix: Programmatic vs. JFLAP GUI

To maintain scientific rigor and clear boundaries:

| Verification Task | Method Executed | Result | Requires JFLAP GUI Execution? |
| :--- | :--- | :---: | :---: |
| Well-Formed JFLAP XML | Python `xml.etree.ElementTree` | **PASS** | No (Validated programmatic) |
| Grammar Schema (`<type>grammar</type>`) | Python Schema Validator | **PASS** | No (Validated programmatic) |
| Single-character terminals ($\Sigma$) | Python Symbol Inspector | **PASS** | No (Validated programmatic) |
| Elimination of left-recursion ($E, B$) | Graph reachability check | **PASS** | No (Validated programmatic) |
| Left-factoring of declaration ($D$) | FIRST/FIRST disjointness | **PASS** | No (Validated programmatic) |
| LL(1) Parse Table (0 conflicts) | Table construction algorithm | **PASS** | No (Validated programmatic) |
| 31 Valid / Invalid String Parses | BFS & Earley Parsers | **PASS (31/31)** | No (Validated programmatic) |
| Interactive Graphical Parse Tree Render | Visual Inspection | Pending | **YES — Open in JFLAP 7.1 GUI** |
| Step-by-Step Derivation Animation | GUI Animation | Pending | **YES — Open in JFLAP 7.1 GUI** |
| CFG to PDA Converter (`Convert -> Convert CFG to PDA`) | JFLAP Internal Tool | Pending | **YES — Open in JFLAP 7.1 GUI** |
| Visual LL(1) Table Viewer (`Test -> Build LL(1) Parse Table`) | JFLAP Internal GUI | Pending | **YES — Open in JFLAP 7.1 GUI** |

> [!IMPORTANT]
> **GUI Validation Disclaimer:**  
> The models have been mathematically verified and pass 100% of headless algorithmic tests. The JFLAP graphical parse tree renderings and step animations must be visually confirmed inside the JFLAP 7.1 desktop application by following the steps below.

---

## 9. Step-by-Step Instructions for Opening & Testing in JFLAP 7.1 GUI

### 9.1 Opening the Canonical Grammar (`FLA_Language_CFG.jff`)
1. Launch JFLAP 7.1 (`java -jar JFLAP7.1.jar`).
2. Click **File** $\rightarrow$ **Open...**
3. Select `FLA_Language_CFG.jff` from `C:\Users\vy650\OneDrive\Desktop\FLA-Compiler-Frontend\JFLAP_Models\`.
4. Observe the 14 productions listed cleanly without multi-character tokens.

### 9.2 Running Brute Force Parse
1. In the menu bar, click **Input** $\rightarrow$ **Brute Force Parse**.
2. Enter character-level inputs in the input bar:
   * To test variable declaration: type `iv;` and click **Start**.
   * Click **Step** or **Derive**. A full graphical parse tree starting from $S \Rightarrow D \Rightarrow Tv; \Rightarrow iv;$ will render in green.
   * To test initialized declaration: type `iv=n;` and click **Derive**.
   * To test operator precedence: type `v=n+v*n;` and click **Derive**.
   * To test parentheses: type `v=(n+v)*n;` and click **Derive**.
3. Try invalid strings such as `iv` (missing semicolon) or `v=n+` (trailing operator) to observe immediate rejection.

### 9.3 Inspecting the LL(1) Table (`FLA_Language_CFG_LL1.jff`)
1. Click **File** $\rightarrow$ **Open...** and select `FLA_Language_CFG_LL1.jff`.
2. In the menu bar, click **Test** $\rightarrow$ **Build LL(1) Parse Table**.
3. JFLAP will open the LL(1) workspace displaying the FIRST and FOLLOW table and the parse matrix.
4. Click **Complete** (or enter the table entries interactively).
5. Confirm that JFLAP produces a **conflict-free parse table** with no highlighted warning cells.
