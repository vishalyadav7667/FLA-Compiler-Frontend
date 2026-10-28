"""
FLA-Lang Machine Learning Model Trainer
Trains a character n-gram Multinomial Naive Bayes classifier to predict FLA-Lang code validity.
Pure Python standard library implementation matching scikit-learn CountVectorizer + MultinomialNB.
"""

import json
import math
import random
from collections import Counter, defaultdict

# 1. Dataset Generation consistent with FLA-Lang Grammar
def generate_dataset():
    valid_samples = [
        # Declarations
        "int x;",
        "float y;",
        "bool flag;",
        "int a;",
        "float rate;",
        "bool active;",
        "int total;",
        "float sum;",
        "int count = 0;",
        "int x = 10;",
        "float rate = 12.75;",
        "float temp = 98.6;",
        "bool flag = 1;",
        "bool isReady = 0;",
        "int num = 42;",
        "float pi = 3.14;",
        "float weight = 70.5;",
        "int step = 1;",
        "int maxLimit = 100;",
        "float score = 0.0;",
        
        # Assignments & Expressions
        "x = a + 5;",
        "y = y * 2.0 + 1.5;",
        "result = (a + 5) * b - c / 2;",
        "count = count + 1;",
        "total = total + item;",
        "diff = a - b;",
        "prod = x * y;",
        "ratio = total / count;",
        "x = (a + b) * (c - d);",
        "y = -x + 10;",
        "ans = -a * -b;",
        "x = ((a + 1) * 2);",
        "val = (x / y) + (a * b);",
        "score = score + 10.5;",
        "balance = balance - fee * 1.2;",
        "x = a + b + c + d;",
        "res = a * b * c;",
        "p = (x + y + z) / 3;",
        "w = (a * 2) - (b / 4);",
        "ans = -Factor;",

        # Multi-statement programs
        "int x = 10;\nx = a + 5;",
        "float rate = 12.5;\nresult = (a + 5) * b - c / 2;",
        "int a = 1;\nint b = 2;\nint c = a + b;",
        "int x = 0;\nx = x + 1;\nx = x * 2;",
        "float x = 1.5;\nfloat y = 2.5;\nfloat z = (x + y) * 2.0;",
        "int count = 0;\nbool done = 0;\ncount = count + 1;",
        "int sum = 0;\nint i = 1;\nsum = sum + i;",
        "float avg = 0.0;\nint n = 5;\navg = total / n;",
        "int a = 10;\nint b = 20;\na = b;\nb = a;",
        "int base = 2;\nint exp = 3;\nint res = base * exp;",

        # Conditionals
        "if (x > 10) {\n  y = 1;\n}",
        "if (x > 10) {\n  y = 1;\n} else {\n  y = 0;\n}",
        "if (flag == 1) {\n  count = count + 1;\n}",
        "if (a < b) {\n  min = a;\n} else {\n  min = b;\n}",
        "if (score > 50) {\n  pass = 1;\n} else {\n  pass = 0;\n}",
        "if (x == 0) {\n  y = 10;\n}",
        "if (val > max) {\n  max = val;\n}",
        "if (temp < 32.0) {\n  freezing = 1;\n} else {\n  freezing = 0;\n}",
        "if (count == limit) {\n  done = 1;\n}",
        "if (x > 0) {\n  sign = 1;\n} else {\n  sign = -1;\n}",

        # While Loops
        "while (count < 5) {\n  count = count + 1;\n}",
        "while (x > 0) {\n  x = x - 1;\n}",
        "while (i < 10) {\n  sum = sum + i;\n  i = i + 1;\n}",
        "while (total < 100) {\n  total = total + step;\n}",
        "while (running == 1) {\n  count = count + 1;\n}",
        "while (n > 1) {\n  fact = fact * n;\n  n = n - 1;\n}",
        "while (balance > 0.0) {\n  balance = balance - spend;\n}",
        "while (x == 0) {\n  x = read;\n}",
        "while (low < high) {\n  low = low + 1;\n}",
        "while (step < max) {\n  pos = pos + speed;\n}",

        # Complex & Nested Blocks
        "int x = 0;\nwhile (x < 10) {\n  if (x > 5) {\n    y = 1;\n  } else {\n    y = 0;\n  }\n  x = x + 1;\n}",
        "int a = 5;\nif (a > 0) {\n  int b = 10;\n  b = b * a;\n}",
        "{ int temp = 0; temp = temp + 1; }",
        "int x = 1;\n{\n  int y = 2;\n  x = x + y;\n}",
        "float r = 2.5;\nfloat area = 3.14 * r * r;",
        "int i = 0;\nwhile (i < 5) {\n  val = val * 2;\n  i = i + 1;\n}",
        "if (ready == 1) {\n  start = 1;\n  while (start < 10) {\n    start = start + 1;\n  }\n}"
    ]

    invalid_samples = [
        # Missing Semicolons
        "int x = 10",
        "x = a + 5",
        "float rate = 12.5",
        "int x = 10\nx = 20;",
        "int a = 1\nint b = 2;",
        "count = count + 1",
        "bool flag = 1",
        "y = x * 2.0",
        "x = (a + 5) * b",
        "int x = 10;\ny = 20",

        # Mismatched Parentheses
        "x = (a + 5;",
        "x = a + 5);",
        "x = ((a + 5);",
        "x = (a + (b * c);",
        "if (x > 10 {\n  y = 1;\n}",
        "if x > 10) {\n  y = 1;\n}",
        "while (count < 5 {\n  count = count + 1;\n}",
        "while count < 5) {\n  count = count + 1;\n}",
        "res = (a + 5 * (b - 2);",
        "val = ((x + y);",

        # Mismatched Braces
        "if (x > 0) {\n  y = 1;\n",
        "if (x > 0) \n  y = 1;\n}",
        "while (x < 5) {\n  x = x + 1;\n",
        "{ int x = 1; x = x + 2;",
        "int x = 1;\n  y = 2;\n}",
        "if (x > 0) {\n  y = 1;\n} else {\n  y = 2;",
        "while (i < 5) {\n  i = i + 1;",
        "if (flag == 1) {\n  count = 1;\n}}",
        "int a = 5;\n{ a = 10;\n",
        "{\n  x = 1;\n",

        # Illegal Characters outside FLA alphabet
        "int x = 10 @ 5;",
        "float $money = 100.0;",
        "int x = 10 # comment;",
        "x = a & b;",
        "val = ~x;",
        "x = a ^ b;",
        "int x = 10 % 3;",
        "float price = 19.99$;",
        "x = a | b;",
        "int _count = 0;",
        "int x = `test`;",
        "int x = 'hello';",
        "int x = \"hello\";",
        "total = total @ rate;",
        "if (x != 10) { y = 1; }",

        # Consecutive / Malformed Operators
        "x = a + * 5;",
        "y = 10 / / 2;",
        "x = = 10;",
        "x = a ++ 1;",
        "x = a - - 5;",
        "x = a * * b;",
        "x = + + a;",
        "x = a + / 2;",
        "if (x === 10) { y = 1; }",
        "if (x => 10) { y = 1; }",
        "if (x =< 10) { y = 1; }",
        "y = x * + 2;",
        "x = a / * b;",
        "z = a - * c;",
        "ans = * a + b;",

        # Identifiers Starting with Digits
        "int 1x = 10;",
        "float 9total = 0.0;",
        "2a = 5;",
        "int 3count = 1;",
        "float 0val = 2.5;",
        "int 4num = 12;",
        "x = 5y + 10;",
        "int 8var = 100;",
        "bool 1flag = 0;",
        "float 5rate = 1.2;",

        # Malformed Numbers
        "float v = 3.14.15;",
        "int x = 10.;",
        "float y = .5;",
        "x = 12.34.56;",
        "float z = 1..2;",
        "val = 99..;",
        "rate = 0..5;",
        "num = 10.20.30;",
        "x = 1.2.3.4;",
        "float f = 5.;",

        # Missing Expressions / Malformed Statements
        "x = ;",
        "int x = ;",
        "float y = ;",
        "if () {\n  y = 1;\n}",
        "while () {\n  x = 1;\n}",
        "if {\n  y = 1;\n}",
        "while {\n  x = 0;\n}",
        "else {\n  y = 2;\n}",
        "int ;",
        "float ;",
        "bool ;",
        "= 10;",
        "+ 5;",
        "x = a + ;",
        "int x = 10 + ;",

        # Unsupported Types or Keywords as Identifiers
        "string s = hello;",
        "char c = a;",
        "double d = 1.0;",
        "int if = 5;",
        "while = 10;",
        "int int = 1;",
        "float while = 2.0;",
        "bool bool = 1;",
        "int float = 3;",
        "if = 10;"
    ]

    # Synthesize systematic variations to expand dataset robustly
    vars_list = ['x', 'y', 'z', 'a', 'b', 'c', 'sum', 'total', 'count', 'rate', 'item', 'score', 'num', 'step', 'limit', 'ans', 'val', 'diff', 'prod', 'temp']
    types_list = ['int', 'float', 'bool']
    nums_list = ['0', '1', '2', '5', '10', '25', '100', '3.14', '0.5', '12.5', '99.9']
    ops_list = ['+', '-', '*', '/']
    comp_list = ['>', '<', '==']

    rng = random.Random(42)

    # Systematic valid additions
    for _ in range(120):
        v = rng.choice(vars_list)
        t = rng.choice(types_list)
        n = rng.choice(nums_list) if t != 'bool' else rng.choice(['0', '1'])
        # Simple declaration
        valid_samples.append(f"{t} {v};")
        # Initialized declaration
        valid_samples.append(f"{t} {v} = {n};")
        
        v1, v2 = rng.choice(vars_list), rng.choice(vars_list)
        op = rng.choice(ops_list)
        valid_samples.append(f"{v1} = {v2} {op} {n};")
        valid_samples.append(f"{v1} = ({v2} {op} {n}) * {rng.choice(nums_list)};")

        v3 = rng.choice(vars_list)
        cmp_op = rng.choice(comp_list)
        valid_samples.append(f"if ({v1} {cmp_op} {n}) {{\n  {v2} = {v3} + 1;\n}}")
        valid_samples.append(f"if ({v1} {cmp_op} {n}) {{\n  {v2} = {v3} + 1;\n}} else {{\n  {v2} = 0;\n}}")
        valid_samples.append(f"while ({v1} {cmp_op} {n}) {{\n  {v1} = {v1} + 1;\n}}")

        # Multi-statement combinations
        valid_samples.append(f"{t} {v} = {n};\n{v1} = {v2} {op} {n};")
        valid_samples.append(f"{t} {v} = {n}; {v1} = {v2} {op} {n};")

    # Systematic invalid additions
    for _ in range(120):
        v = rng.choice(vars_list)
        t = rng.choice(types_list)
        n = rng.choice(nums_list)
        v1, v2 = rng.choice(vars_list), rng.choice(vars_list)
        op = rng.choice(ops_list)

        # Missing semicolon
        invalid_samples.append(f"{t} {v} = {n}")
        invalid_samples.append(f"{v1} = {v2} {op} {n}")
        invalid_samples.append(f"{t} {v} = {n}\n{v1} = {v2} {op} {n};")
        invalid_samples.append(f"{t} {v} = {n}; {v1} = {v2} {op} {n}")

        # Illegal symbols
        bad_char = rng.choice(['@', '$', '#', '&', '~', '^', '%', '!', '?'])
        invalid_samples.append(f"{t} {v} = {n} {bad_char} 5;")
        invalid_samples.append(f"{bad_char} {v} = {n};")
        invalid_samples.append(f"{t} {bad_char}{v} = {n};")

        # Bad operator sequences
        op1, op2 = rng.choice(ops_list), rng.choice(ops_list)
        invalid_samples.append(f"{v} = a {op1} {op2} {n};")
        invalid_samples.append(f"{v} = = {n};")

        # Identifier starting with digit
        invalid_samples.append(f"{t} {rng.randint(1, 9)}{v} = {n};")

        # Mismatched parens
        invalid_samples.append(f"{v1} = ({v2} {op} {n};")
        invalid_samples.append(f"{v1} = {v2} {op} {n});")
        invalid_samples.append(f"if ({v1} > {n} {{\n  {v2} = 1;\n}}")
        invalid_samples.append(f"while ({v1} < {n} {{\n  {v1} = {v1} + 1;\n}}")

        # Malformed decimals
        invalid_samples.append(f"float {v} = {n}.{rng.randint(1, 9)}.{rng.randint(1, 9)};")
        invalid_samples.append(f"int {v} = {n}.;")

    # Balance dataset to exactly 1:1 ratio
    rng.shuffle(valid_samples)
    rng.shuffle(invalid_samples)
    min_count = min(len(valid_samples), len(invalid_samples))
    valid_samples = valid_samples[:min_count]
    invalid_samples = invalid_samples[:min_count]

    data = []
    for s in valid_samples:
        data.append((s, 1)) # 1 = valid
    for s in invalid_samples:
        data.append((s, 0)) # 0 = invalid

    # Shuffle with fixed seed for reproducibility
    rng.shuffle(data)
    return data

# 2. Extract Character N-grams
def extract_char_ngrams(text, min_n=1, max_n=4):
    ngrams = []
    length = len(text)
    for n in range(min_n, max_n + 1):
        for i in range(length - n + 1):
            ngrams.append(text[i:i + n])
    return ngrams

# 3. Model Training & Parameter Export
def train_and_export():
    print("Generating dataset...")
    data = generate_dataset()
    texts = [d[0] for d in data]
    labels = [d[1] for d in data]

    total_samples = len(data)
    valid_count = sum(labels)
    invalid_count = total_samples - valid_count
    print(f"Total samples: {total_samples} (Valid: {valid_count}, Invalid: {invalid_count})")

    # Train / Test split (80% train, 20% test)
    split_idx = int(0.8 * total_samples)
    train_texts, test_texts = texts[:split_idx], texts[split_idx:]
    train_labels, test_labels = labels[:split_idx], labels[split_idx:]

    print(f"Train samples: {len(train_texts)}, Test samples: {len(test_texts)}")

    # Build vocabulary from training set (min_df = 2, character n-grams 1..4)
    ngram_doc_counts = Counter()
    for t in train_texts:
        unique_ngrams = set(extract_char_ngrams(t, 1, 4))
        for ng in unique_ngrams:
            ngram_doc_counts[ng] += 1

    # Keep n-grams appearing in at least 2 training documents, limit top 2000
    sorted_vocab = sorted([ng for ng, count in ngram_doc_counts.items() if count >= 2])
    if len(sorted_vocab) > 2000:
        sorted_vocab = sorted(sorted_vocab, key=lambda ng: (-ngram_doc_counts[ng], ng))[:2000]
        sorted_vocab = sorted(sorted_vocab)

    vocab = {ng: i for i, ng in enumerate(sorted_vocab)}
    vocab_size = len(vocab)
    print(f"Vocabulary size: {vocab_size} character n-grams")

    # Compute Feature Counts per class
    # Class 0: invalid, Class 1: valid
    class_sample_counts = [train_labels.count(0), train_labels.count(1)]
    class_feature_counts = [defaultdict(int), defaultdict(int)]
    class_total_tokens = [0, 0]

    for text, label in zip(train_texts, train_labels):
        ngrams = extract_char_ngrams(text, 1, 4)
        for ng in ngrams:
            if ng in vocab:
                idx = vocab[ng]
                class_feature_counts[label][idx] += 1
                class_total_tokens[label] += 1

    # Multinomial Naive Bayes with Laplace smoothing (alpha = 1.0)
    alpha = 1.0
    class_log_priors = [
        math.log(class_sample_counts[0] / len(train_labels)),
        math.log(class_sample_counts[1] / len(train_labels))
    ]

    feature_log_prob = [[0.0] * vocab_size, [0.0] * vocab_size]
    for c in (0, 1):
        denom = class_total_tokens[c] + alpha * vocab_size
        log_denom = math.log(denom)
        for j in range(vocab_size):
            count = class_feature_counts[c][j]
            feature_log_prob[c][j] = math.log(count + alpha) - log_denom

    # Predict function
    def predict_one(text):
        ngrams = extract_char_ngrams(text, 1, 4)
        counts = Counter(ngrams)
        log_probs = list(class_log_priors)
        for ng, cnt in counts.items():
            if ng in vocab:
                idx = vocab[ng]
                log_probs[0] += cnt * feature_log_prob[0][idx]
                log_probs[1] += cnt * feature_log_prob[1][idx]

        # Softmax for normalized probabilities
        m = max(log_probs)
        exp0 = math.exp(log_probs[0] - m)
        exp1 = math.exp(log_probs[1] - m)
        prob0 = exp0 / (exp0 + exp1)
        prob1 = exp1 / (exp0 + exp1)

        pred_class = 1 if log_probs[1] > log_probs[0] else 0
        confidence = prob1 if pred_class == 1 else prob0
        return pred_class, confidence, prob0, prob1

    # Evaluate on Test Set
    y_pred = []
    for text in test_texts:
        pred, _, _, _ = predict_one(text)
        y_pred.append(pred)

    tp = sum(1 for yt, yp in zip(test_labels, y_pred) if yt == 1 and yp == 1)
    tn = sum(1 for yt, yp in zip(test_labels, y_pred) if yt == 0 and yp == 0)
    fp = sum(1 for yt, yp in zip(test_labels, y_pred) if yt == 0 and yp == 1)
    fn = sum(1 for yt, yp in zip(test_labels, y_pred) if yt == 1 and yp == 0)

    accuracy = (tp + tn) / len(test_labels) if test_labels else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

    print("\n" + "=" * 50)
    print("  MODEL EVALUATION METRICS (TEST SET)")
    print("=" * 50)
    print(f"Accuracy:  {accuracy * 100:.2f}%")
    print(f"Precision: {precision * 100:.2f}%")
    print(f"Recall:    {recall * 100:.2f}%")
    print(f"F1-Score:  {f1 * 100:.2f}%")
    print(f"\nConfusion Matrix:")
    print(f"  TN: {tn:3d}  |  FP: {fp:3d}")
    print(f"  FN: {fn:3d}  |  TP: {tp:3d}")
    print("=" * 50)

    # Quick spot checks
    spot_checks = [
        ("int x = 10;\nx = a + 5;", 1),
        ("result = (a + 5) * b - c / 2;", 1),
        ("if (x > 10) { y = 1; } else { y = 0; }", 1),
        ("while (count < 5) { count = count + 1; }", 1),
        ("int x = 10", 0),
        ("x = (a + 5;", 0),
        ("int x = 10 @ 5;", 0),
        ("int 1x = 10;", 0)
    ]
    print("\nSpot check predictions:")
    for code, expected in spot_checks:
        p, conf, p0, p1 = predict_one(code)
        label_str = "Valid" if p == 1 else "Invalid"
        ok = "PASS" if p == expected else "FAIL"
        print(f"[{ok:4s}] Expected: {'Valid' if expected == 1 else 'Invalid':7s} | Predicted: {label_str:7s} ({conf*100:5.1f}%) | Code: {code.replace(chr(10), ' ')}")

    # Export to JSON
    export_data = {
        "model_name": "FLA-Lang Code Validity Predictor",
        "algorithm": "Multinomial Naive Bayes",
        "feature_type": "Character N-Grams",
        "ngram_range": [1, 4],
        "classes": ["invalid", "valid"],
        "metrics": {
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "confusion_matrix": {
                "tn": tn, "fp": fp, "fn": fn, "tp": tp
            },
            "train_samples": len(train_texts),
            "test_samples": len(test_texts)
        },
        "class_log_priors": class_log_priors,
        "vocabulary": vocab,
        "feature_log_prob": feature_log_prob
    }

    with open("ml_model.json", "w", encoding="utf-8") as f:
        json.dump(export_data, f, indent=2)

    print("\n[SUCCESS] Model exported successfully to ml_model.json")
    return export_data

if __name__ == "__main__":
    train_and_export()
