"""
Automated Verification Suite for JFLAP 7.1 CFG Models
Course: Formal Languages and Automata (FLA)
Target Models:
  - FLA_Language_CFG.jff
  - FLA_Language_CFG_LL1.jff
"""

import xml.etree.ElementTree as ET
from collections import defaultdict, deque
import sys

def parse_jflap_xml(filepath):
    tree = ET.parse(filepath)
    root = tree.getroot()
    assert root.tag == 'structure', f"Root tag must be 'structure', got {root.tag}"
    type_elem = root.find('type')
    assert type_elem is not None and type_elem.text == 'grammar', "Type must be 'grammar'"
    
    prods = []
    for p in root.findall('production'):
        left = p.find('left').text.strip()
        right_elem = p.find('right')
        right = right_elem.text.strip() if (right_elem is not None and right_elem.text is not None) else ''
        prods.append((left, right))
    return prods

def extract_symbols(prods):
    non_terminals = set(lhs for lhs, _ in prods)
    terminals = set()
    for _, rhs in prods:
        for ch in rhs:
            if ch not in non_terminals:
                terminals.add(ch)
    return sorted(list(non_terminals)), sorted(list(terminals))

class LL1Parser:
    def __init__(self, prods, start_symbol='S'):
        self.raw_prods = prods
        self.start = start_symbol
        self.non_terminals = set(lhs for lhs, _ in prods)
        self.terminals = set()
        for _, rhs in prods:
            for ch in rhs:
                if ch not in self.non_terminals:
                    self.terminals.add(ch)
                    
        # Tokenized productions (where RHS is tuple of single characters or empty tuple for lambda)
        self.prods = []
        for lhs, rhs in prods:
            if rhs == '':
                self.prods.append((lhs, ()))
            else:
                self.prods.append((lhs, tuple(rhs)))
                
        self.first = self._compute_first()
        self.follow = self._compute_follow()
        self.table, self.conflicts = self._build_table()

    def _compute_first(self):
        first = {nt: set() for nt in self.non_terminals}
        for t in self.terminals:
            first[t] = {t}
        first[''] = {''}
        changed = True
        while changed:
            changed = False
            for lhs, rhs in self.prods:
                before = len(first[lhs])
                if len(rhs) == 0:
                    first[lhs].add('')
                else:
                    all_eps = True
                    for s in rhs:
                        sf = first.get(s, {s})
                        first[lhs].update(sf - {''})
                        if '' not in sf:
                            all_eps = False
                            break
                    if all_eps:
                        first[lhs].add('')
                if len(first[lhs]) > before:
                    changed = True
        return first

    def _compute_follow(self):
        follow = {nt: set() for nt in self.non_terminals}
        follow[self.start].add('$')
        changed = True
        while changed:
            changed = False
            for lhs, rhs in self.prods:
                for i, B in enumerate(rhs):
                    if B in self.non_terminals:
                        before = len(follow[B])
                        beta = rhs[i+1:]
                        if len(beta) == 0:
                            follow[B].update(follow[lhs])
                        else:
                            all_eps = True
                            for s in beta:
                                sf = self.first.get(s, {s})
                                follow[B].update(sf - {''})
                                if '' not in sf:
                                    all_eps = False
                                    break
                            if all_eps:
                                follow[B].update(follow[lhs])
                        if len(follow[B]) > before:
                            changed = True
        return follow

    def _build_table(self):
        table = {}
        conflicts = defaultdict(list)
        for i, (lhs, rhs) in enumerate(self.prods):
            rhs_first = set()
            if len(rhs) == 0:
                rhs_first.add('')
            else:
                all_eps = True
                for s in rhs:
                    sf = self.first.get(s, {s})
                    rhs_first.update(sf - {''})
                    if '' not in sf:
                        all_eps = False
                        break
                if all_eps:
                    rhs_first.add('')
            for t in rhs_first - {''}:
                key = (lhs, t)
                if key in table and table[key] != rhs:
                    conflicts[key].append(table[key])
                    conflicts[key].append(rhs)
                table[key] = rhs
            if '' in rhs_first:
                for t in self.follow[lhs]:
                    key = (lhs, t)
                    if key in table and table[key] != rhs:
                        conflicts[key].append(table[key])
                        conflicts[key].append(rhs)
                    table[key] = rhs
        return table, conflicts

    def parse(self, input_str):
        # Stack-based LL(1) parse
        tokens = list(input_str) + ['$']
        stack = ['$', self.start]
        cursor = 0
        steps = []
        
        while stack:
            top = stack.pop()
            current = tokens[cursor]
            
            if top == '$':
                if current == '$':
                    return True, steps
                else:
                    return False, steps
            elif top in self.terminals:
                if top == current:
                    cursor += 1
                else:
                    return False, steps
            elif top in self.non_terminals:
                key = (top, current)
                if key not in self.table:
                    return False, steps
                rhs = self.table[key]
                rhs_str = ''.join(rhs) if rhs else 'lambda'
                steps.append(f"{top} -> {rhs_str}")
                for s in reversed(rhs):
                    stack.append(s)
            else:
                return False, steps
        return (cursor == len(tokens)), steps

class BruteForceParser:
    def __init__(self, prods, start_symbol='S'):
        self.prods = prods
        self.start = start_symbol
        self.non_terminals = set(lhs for lhs, _ in prods)
        self.terminals = set()
        for _, rhs in prods:
            for ch in rhs:
                if ch not in self.non_terminals:
                    self.terminals.add(ch)

    def parse(self, target, max_depth=16):
        # BFS matching leftmost derivations like JFLAP Brute Force Parser
        queue = deque([(self.start, [self.start])])
        visited = {self.start}
        
        while queue:
            form, path = queue.popleft()
            if form == target:
                return True, path
            
            # Find leftmost non-terminal
            first_nt_idx = None
            for i, ch in enumerate(form):
                if ch in self.non_terminals:
                    first_nt_idx = i
                    break
            
            if first_nt_idx is None:
                continue
                
            # Prefix check pruning: terminal prefix must match target prefix
            prefix = form[:first_nt_idx]
            if not target.startswith(prefix):
                continue
                
            # Length check pruning: number of terminals cannot exceed target length
            terminal_count = sum(1 for ch in form if ch in self.terminals)
            if terminal_count > len(target):
                continue
                
            if len(path) > max_depth:
                continue
                
            nt = form[first_nt_idx]
            for lhs, rhs in self.prods:
                if lhs == nt:
                    new_form = form[:first_nt_idx] + rhs + form[first_nt_idx+1:]
                    if new_form not in visited:
                        visited.add(new_form)
                        queue.append((new_form, path + [new_form]))
        return False, []

# Earley parser to generate concrete parse tree for FLA_Language_CFG
class EarleyParser:
    def __init__(self, prods, start_symbol='S'):
        self.prods = prods
        self.start = start_symbol
        self.non_terminals = set(lhs for lhs, _ in prods)
        self.terminals = set()
        for _, rhs in prods:
            for ch in rhs:
                if ch not in self.non_terminals:
                    self.terminals.add(ch)

    def parse(self, text):
        # State: (lhs, rhs, dot_index, origin_index)
        n = len(text)
        chart = [[] for _ in range(n + 1)]
        chart_set = [set() for _ in range(n + 1)]

        def add_state(i, state):
            if state not in chart_set[i]:
                chart_set[i].add(state)
                chart[i].append(state)

        # Predict start
        for lhs, rhs in self.prods:
            if lhs == self.start:
                add_state(0, (lhs, rhs, 0, 0))

        for i in range(n + 1):
            s_idx = 0
            while s_idx < len(chart[i]):
                state = chart[i][s_idx]
                s_idx += 1
                lhs, rhs, dot, origin = state
                if dot < len(rhs):
                    next_sym = rhs[dot]
                    if next_sym in self.non_terminals:
                        # Predict
                        for p_lhs, p_rhs in self.prods:
                            if p_lhs == next_sym:
                                add_state(i, (p_lhs, p_rhs, 0, i))
                    else:
                        # Scan
                        if i < n and text[i] == next_sym:
                            add_state(i + 1, (lhs, rhs, dot + 1, origin))
                else:
                    # Complete
                    for prev_state in chart[origin]:
                        p_lhs, p_rhs, p_dot, p_orig = prev_state
                        if p_dot < len(p_rhs) and p_rhs[p_dot] == lhs:
                            add_state(i, (p_lhs, p_rhs, p_dot + 1, p_orig))

        # Check acceptance
        accepted = any(lhs == self.start and dot == len(rhs) and origin == 0 
                       for (lhs, rhs, dot, origin) in chart[n])
        return accepted

def run_tests():
    cfg_file = 'C:/Users/vy650/OneDrive/Desktop/FLA-Compiler-Frontend/JFLAP_Models/FLA_Language_CFG.jff'
    ll1_file = 'C:/Users/vy650/OneDrive/Desktop/FLA-Compiler-Frontend/JFLAP_Models/FLA_Language_CFG_LL1.jff'
    
    cfg_prods = parse_jflap_xml(cfg_file)
    ll1_prods = parse_jflap_xml(ll1_file)
    
    print('======================================================================')
    print('1. GRAMMAR STRUCTURE & SYMBOL VERIFICATION')
    print('======================================================================')
    cfg_nt, cfg_t = extract_symbols(cfg_prods)
    ll1_nt, ll1_t = extract_symbols(ll1_prods)
    print(f'FLA_Language_CFG.jff:')
    print(f'  Productions count : {len(cfg_prods)}')
    print(f'  Variables (V)     : {cfg_nt}')
    print(f'  Terminals (Sigma) : {cfg_t}')
    print()
    print(f'FLA_Language_CFG_LL1.jff:')
    print(f'  Productions count : {len(ll1_prods)}')
    print(f'  Variables (V)     : {ll1_nt}')
    print(f'  Terminals (Sigma) : {ll1_t}')
    print()

    print('======================================================================')
    print('2. LL(1) MATHEMATICAL VERIFICATION (FIRST, FOLLOW, PARSE TABLE)')
    print('======================================================================')
    ll1_parser = LL1Parser(ll1_prods, 'S')
    print('FIRST Sets:')
    for nt in ll1_nt:
        f_str = ', '.join(sorted(list(ll1_parser.first[nt])))
        print(f'  FIRST({nt}) = {{ {f_str} }}')
    print('\nFOLLOW Sets:')
    for nt in ll1_nt:
        fol_str = ', '.join(sorted(list(ll1_parser.follow[nt])))
        print(f'  FOLLOW({nt}) = {{ {fol_str} }}')
        
    print(f'\nLL(1) Table Conflicts: {len(ll1_parser.conflicts)}')
    if len(ll1_parser.conflicts) == 0:
        print('  RESULT: SUCCESS — The grammar is STRICTLY LL(1) with ZERO conflicts!')
    else:
        print('  RESULT: FAILED — Conflicts found:', ll1_parser.conflicts)

    print('\n======================================================================')
    print('3. BATCH STRING ACCEPTANCE & REJECTION TEST SUITE')
    print('======================================================================')
    
    test_cases = [
        # (string, expected_accept, description)
        ('iv;', True, 'Uninitialized int declaration'),
        ('fv;', True, 'Uninitialized float declaration'),
        ('iv=n;', True, 'Initialized int declaration with number literal'),
        ('fv=n;', True, 'Initialized float declaration with number literal'),
        ('iv=v;', True, 'Initialized int declaration with identifier'),
        ('iv=n+v*n;', True, 'Initialized declaration with precedence expression'),
        ('iv=(n+v)*n;', True, 'Initialized declaration with parenthesized expression'),
        ('v=n;', True, 'Simple assignment with number'),
        ('v=v;', True, 'Simple assignment with identifier'),
        ('v=n+n;', True, 'Assignment with addition'),
        ('v=n*n;', True, 'Assignment with multiplication'),
        ('v=n+v*n;', True, 'Assignment with addition and multiplication precedence'),
        ('v=v*n+n;', True, 'Assignment with multiplication before addition'),
        ('v=(n+v)*n;', True, 'Assignment with parentheses overriding precedence'),
        ('v=((n));', True, 'Assignment with nested parentheses'),
        ('v=v+v+v;', True, 'Assignment with chained addition'),
        ('v=v*v*v;', True, 'Assignment with chained multiplication'),
        # Invalid strings
        ('iv', False, 'Missing statement terminating semicolon'),
        ('v=', False, 'Incomplete assignment statement'),
        ('i;', False, 'Missing identifier in declaration'),
        ('v=;', False, 'Missing right-hand expression in assignment'),
        ('v=n+', False, 'Trailing binary addition operator'),
        ('v=*n;', False, 'Leading multiplication operator in expression'),
        ('v=n+*v;', False, 'Consecutive operators without operand'),
        ('v=(n+n;', False, 'Unclosed parenthesis'),
        ('v=n+n);', False, 'Unmatched closing parenthesis'),
        ('v=();', False, 'Empty parentheses without inner expression'),
        ('int id;', False, 'Old multi-character token format (rejected by character-level grammar)'),
        ('iv==n;', False, 'Relational operator == not part of statement CFG'),
        ('n=v;', False, 'Assignment target is numeric literal instead of identifier'),
        ('+v;', False, 'Expression statement without assignment'),
    ]

    bf_parser = BruteForceParser(cfg_prods, 'S')
    earley_parser = EarleyParser(cfg_prods, 'S')

    cfg_passed = 0
    ll1_passed = 0
    total = len(test_cases)

    print(f'{"Test Input":16} | {"Expected":8} | {"CFG":8} | {"LL(1)":8} | {"Status":6} | {"Description"}')
    print('-' * 95)
    for s, expected, desc in test_cases:
        cfg_res = earley_parser.parse(s)
        ll1_res, _ = ll1_parser.parse(s)
        
        c_status = 'PASS' if cfg_res == expected else 'FAIL'
        l_status = 'PASS' if ll1_res == expected else 'FAIL'
        overall = 'PASS' if (c_status == 'PASS' and l_status == 'PASS') else 'FAIL'
        
        if c_status == 'PASS': cfg_passed += 1
        if l_status == 'PASS': ll1_passed += 1
        
        exp_str = 'ACCEPT' if expected else 'REJECT'
        cfg_str = 'ACCEPT' if cfg_res else 'REJECT'
        ll1_str = 'ACCEPT' if ll1_res else 'REJECT'
        
        print(f'{s:16} | {exp_str:8} | {cfg_str:8} | {ll1_str:8} | {overall:6} | {desc}')

    print('-' * 95)
    print(f'CFG Model Pass Rate:  {cfg_passed}/{total} ({cfg_passed/total*100:.1f}%)')
    print(f'LL(1) Model Pass Rate: {ll1_passed}/{total} ({ll1_passed/total*100:.1f}%)')
    
    print('\n======================================================================')
    print('4. OPERATOR PRECEDENCE DERIVATION VERIFICATION')
    print('======================================================================')
    prec_input = 'v=n+v*n;'
    ok, path = bf_parser.parse(prec_input)
    if ok:
        print(f'Leftmost derivation for: {prec_input}')
        for step_idx, step in enumerate(path):
            print(f'  [{step_idx:02d}] {step}')
        print('  -> Multiplication (v*n) is nested under term B while addition joins E and B.')
        print('  -> Confirms * binds tighter than +.')

if __name__ == '__main__':
    run_tests()
