# Data notes (Wajjihni)

**Status: DRAFT.** Verify before publishing to students.

## Files
- `admissions.json`: 525 records (10 public universities), 2026/2027 competitive cutoffs. Each record has `cutoff2026`, `change` (vs 2025/26) and `cutoff2025Derived` (= cutoff2026 - change).
- `universities.json`: university ids, names, cities.
- `stream-rules.json`: which Tawjihi streams may enter which field + chance labels. Heuristic, needs official confirmation.

## Sources and verification
- Main table: tawjihiai.com/admissions/cutoffs (aggregator, not official).
- Cross-check: Mutah University's official PDF (2020-2025). For 8 majors, derived 2025 values matched the official 2025 column exactly (medicine 96.45, pharmacy 94.65, architecture 93.60, computer eng. 92.45, civil eng. 80.80, nursing 87.50, business admin 81.60, accounting 80.25).
- Heads up: when that PDF is converted to text, the year columns come out reversed (2020 appears first). Use the LAST column as 2025.

## Known gaps
1. Track (academic vs vocational) is not specified in the source; from 2026/27 there are separate cutoffs per track and 20% of competitive seats go to the vocational track.
2. Not included: German Jordanian University, Princess Sumaya University for Technology, Al-Balqa branch colleges, and ALL private universities.
3. Parallel-program cutoffs not collected.
4. `field` and `allowedStreams` were assigned by keyword rules; skim them once.
5. Cutoffs are for Jordanian Tawjihi holders and change every year. Official reference: the Unified Admission Coordination Unit (admhec.gov.jo).
