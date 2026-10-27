/**
 * FLA-Lang Lexical Analyzer (Tokenizer)
 * Subject: Formal Languages and Automata (FLA)
 * 
 * Implements deterministic finite automata-based scanning for:
 * - Keywords: int, float, bool, if, else, while
 * - Identifiers: [a-zA-Z][a-zA-Z0-9]*
 * - Numbers: [0-9]+ and [0-9]+\.[0-9]+
 * - Operators: +, -, *, /, =, ==, <, >
 * - Delimiters: ;, (, ), {, }
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FLALexer = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Token Type Constants
  const TokenType = {
    KEYWORD: 'KEYWORD',
    IDENTIFIER: 'IDENTIFIER',
    NUMBER: 'NUMBER',
    ARITHMETIC_OP: 'ARITHMETIC_OP',
    ASSIGN_OP: 'ASSIGN_OP',
    REL_OP: 'REL_OP',
    DELIMITER: 'DELIMITER',
    EOF: 'EOF'
  };

  const KEYWORDS = new Set(['int', 'float', 'bool', 'if', 'else', 'while']);

  class Token {
    constructor(type, value, line, column, subtype = null) {
      this.type = type;
      this.value = value;
      this.line = line;
      this.column = column;
      this.subtype = subtype || value;
    }

    toString() {
      return `<${this.type}, "${this.value}", L${this.line}:C${this.column}>`;
    }
  }

  class LexicalError {
    constructor(message, line, column, lexeme) {
      this.message = message;
      this.line = line;
      this.column = column;
      this.lexeme = lexeme;
    }

    toString() {
      return `Lexical Error [Line ${this.line}, Col ${this.column}]: ${this.message} (near '${this.lexeme}')`;
    }
  }

  class Lexer {
    constructor(source = '') {
      this.source = source;
      this.length = source.length;
      this.cursor = 0;
      this.line = 1;
      this.column = 1;
      this.tokens = [];
      this.errors = [];
    }

    reset(source = '') {
      this.source = source;
      this.length = source.length;
      this.cursor = 0;
      this.line = 1;
      this.column = 1;
      this.tokens = [];
      this.errors = [];
    }

    peek() {
      return this.cursor < this.length ? this.source[this.cursor] : '\0';
    }

    peekNext() {
      return this.cursor + 1 < this.length ? this.source[this.cursor + 1] : '\0';
    }

    advance() {
      if (this.cursor >= this.length) return '\0';
      const char = this.source[this.cursor++];
      if (char === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      return char;
    }

    isLetter(char) {
      return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
    }

    isDigit(char) {
      return char >= '0' && char <= '9';
    }

    isWhitespace(char) {
      return char === ' ' || char === '\t' || char === '\r' || char === '\n';
    }

    /**
     * Tokenize the input source code
     * @returns {{ tokens: Token[], errors: LexicalError[] }}
     */
    tokenize() {
      this.tokens = [];
      this.errors = [];

      while (this.cursor < this.length) {
        const char = this.peek();

        // 1. Whitespace
        if (this.isWhitespace(char)) {
          this.advance();
          continue;
        }

        // 2. Comments (// to end of line)
        if (char === '/' && this.peekNext() === '/') {
          this.advance(); // /
          this.advance(); // /
          while (this.cursor < this.length && this.peek() !== '\n') {
            this.advance();
          }
          continue;
        }

        const startLine = this.line;
        const startColumn = this.column;

        // 3. Identifiers & Keywords: [a-zA-Z][a-zA-Z0-9]*
        if (this.isLetter(char)) {
          let lexeme = '';
          while (this.isLetter(this.peek()) || this.isDigit(this.peek())) {
            lexeme += this.advance();
          }

          if (KEYWORDS.has(lexeme)) {
            this.tokens.push(new Token(TokenType.KEYWORD, lexeme, startLine, startColumn, `KW_${lexeme.toUpperCase()}`));
          } else {
            this.tokens.push(new Token(TokenType.IDENTIFIER, lexeme, startLine, startColumn));
          }
          continue;
        }

        // 4. Numbers: [0-9]+(\.[0-9]+)?
        if (this.isDigit(char)) {
          let lexeme = '';
          while (this.isDigit(this.peek())) {
            lexeme += this.advance();
          }

          // Check for decimal part
          if (this.peek() === '.') {
            // Peek character after '.'
            if (this.isDigit(this.peekNext())) {
              lexeme += this.advance(); // consume '.'
              while (this.isDigit(this.peek())) {
                lexeme += this.advance();
              }
              // Check if another decimal point follows (e.g. 1.2.3)
              if (this.peek() === '.') {
                lexeme += this.advance();
                while (this.isDigit(this.peek()) || this.peek() === '.') {
                  lexeme += this.advance();
                }
                this.errors.push(new LexicalError(
                  `Malformed numeric literal with multiple decimal points`,
                  startLine,
                  startColumn,
                  lexeme
                ));
                continue;
              }
              this.tokens.push(new Token(TokenType.NUMBER, lexeme, startLine, startColumn, 'FLOAT_LITERAL'));
              continue;
            } else {
              // Number ending in '.' without trailing digits
              lexeme += this.advance(); // consume '.'
              this.errors.push(new LexicalError(
                `Decimal number must have fractional digits after '.'`,
                startLine,
                startColumn,
                lexeme
              ));
              continue;
            }
          }

          // If followed immediately by a letter, e.g. 10abc (invalid identifier / lexical error)
          if (this.isLetter(this.peek())) {
            while (this.isLetter(this.peek()) || this.isDigit(this.peek())) {
              lexeme += this.advance();
            }
            this.errors.push(new LexicalError(
              `Invalid identifier: identifiers cannot start with a digit`,
              startLine,
              startColumn,
              lexeme
            ));
            continue;
          }

          this.tokens.push(new Token(TokenType.NUMBER, lexeme, startLine, startColumn, 'INT_LITERAL'));
          continue;
        }

        // 5. Operators: ==, =, <, >, +, -, *, /
        if (char === '=') {
          this.advance();
          if (this.peek() === '=') {
            this.advance();
            this.tokens.push(new Token(TokenType.REL_OP, '==', startLine, startColumn, 'OP_EQ'));
          } else {
            this.tokens.push(new Token(TokenType.ASSIGN_OP, '=', startLine, startColumn, 'OP_ASSIGN'));
          }
          continue;
        }

        if (char === '<') {
          this.advance();
          this.tokens.push(new Token(TokenType.REL_OP, '<', startLine, startColumn, 'OP_LT'));
          continue;
        }

        if (char === '>') {
          this.advance();
          this.tokens.push(new Token(TokenType.REL_OP, '>', startLine, startColumn, 'OP_GT'));
          continue;
        }

        if (char === '+') {
          this.advance();
          this.tokens.push(new Token(TokenType.ARITHMETIC_OP, '+', startLine, startColumn, 'OP_PLUS'));
          continue;
        }

        if (char === '-') {
          this.advance();
          this.tokens.push(new Token(TokenType.ARITHMETIC_OP, '-', startLine, startColumn, 'OP_MINUS'));
          continue;
        }

        if (char === '*') {
          this.advance();
          this.tokens.push(new Token(TokenType.ARITHMETIC_OP, '*', startLine, startColumn, 'OP_MULT'));
          continue;
        }

        if (char === '/') {
          this.advance();
          this.tokens.push(new Token(TokenType.ARITHMETIC_OP, '/', startLine, startColumn, 'OP_DIV'));
          continue;
        }

        // 6. Delimiters: ;, (, ), {, }
        if (char === ';') {
          this.advance();
          this.tokens.push(new Token(TokenType.DELIMITER, ';', startLine, startColumn, 'DELIM_SEMICOLON'));
          continue;
        }

        if (char === '(') {
          this.advance();
          this.tokens.push(new Token(TokenType.DELIMITER, '(', startLine, startColumn, 'DELIM_LPAREN'));
          continue;
        }

        if (char === ')') {
          this.advance();
          this.tokens.push(new Token(TokenType.DELIMITER, ')', startLine, startColumn, 'DELIM_RPAREN'));
          continue;
        }

        if (char === '{') {
          this.advance();
          this.tokens.push(new Token(TokenType.DELIMITER, '{', startLine, startColumn, 'DELIM_LBRACE'));
          continue;
        }

        if (char === '}') {
          this.advance();
          this.tokens.push(new Token(TokenType.DELIMITER, '}', startLine, startColumn, 'DELIM_RBRACE'));
          continue;
        }

        // 7. Unrecognized character -> Lexical error
        const badChar = this.advance();
        this.errors.push(new LexicalError(
          `Unrecognized character '${badChar}' (${badChar.charCodeAt(0)})`,
          startLine,
          startColumn,
          badChar
        ));
      }

      // Append EOF token
      this.tokens.push(new Token(TokenType.EOF, '<EOF>', this.line, this.column, 'EOF'));

      return {
        tokens: this.tokens,
        errors: this.errors
      };
    }
  }

  return {
    TokenType,
    Token,
    LexicalError,
    Lexer
  };
}));
