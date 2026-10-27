import sys
from collections import defaultdict

def analyze(name, prods, start='S'):
    non_terminals = []
    for p in prods:
        if p[0] not in non_terminals:
            non_terminals.append(p[0])
    terminals = []
    for lhs, rhs in prods:
        for s in rhs:
            if s not in non_terminals and s != '' and s not in terminals:
                terminals.append(s)
    terminals.sort()

    first = {nt: set() for nt in non_terminals}
    for t in terminals:
        first[t] = {t}
    first[''] = {''}
    changed = True
    while changed:
        changed = False
        for lhs, rhs in prods:
            before = len(first[lhs])
            if len(rhs) == 0 or rhs == ('',):
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

    follow = {nt: set() for nt in non_terminals}
    follow[start].add('$')
    changed = True
    while changed:
        changed = False
        for lhs, rhs in prods:
            for i, B in enumerate(rhs):
                if B in non_terminals:
                    before = len(follow[B])
                    beta = rhs[i+1:]
                    if len(beta) == 0:
                        follow[B].update(follow[lhs])
                    else:
                        all_eps = True
                        for s in beta:
                            sf = first.get(s, {s})
                            follow[B].update(sf - {''})
                            if '' not in sf:
                                all_eps = False
                                break
                        if all_eps:
                            follow[B].update(follow[lhs])
                    if len(follow[B]) > before:
                        changed = True

    print(f'=== {name} ===')
    print('FIRST sets:')
    for nt in non_terminals:
        print('  FIRST(' + nt + ') = { ' + ', '.join(sorted(list(first[nt]))) + ' }')
    print('FOLLOW sets:')
    for nt in non_terminals:
        print('  FOLLOW(' + nt + ') = { ' + ', '.join(sorted(list(follow[nt]))) + ' }')
        
    table = {}
    for lhs, rhs in prods:
        rhs_first = set()
        if len(rhs) == 0 or rhs == ('',):
            rhs_first.add('')
        else:
            all_eps = True
            for s in rhs:
                sf = first.get(s, {s})
                rhs_first.update(sf - {''})
                if '' not in sf:
                    all_eps = False
                    break
            if all_eps:
                rhs_first.add('')
        for t in rhs_first - {''}:
            table.setdefault((lhs, t), []).append(rhs)
        if '' in rhs_first:
            for t in follow[lhs]:
                table.setdefault((lhs, t), []).append(rhs)

    cols = terminals + ['$']
    print('\nLL(1) Parse Table:')
    header = 'NT   | ' + ' | '.join(f'{c:7}' for c in cols)
    print(header)
    print('-' * len(header))
    for nt in non_terminals:
        row = [f'{nt:4}']
        for c in cols:
            entries = table.get((nt, c), [])
            if not entries:
                row.append('       ')
            else:
                s_entries = [''.join(r) if r != ('',) else 'lambda' for r in entries]
                row.append(f'{",".join(s_entries):7}')
        print(' | '.join(row))

prods_A = [
    ('S', ('D',)),
    ('S', ('A',)),
    ('D', ('T', 'v', 'C')),
    ('C', (';',)),
    ('C', ('=', 'E', ';')),
    ('T', ('i',)),
    ('T', ('f',)),
    ('A', ('v', '=', 'E', ';')),
    ('E', ('B', 'X')),
    ('X', ('+', 'B', 'X')),
    ('X', ('',)),
    ('B', ('F', 'Y')),
    ('Y', ('*', 'F', 'Y')),
    ('Y', ('',)),
    ('F', ('v',)),
    ('F', ('n',)),
    ('F', ('(', 'E', ')')),
]

prods_B = [
    ('S', ('D',)),
    ('S', ('A',)),
    ('D', ('T', 'v', 'C', ';')),
    ('C', ('=', 'E')),
    ('C', ('',)),
    ('T', ('i',)),
    ('T', ('f',)),
    ('A', ('v', '=', 'E', ';')),
    ('E', ('B', 'X')),
    ('X', ('+', 'B', 'X')),
    ('X', ('',)),
    ('B', ('F', 'Y')),
    ('Y', ('*', 'F', 'Y')),
    ('Y', ('',)),
    ('F', ('v',)),
    ('F', ('n',)),
    ('F', ('(', 'E', ')')),
]

if __name__ == '__main__':
    analyze('Option A (C -> ; | = E ;)', prods_A)
    print('\n' + '='*60 + '\n')
    analyze('Option B (D -> T v C ; with C -> = E | lambda)', prods_B)
