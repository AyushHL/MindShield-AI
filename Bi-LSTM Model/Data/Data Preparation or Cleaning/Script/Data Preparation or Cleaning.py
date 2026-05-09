import pandas as pd
import numpy as np
import os
import re
from pathlib import Path

# Configurations

OUTPUT_DIR = Path("/kaggle/working")
OUTPUT_CSV = OUTPUT_DIR / "Relabelled_Cleaned_Dataset.csv"
RANDOM_SEED = 42
MIN_WORD_COUNT = 5

# Relabeling Keywords

HIGH_RISK_KEYWORDS = [
    r"\bkill myself\b", r"\bend my life\b", r"\bwant to die\b",
    r"\bsuicid\w*\b", r"\bself.?harm\b", r"\bslit my\b",
    r"\bhang myself\b", r"\boverdos\w*\b", r"\bjump off\b",
    r"\bend it all\b", r"\bnot worth living\b", r"\bno reason to live\b",
    r"\bi.?m going to die\b", r"\bi want to kill\b",
    r"\bmethod\b.*\bsuicid\w*\b", r"\bsuicid\w*\b.*\bmethod\b",
    r"\bi don.?t want to be alive\b", r"\bi.?d rather be dead\b",
    r"\bplanning to\b.*\bdie\b", r"\bgoodbye\b.*\beveryone\b",
]

LOW_RISK_KEYWORDS = [
    r"\bdepressed\b", r"\bdepression\b", r"\banxiety\b", r"\banxious\b",
    r"\bhopeless\b", r"\bworthless\b", r"\bempty inside\b",
    r"\bcan.?t cope\b", r"\bmental health\b", r"\btherapist\b",
    r"\bmedication\b", r"\bantidepressant\b", r"\bpanic attack\b",
    r"\bself.?esteem\b", r"\blonely\b", r"\bisolat\w+\b",
    r"\bcrying\b", r"\bbreakdown\b", r"\bfeeling down\b",
]

NO_RISK_KEYWORDS = [
    r"\blol\b", r"\blmao\b", r"\bhaha\b", r"\bfunny\b",
    r"\bschool\b", r"\bhomework\b", r"\bexam\b", r"\bgame\w*\b",
    r"\bmovie\b", r"\bmusic\b", r"\bfriend\w*\b", r"\bparty\b",
    r"\bweekend\b", r"\bbirthday\b", r"\bholiday\b",
]

# Compile Patterns

HIGH_RISK_PATTERNS = [re.compile(p, re.IGNORECASE) for p in HIGH_RISK_KEYWORDS]
LOW_RISK_PATTERNS  = [re.compile(p, re.IGNORECASE) for p in LOW_RISK_KEYWORDS]
NO_RISK_PATTERNS   = [re.compile(p, re.IGNORECASE) for p in NO_RISK_KEYWORDS]

def count_hits(text, patterns):
    return sum(1 for p in patterns if p.search(text))

def smart_relabel(text, original_label, original_class_count):
    if original_class_count == 3:
        return original_label

    text_lower = str(text).lower()
    high_hits = count_hits(text_lower, HIGH_RISK_PATTERNS)
    low_hits  = count_hits(text_lower, LOW_RISK_PATTERNS)
    no_hits   = count_hits(text_lower, NO_RISK_PATTERNS)

    if original_label == 0:
        if high_hits >= 1:
            return 2
        elif low_hits >= 1:
            return 1
        else:
            return 0

    elif original_label == 2:
        if high_hits >= 1:
            return 2
        elif low_hits >= 1 and no_hits >= 1:
            return 1
        elif low_hits >= 2:
            return 1
        else:
            return 2

    return original_label

def process_csv(csv_path):
    print(f"\nLoading: {csv_path.name}")
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"  Failed to read: {e}")
        return None

    text_col = next((c for c in df.columns if c.lower() in ["text", "clean_text", "post", "selftext", "tweet"]), None)
    label_col = next((c for c in df.columns if c.lower() in ["class", "label", "is_depression", "target"]), None)

    if not text_col or not label_col:
        print(f"  Skipped: Missing columns.")
        return None

    df = df.dropna(subset=[text_col, label_col])

    def initial_map(val):
        val_str = str(val).lower().strip()
        if label_col.lower() == 'is_depression': return 1 if val_str in ['1', '1.0', 'true'] else 0
        if val_str in ['0', '0.0']: return 0
        if val_str in ['1', '1.0']: return 1
        if val_str in ['2', '2.0']: return 2
        if val_str in ["suicide", "suicidal"]: return 2
        if val_str in ["depression", "depressed", "anxiety"]: return 1
        if val_str in ["non-suicide", "normal", "teenagers"]: return 0
        return None

    df["temp_label"] = df[label_col].apply(initial_map)
    df = df.dropna(subset=["temp_label"])
    unique_classes = df["temp_label"].nunique()

    print("  Applying smart NLP relabeling and word-count filter...")
    df["final_label"] = df.apply(lambda row: smart_relabel(row[text_col], row["temp_label"], unique_classes), axis=1)

    result = pd.DataFrame({"text": df[text_col].astype(str), "label": df["final_label"].astype(int)})

    result = result[result["text"].apply(lambda x: len(str(x).split()) >= MIN_WORD_COUNT)]

    print(f"  Resulting Classes: {result['label'].value_counts().to_dict()}")
    return result

def build_dataset(all_dfs):
    combined = pd.concat(all_dfs, ignore_index=True)
    combined = combined.drop_duplicates(subset=["text"])
    counts = combined["label"].value_counts()

    min_class_size = counts.min()
    max_allowed = int(min_class_size * 1.5)

    balanced_dfs = []
    for label in [0, 1, 2]:
        class_df = combined[combined["label"] == label]
        sampled = class_df.sample(n=min(len(class_df), max_allowed), random_state=RANDOM_SEED)
        balanced_dfs.append(sampled)

    final_df = pd.concat(balanced_dfs, ignore_index=True)
    return final_df.sample(frac=1, random_state=RANDOM_SEED).reset_index(drop=True)

def main():
    print("=" * 60 + "\nMindShield AI — UPDATED RELABELING SCRIPT\n" + "=" * 60)
    input_dir = Path("/kaggle/input")
    csv_files = list(input_dir.rglob("*.csv"))
    all_dfs = [process_csv(f) for f in csv_files if process_csv(f) is not None]

    if not all_dfs:
        print("\nNo Valid Datasets Found.")
        return

    final_df = build_dataset(all_dfs)
    total = len(final_df)
    for lbl, name in [(0, 'No Risk   '), (1, 'Low Risk  '), (2, 'High Risk ')]:
        c = len(final_df[final_df['label'] == lbl])
        print(f"{name} (Class {lbl}): {c} rows ({c/total*100:.1f}%)")

    final_df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8")
    print(f"\nSaved to: {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
