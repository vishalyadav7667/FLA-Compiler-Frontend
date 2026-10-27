/**
 * FLA-Lang Syntax Analyzer (Recursive Descent Parser)
 * Subject: Formal Languages and Automata (FLA)
 * 
 * Implements a recursive descent predictive parser for the LL(1)-style CFG:
 * 
 * Production Rules:
 *  [R1]  <Program>      ::= <StmtList>
 *  [R2]  <StmtList>     ::= <Stmt> <StmtList> | ε
 *  [R3]  <Stmt>         ::= <DeclStmt> | <AssignStmt> | <IfStmt> | <WhileStmt> | <BlockStmt>
 *  [R4]  <DeclStmt>     ::= <Type> IDENT [ '=' <Expr> ] ';'
 *  [R5]  <Type>         ::= 'int' | 'float' | 'bool'
 *  [R6]  <AssignStmt>   ::= IDENT '=' <Expr> ';'
 *  [R7]  <IfStmt>       ::= 'if' '(' <CondExpr> ')' <Stmt> [ 'else' <Stmt> ]
 *  [R8]  <WhileStmt>    ::= 'while' '(' <CondExpr> ')' <Stmt>
 *  [R9]  <BlockStmt>    ::= '{' <StmtList> '}'
 *  [R10] <CondExpr>     ::= <Expr> <RelOp> <Expr>
 *  [R11] <RelOp>        ::= '==' | '<' | '>'
 *  [R12] <Expr>         ::= <Term> ( ('+' | '-') <Term> )*
 *  [R13] <Term>         ::= <Factor> ( ('*' | '/') <Factor> )*
 *  [R14] <Factor>       ::= IDENT | NUMBER | '(' <Expr> ')' | '-' <Factor>
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const lexerModule = require('./lexer.js');
    module.exports = factory(lexerModule);
  } else {
    root.FLAParser = factory(root.FLALexer);
  }
}(typeof self !== 'undefined' ? self : this, function (lexerModule) {

  const { TokenType } = lexerModule;

  class SyntaxError {
    constructor(message, line, column, foundToken = null) {
      this.message = message;
      this.line = line;
      this.column = column;
      this.foundToken = foundToken;
    }

    toString() {
      const tokenDesc = this.foundToken ? ` (got '${this.foundToken.value}')` : '';
      return `Syntax Error [Line ${this.line}, Col ${this.column}]: ${this.message}${tokenDesc}`;
    }
  }

  class ASTNode {
    constructor(type, props = {}) {
      this.type = type;
      Object.assign(this, props);
    }
  }

  class Parser {
    constructor(tokens = []) {
      this.tokens = tokens;
      this.current = 0;
      this.errors = [];
      this.derivations = [];
    }

    reset(tokens = []) {
      this.tokens = tokens;
      this.current = 0;
      this.errors = [];
      this.derivations = [];
    }

    recordRule(ruleId, description) {
      this.derivations.push({ ruleId, description });
    }

    peek() {
      if (this.current < this.tokens.length) {
        return this.tokens[this.current];
      }
      return this.tokens[this.tokens.length - 1]; // EOF token
    }

    previous() {
      return this.tokens[this.current - 1];
    }

    isAtEnd() {
      return this.peek().type === TokenType.EOF;
    }

    advance() {
      if (!this.isAtEnd()) {
        this.current++;
      }
      return this.previous();
    }

    check(tokenType, tokenValue = null) {
      if (this.isAtEnd() && tokenType !== TokenType.EOF) return false;
      const tok = this.peek();
      if (tok.type !== tokenType) return false;
      if (tokenValue !== null && tok.value !== tokenValue) return false;
      return true;
    }

    match(tokenType, tokenValue = null) {
      if (this.check(tokenType, tokenValue)) {
        return this.advance();
      }
      return null;
    }

    consume(tokenType, expectedDescription, tokenValue = null) {
      if (this.check(tokenType, tokenValue)) {
        return this.advance();
      }
      const tok = this.peek();
      const err = new SyntaxError(
        `Expected ${expectedDescription}`,
        tok.line,
        tok.column,
        tok
      );
      this.errors.push(err);
      throw err;
    }

    synchronize() {
      this.advance();
      while (!this.isAtEnd()) {
        if (this.previous().value === ';') return;
        switch (this.peek().value) {
          case 'int':
          case 'float':
          case 'bool':
          case 'if':
          case 'while':
          case '{':
          case '}':
            return;
        }
        this.advance();
      }
    }

    /**
     * Parse the complete token stream into an AST
     * @returns {{ ast: ASTNode|null, errors: SyntaxError[], derivations: Array }}
     */
    parse() {
      this.errors = [];
      this.derivations = [];
      this.current = 0;

      this.recordRule('[R1]', '<Program> ::= <StmtList>');
      let stmts = [];

      try {
        stmts = this.parseStmtList();
        if (!this.isAtEnd()) {
          const extra = this.peek();
          this.errors.push(new SyntaxError(
            `Unexpected input after complete program`,
            extra.line,
            extra.column,
            extra
          ));
        }
      } catch (err) {
        // Top-level caught; errors array already contains error
      }

      const ast = new ASTNode('Program', {
        statements: stmts,
        line: 1,
        column: 1
      });

      return {
        ast: this.errors.length === 0 ? ast : null,
        partialAst: ast,
        errors: this.errors,
        derivations: this.derivations
      };
    }

    // <StmtList> ::= <Stmt> <StmtList> | ε
    parseStmtList() {
      const stmts = [];
      while (!this.isAtEnd() && this.peek().value !== '}') {
        this.recordRule('[R2a]', '<StmtList> ::= <Stmt> <StmtList>');
        try {
          const stmt = this.parseStmt();
          if (stmt) {
            stmts.push(stmt);
          }
        } catch (e) {
          this.synchronize();
        }
      }
      this.recordRule('[R2b]', '<StmtList> ::= ε');
      return stmts;
    }

    // <Stmt> ::= <DeclStmt> | <AssignStmt> | <IfStmt> | <WhileStmt> | <BlockStmt>
    parseStmt() {
      const tok = this.peek();

      if (tok.type === TokenType.KEYWORD) {
        if (tok.value === 'int' || tok.value === 'float' || tok.value === 'bool') {
          this.recordRule('[R3a]', '<Stmt> ::= <DeclStmt>');
          return this.parseDeclStmt();
        }
        if (tok.value === 'if') {
          this.recordRule('[R3c]', '<Stmt> ::= <IfStmt>');
          return this.parseIfStmt();
        }
        if (tok.value === 'while') {
          this.recordRule('[R3d]', '<Stmt> ::= <WhileStmt>');
          return this.parseWhileStmt();
        }
      }

      if (tok.type === TokenType.IDENTIFIER) {
        this.recordRule('[R3b]', '<Stmt> ::= <AssignStmt>');
        return this.parseAssignStmt();
      }

      if (tok.type === TokenType.DELIMITER && tok.value === '{') {
        this.recordRule('[R3e]', '<Stmt> ::= <BlockStmt>');
        return this.parseBlockStmt();
      }

      const err = new SyntaxError(
        `Expected declaration, assignment, conditional statement, or block statement`,
        tok.line,
        tok.column,
        tok
      );
      this.errors.push(err);
      throw err;
    }

    // <DeclStmt> ::= <Type> IDENT ( '=' <Expr> )? ';'
    parseDeclStmt() {
      this.recordRule('[R4]', '<DeclStmt> ::= <Type> IDENT [ \'=\' <Expr> ] \';\'');
      const typeTok = this.parseType();
      const idTok = this.consume(TokenType.IDENTIFIER, 'identifier after type specifier');

      let init = null;
      if (this.match(TokenType.ASSIGN_OP, '=')) {
        init = this.parseExpr();
      }

      this.consume(TokenType.DELIMITER, "';' at end of declaration", ';');

      return new ASTNode('VariableDeclaration', {
        dataType: typeTok.value,
        id: idTok.value,
        init: init,
        line: typeTok.line,
        column: typeTok.column
      });
    }

    // <Type> ::= 'int' | 'float' | 'bool'
    parseType() {
      this.recordRule('[R5]', '<Type> ::= \'int\' | \'float\' | \'bool\'');
      const tok = this.peek();
      if (tok.type === TokenType.KEYWORD && (tok.value === 'int' || tok.value === 'float' || tok.value === 'bool')) {
        return this.advance();
      }
      const err = new SyntaxError("type name ('int', 'float', or 'bool')", tok.line, tok.column, tok);
      this.errors.push(err);
      throw err;
    }

    // <AssignStmt> ::= IDENT '=' <Expr> ';'
    parseAssignStmt() {
      this.recordRule('[R6]', '<AssignStmt> ::= IDENT \'=\' <Expr> \';\'');
      const idTok = this.consume(TokenType.IDENTIFIER, 'identifier at start of assignment');
      this.consume(TokenType.ASSIGN_OP, "'=' in assignment statement", '=');
      const expr = this.parseExpr();
      this.consume(TokenType.DELIMITER, "';' at end of assignment", ';');

      return new ASTNode('AssignmentStatement', {
        id: idTok.value,
        expr: expr,
        line: idTok.line,
        column: idTok.column
      });
    }

    // <IfStmt> ::= 'if' '(' <CondExpr> ')' <Stmt> [ 'else' <Stmt> ]
    parseIfStmt() {
      this.recordRule('[R7]', '<IfStmt> ::= \'if\' \'(\' <CondExpr> \')\' <Stmt> [ \'else\' <Stmt> ]');
      const ifTok = this.consume(TokenType.KEYWORD, "'if'", 'if');
      this.consume(TokenType.DELIMITER, "'(' after 'if'", '(');
      const condition = this.parseCondExpr();
      this.consume(TokenType.DELIMITER, "')' after condition", ')');

      const thenBranch = this.parseStmt();
      let elseBranch = null;

      if (this.match(TokenType.KEYWORD, 'else')) {
        elseBranch = this.parseStmt();
      }

      return new ASTNode('IfStatement', {
        condition: condition,
        thenBranch: thenBranch,
        elseBranch: elseBranch,
        line: ifTok.line,
        column: ifTok.column
      });
    }

    // <WhileStmt> ::= 'while' '(' <CondExpr> ')' <Stmt>
    parseWhileStmt() {
      this.recordRule('[R8]', '<WhileStmt> ::= \'while\' \'(\' <CondExpr> \')\' <Stmt>');
      const whileTok = this.consume(TokenType.KEYWORD, "'while'", 'while');
      this.consume(TokenType.DELIMITER, "'(' after 'while'", '(');
      const condition = this.parseCondExpr();
      this.consume(TokenType.DELIMITER, "')' after condition", ')');
      const body = this.parseStmt();

      return new ASTNode('WhileStatement', {
        condition: condition,
        body: body,
        line: whileTok.line,
        column: whileTok.column
      });
    }

    // <BlockStmt> ::= '{' <StmtList> '}'
    parseBlockStmt() {
      this.recordRule('[R9]', '<BlockStmt> ::= \'{\' <StmtList> \'}\'');
      const lbrace = this.consume(TokenType.DELIMITER, "'{' to open block", '{');
      const stmts = this.parseStmtList();
      this.consume(TokenType.DELIMITER, "'}' to close block", '}');

      return new ASTNode('BlockStatement', {
        statements: stmts,
        line: lbrace.line,
        column: lbrace.column
      });
    }

    // <CondExpr> ::= <Expr> <RelOp> <Expr>
    parseCondExpr() {
      this.recordRule('[R10]', '<CondExpr> ::= <Expr> <RelOp> <Expr>');
      const left = this.parseExpr();
      const opTok = this.parseRelOp();
      const right = this.parseExpr();

      return new ASTNode('ComparisonExpression', {
        operator: opTok.value,
        left: left,
        right: right,
        line: opTok.line,
        column: opTok.column
      });
    }

    // <RelOp> ::= '==' | '<' | '>'
    parseRelOp() {
      this.recordRule('[R11]', '<RelOp> ::= \'==\' | \'<\' | \'>\'');
      const tok = this.peek();
      if (tok.type === TokenType.REL_OP) {
        return this.advance();
      }
      const err = new SyntaxError("comparison operator ('==', '<', '>')", tok.line, tok.column, tok);
      this.errors.push(err);
      throw err;
    }

    // <Expr> ::= <Term> ( ('+' | '-') <Term> )*
    parseExpr() {
      this.recordRule('[R12]', '<Expr> ::= <Term> ( (\'+\' | \'-\') <Term> )*');
      let node = this.parseTerm();

      while (this.check(TokenType.ARITHMETIC_OP, '+') || this.check(TokenType.ARITHMETIC_OP, '-')) {
        const opTok = this.advance();
        const right = this.parseTerm();
        node = new ASTNode('BinaryExpression', {
          operator: opTok.value,
          left: node,
          right: right,
          line: opTok.line,
          column: opTok.column
        });
      }

      return node;
    }

    // <Term> ::= <Factor> ( ('*' | '/') <Factor> )*
    parseTerm() {
      this.recordRule('[R13]', '<Term> ::= <Factor> ( (\'*\' | \'/\') <Factor> )*');
      let node = this.parseFactor();

      while (this.check(TokenType.ARITHMETIC_OP, '*') || this.check(TokenType.ARITHMETIC_OP, '/')) {
        const opTok = this.advance();
        const right = this.parseFactor();
        node = new ASTNode('BinaryExpression', {
          operator: opTok.value,
          left: node,
          right: right,
          line: opTok.line,
          column: opTok.column
        });
      }

      return node;
    }

    // <Factor> ::= IDENT | NUMBER | '(' <Expr> ')' | '-' <Factor>
    parseFactor() {
      this.recordRule('[R14]', '<Factor> ::= IDENT | NUMBER | \'(\' <Expr> \')\' | \'-\' <Factor>');
      const tok = this.peek();

      if (tok.type === TokenType.IDENTIFIER) {
        this.advance();
        return new ASTNode('Identifier', {
          name: tok.value,
          line: tok.line,
          column: tok.column
        });
      }

      if (tok.type === TokenType.NUMBER) {
        this.advance();
        const isFloat = tok.value.includes('.');
        return new ASTNode('Literal', {
          value: isFloat ? parseFloat(tok.value) : parseInt(tok.value, 10),
          raw: tok.value,
          literalType: isFloat ? 'float' : 'int',
          line: tok.line,
          column: tok.column
        });
      }

      // Parenthesized expression: '(' <Expr> ')'
      if (this.match(TokenType.DELIMITER, '(')) {
        const expr = this.parseExpr();
        this.consume(TokenType.DELIMITER, "')' to close parenthesized expression", ')');
        return expr;
      }

      // Unary minus: '-' <Factor>
      if (this.match(TokenType.ARITHMETIC_OP, '-')) {
        const opTok = this.previous();
        const operand = this.parseFactor();
        return new ASTNode('UnaryExpression', {
          operator: '-',
          argument: operand,
          line: opTok.line,
          column: opTok.column
        });
      }

      const err = new SyntaxError(
        `Expected identifier, number, or '(' expression`,
        tok.line,
        tok.column,
        tok
      );
      this.errors.push(err);
      throw err;
    }
  }

  return {
    ASTNode,
    SyntaxError,
    Parser
  };
}));
