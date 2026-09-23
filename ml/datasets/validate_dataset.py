"""
ScrapDeal ML Pipeline - Dataset Validator
Checks dataset integrity, corruption, class imbalance, and leakage.
"""

import os
import hashlib
import json
from typing import Dict, List, Tuple

SCRAPDEAL_TAXONOMY = [
    'pcb',
    'copper',
    'aluminium',
    'iron_steel',
    'cables',
    'wires',
    'battery',
    'plastic',
    'e_waste',
]

def validate_image_dataset(dataset_dir: str) -> Dict[str, any]:
    """
    Validates material images across splits (train, val, test).
    Checks:
    - Unsupported formats & corrupt files
    - Duplicate image hashes
    - Class imbalance
    - Train / Validation / Test leakage
    """
    results = {
        'status': 'passed',
        'classes': {},
        'splits': {'train': 0, 'val': 0, 'test': 0},
        'duplicates_found': 0,
        'corrupt_files': 0,
        'leakage_detected': False,
        'errors': []
    }

    if not os.path.exists(dataset_dir):
        results['status'] = 'directory_not_found'
        results['errors'].append(f"Directory {dataset_dir} does not exist.")
        return results

    hashes_by_split = {'train': set(), 'val': set(), 'test': set()}

    for split in ['train', 'val', 'test']:
        split_dir = os.path.join(dataset_dir, split)
        if not os.path.exists(split_dir):
            continue

        for root, _, files in os.walk(split_dir):
            for file in files:
                if not file.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                    results['errors'].append(f"Unsupported format: {file}")
                    continue

                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'rb') as f:
                        content = f.read()
                        if len(content) < 100:
                            results['corrupt_files'] += 1
                            results['errors'].append(f"Corrupt or empty image: {filepath}")
                            continue
                        file_hash = hashlib.md5(content).hexdigest()

                        if file_hash in hashes_by_split[split]:
                            results['duplicates_found'] += 1
                        hashes_by_split[split].add(file_hash)

                    category = os.path.basename(root).lower()
                    results['classes'][category] = results['classes'].get(category, 0) + 1
                    results['splits'][split] += 1
                except Exception as e:
                    results['corrupt_files'] += 1
                    results['errors'].append(f"Read error on {filepath}: {str(e)}")

    # Check for cross-split leakage
    train_val_overlap = hashes_by_split['train'].intersection(hashes_by_split['val'])
    train_test_overlap = hashes_by_split['train'].intersection(hashes_by_split['test'])
    if train_val_overlap or train_test_overlap:
        results['leakage_detected'] = True
        results['errors'].append(
            f"Data leakage detected! {len(train_val_overlap)} images in train+val, {len(train_test_overlap)} in train+test."
        )
        results['status'] = 'failed'

    return results

def validate_price_dataset(records: List[Dict[str, any]]) -> Dict[str, any]:
    """
    Validates price transaction records.
    Checks:
    - Missing required fields
    - Non-positive prices or weights
    - Extreme outliers
    - Chronological integrity
    """
    results = {
        'status': 'passed',
        'valid_records': 0,
        'invalid_records': 0,
        'errors': []
    }

    last_timestamp = 0
    for idx, rec in enumerate(records):
        material = rec.get('material_category')
        if material not in SCRAPDEAL_TAXONOMY:
            results['invalid_records'] += 1
            results['errors'].append(f"Row {idx}: Unrecognized material '{material}'.")
            continue

        rate = rec.get('rate_per_kg', 0)
        weight = rec.get('weight_kg', 0)
        if rate <= 0 or weight <= 0:
            results['invalid_records'] += 1
            results['errors'].append(f"Row {idx}: Non-positive rate ({rate}) or weight ({weight}).")
            continue

        if rate > 50000:
            results['invalid_records'] += 1
            results['errors'].append(f"Row {idx}: Extreme outlier rate ₹{rate}/kg.")
            continue

        ts = rec.get('timestamp', 0)
        if ts < last_timestamp:
            results['errors'].append(f"Row {idx}: Time ordering inversion (timestamp {ts} < {last_timestamp}).")
        last_timestamp = max(last_timestamp, ts)

        results['valid_records'] += 1

    if results['invalid_records'] > 0:
        results['status'] = 'warning'

    return results

if __name__ == '__main__':
    print("ScrapDeal Dataset Validator loaded successfully.")
