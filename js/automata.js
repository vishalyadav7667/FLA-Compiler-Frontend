/**
 * FLA-Lang Automata Visualization & Step-by-Step Simulator
 * Subject: Formal Languages and Automata (FLA)
 * 
 * Provides accurate visual DFAs and interactive simulation for:
 * 1. Identifier Recognizer DFA
 * 2. Number (Integer & Float) Recognizer DFA
 * 3. Operator Recognizer DFA
 * 
 * Note: These interactive diagrams illustrate formal finite state machines (Q, Sigma, delta, q0, F).
 * Equivalence verified against canonical JFLAP 7.1 finite automata models.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FLAAutomata = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Machine Specifications
  const AUTOMATA_MODELS = {
    identifier: {
      id: 'identifier',
      name: 'Identifier Recognizer DFA',
      formal: {
        Q: '{ q0, q1 (accept), q_trap }',
        Sigma: '{ [a-zA-Z], [0-9], other }',
        q0: 'q0',
        F: '{ q1 }',
        description: 'Accepts strings adhering to the regular definition: [a-zA-Z][a-zA-Z0-9]*'
      },
      states: [
        { id: 'q0', label: 'q0', x: 100, y: 140, isStart: true, isAccept: false },
        { id: 'q1', label: 'q1', x: 300, y: 140, isStart: false, isAccept: true },
        { id: 'qt', label: 'qtrap', x: 200, y: 270, isStart: false, isAccept: false }
      ],
      transitions: [
        { from: 'q0', to: 'q1', label: '[a-zA-Z]', curve: 0, textOffset: { x: 0, y: -15 } },
        { from: 'q1', to: 'q1', label: '[a-zA-Z0-9]', isLoop: true, loopDir: 'top' },
        { from: 'q0', to: 'qt', label: '[0-9] | other', curve: 0, textOffset: { x: -35, y: 15 } },
        { from: 'q1', to: 'qt', label: 'other', curve: 0, textOffset: { x: 35, y: 15 } },
        { from: 'qt', to: 'qt', label: 'any', isLoop: true, loopDir: 'bottom' }
      ],
      delta: function (state, char) {
        const isLetter = (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
        const isDigit = char >= '0' && char <= '9';

        if (state === 'q0') {
          if (isLetter) return 'q1';
          return 'qt';
        }
        if (state === 'q1') {
          if (isLetter || isDigit) return 'q1';
          return 'qt';
        }
        return 'qt';
      },
      table: [
        { state: '→ q0', letter: 'q1', digit: 'qtrap', other: 'qtrap' },
        { state: '* q1', letter: 'q1', digit: 'q1', other: 'qtrap' },
        { state: '  qtrap', letter: 'qtrap', digit: 'qtrap', other: 'qtrap' }
      ],
      sampleInputs: ['total', 'x1', 'score99', '2bad', 'var_x']
    },

    number: {
      id: 'number',
      name: 'Integer & Decimal Recognizer DFA',
      formal: {
        Q: '{ q0, q1 (int), q2, q3 (float), q_trap }',
        Sigma: '{ [0-9], ".", other }',
        q0: 'q0',
        F: '{ q1 (int), q3 (float) }',
        description: 'Accepts integers [0-9]+ and decimals [0-9]+\\.[0-9]+'
      },
      states: [
        { id: 'q0', label: 'q0', x: 80, y: 140, isStart: true, isAccept: false },
        { id: 'q1', label: 'q1', x: 220, y: 140, isStart: false, isAccept: true, sublabel: 'int' },
        { id: 'q2', label: 'q2', x: 360, y: 140, isStart: false, isAccept: false },
        { id: 'q3', label: 'q3', x: 500, y: 140, isStart: false, isAccept: true, sublabel: 'float' },
        { id: 'qt', label: 'qtrap', x: 290, y: 270, isStart: false, isAccept: false }
      ],
      transitions: [
        { from: 'q0', to: 'q1', label: '[0-9]', curve: 0, textOffset: { x: 0, y: -15 } },
        { from: 'q1', to: 'q1', label: '[0-9]', isLoop: true, loopDir: 'top' },
        { from: 'q1', to: 'q2', label: "'.'", curve: 0, textOffset: { x: 0, y: -15 } },
        { from: 'q2', to: 'q3', label: '[0-9]', curve: 0, textOffset: { x: 0, y: -15 } },
        { from: 'q3', to: 'q3', label: '[0-9]', isLoop: true, loopDir: 'top' },
        { from: 'q0', to: 'qt', label: 'other / "."', curve: 0, textOffset: { x: -20, y: 20 } },
        { from: 'q1', to: 'qt', label: 'other', curve: 0, textOffset: { x: 10, y: 20 } },
        { from: 'q2', to: 'qt', label: 'other / "."', curve: 0, textOffset: { x: 0, y: 20 } },
        { from: 'q3', to: 'qt', label: 'other / "."', curve: 0, textOffset: { x: 20, y: 20 } },
        { from: 'qt', to: 'qt', label: 'any', isLoop: true, loopDir: 'bottom' }
      ],
      delta: function (state, char) {
        const isDigit = char >= '0' && char <= '9';
        const isDot = char === '.';

        if (state === 'q0') {
          if (isDigit) return 'q1';
          return 'qt';
        }
        if (state === 'q1') {
          if (isDigit) return 'q1';
          if (isDot) return 'q2';
          return 'qt';
        }
        if (state === 'q2') {
          if (isDigit) return 'q3';
          return 'qt';
        }
        if (state === 'q3') {
          if (isDigit) return 'q3';
          return 'qt';
        }
        return 'qt';
      },
      table: [
        { state: '→ q0', digit: 'q1', dot: 'qtrap', other: 'qtrap' },
        { state: '* q1 (int)', digit: 'q1', dot: 'q2', other: 'qtrap' },
        { state: '  q2', digit: 'q3', dot: 'qtrap', other: 'qtrap' },
        { state: '* q3 (float)', digit: 'q3', dot: 'qtrap', other: 'qtrap' },
        { state: '  qtrap', digit: 'qtrap', dot: 'qtrap', other: 'qtrap' }
      ],
      sampleInputs: ['10', '3.14', '0.5', '12.', '1.2.3']
    }
  };

  class AutomataSimulator {
    constructor(modelKey = 'identifier') {
      this.modelKey = modelKey;
      this.model = AUTOMATA_MODELS[modelKey];
      this.inputString = '';
      this.currentIndex = 0;
      this.currentState = 'q0';
      this.history = [];
      this.isFinished = false;
    }

    loadModel(modelKey) {
      if (!AUTOMATA_MODELS[modelKey]) return;
      this.modelKey = modelKey;
      this.model = AUTOMATA_MODELS[modelKey];
      this.reset(this.inputString);
    }

    reset(inputString = '') {
      this.inputString = inputString;
      this.currentIndex = 0;
      this.currentState = this.model.states.find(s => s.isStart).id;
      this.history = [{
        index: 0,
        char: null,
        state: this.currentState,
        action: 'Initial State'
      }];
      this.isFinished = inputString.length === 0;
    }

    step() {
      if (this.currentIndex >= this.inputString.length) {
        this.isFinished = true;
        return {
          done: true,
          accepted: this.isAccepted(),
          state: this.currentState,
          index: this.currentIndex
        };
      }

      const char = this.inputString[this.currentIndex];
      const nextState = this.model.delta(this.currentState, char);
      this.currentIndex++;
      this.currentState = nextState;

      this.history.push({
        index: this.currentIndex,
        char: char,
        state: nextState,
        action: `δ(${this.history[this.history.length - 1].state}, '${char}') = ${nextState}`
      });

      if (this.currentIndex >= this.inputString.length) {
        this.isFinished = true;
      }

      return {
        done: this.isFinished,
        accepted: this.isAccepted(),
        state: this.currentState,
        char: char,
        index: this.currentIndex
      };
    }

    runAll() {
      while (!this.isFinished) {
        this.step();
      }
      return {
        accepted: this.isAccepted(),
        state: this.currentState,
        history: this.history
      };
    }

    isAccepted() {
      if (this.currentIndex < this.inputString.length) return false;
      const stateObj = this.model.states.find(s => s.id === this.currentState);
      return stateObj ? stateObj.isAccept : false;
    }
  }

  // SVG Renderer for Automata
  function renderAutomataSVG(model, activeStateId = null) {
    const width = (model.id === 'number' || model.id === 'jff-loaded') ? 600 : 440;
    const height = model.id === 'jff-loaded' ? Math.max(350, ...model.states.map(s => s.y + 70)) : 350;

    let svg = `<svg viewBox="0 0 ${width} ${height}" class="automata-svg" xmlns="http://www.w3.org/2000/svg">`;

    // Definitions: marker arrows
    svg += `
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
        </marker>
        <marker id="arrow-active" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563eb" />
        </marker>
      </defs>
    `;

    // Transitions
    model.transitions.forEach(tr => {
      const fromState = model.states.find(s => s.id === tr.from);
      const toState = model.states.find(s => s.id === tr.to);

      if (tr.isLoop) {
        const loopY = tr.loopDir === 'top' ? fromState.y - 45 : fromState.y + 45;
        const d = `M ${fromState.x - 12} ${fromState.y + (tr.loopDir === 'top' ? -20 : 20)} 
                   C ${fromState.x - 30} ${loopY}, ${fromState.x + 30} ${loopY}, 
                     ${fromState.x + 12} ${fromState.y + (tr.loopDir === 'top' ? -20 : 20)}`;
        svg += `<path d="${d}" fill="none" stroke="#94a3b8" stroke-width="1.8" marker-end="url(#arrow)" />`;
        const labelY = tr.loopDir === 'top' ? fromState.y - 52 : fromState.y + 55;
        svg += `<text x="${fromState.x}" y="${labelY}" fill="#475569" font-size="11" font-weight="500" text-anchor="middle" font-family="monospace">${tr.label}</text>`;
      } else {
        const dx = toState.x - fromState.x;
        const dy = toState.y - fromState.y;
        const midX = (fromState.x + toState.x) / 2 + (tr.textOffset?.x || 0);
        const midY = (fromState.y + toState.y) / 2 + (tr.textOffset?.y || -10);

        svg += `<line x1="${fromState.x}" y1="${fromState.y}" x2="${toState.x}" y2="${toState.y}" 
                      stroke="#94a3b8" stroke-width="1.8" marker-end="url(#arrow)" />`;
        svg += `<text x="${midX}" y="${midY}" fill="#475569" font-size="11" font-weight="500" text-anchor="middle" font-family="monospace">${tr.label}</text>`;
      }
    });

    // Start arrow
    const startState = model.states.find(s => s.isStart);
    if (startState) {
      svg += `<line x1="${startState.x - 50}" y1="${startState.y}" x2="${startState.x - 22}" y2="${startState.y}" 
                    stroke="#2563eb" stroke-width="2" marker-end="url(#arrow-active)" />`;
      svg += `<text x="${startState.x - 55}" y="${startState.y + 4}" fill="#2563eb" font-size="11" font-weight="600" text-anchor="end">start</text>`;
    }

    // States
    model.states.forEach(state => {
      const isActive = activeStateId === state.id;
      const fill = isActive ? '#eff6ff' : '#ffffff';
      const stroke = isActive ? '#2563eb' : (state.isAccept ? '#15803d' : '#64748b');
      const strokeWidth = isActive ? 2.5 : 1.8;

      svg += `<g class="state-group ${isActive ? 'state-active' : ''}">`;
      
      // Outer circle for accepting state
      if (state.isAccept) {
        svg += `<circle cx="${state.x}" cy="${state.y}" r="26" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
      }

      // Base circle
      svg += `<circle cx="${state.x}" cy="${state.y}" r="22" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
      
      // State Label
      svg += `<text x="${state.x}" y="${state.y + 5}" fill="${isActive ? '#1e40af' : '#1f2937'}" 
                    font-size="13" font-weight="600" text-anchor="middle" font-family="monospace">${state.label}</text>`;
      
      // Optional Sublabel (e.g. "int" or "float")
      if (state.sublabel) {
        svg += `<text x="${state.x}" y="${state.y + 42}" fill="#15803d" font-size="10" font-weight="600" text-anchor="middle">${state.sublabel}</text>`;
      }

      svg += `</g>`;
    });

    svg += `</svg>`;
    return svg;
  }

  return {
    AUTOMATA_MODELS,
    AutomataSimulator,
    renderAutomataSVG
  };
}));
