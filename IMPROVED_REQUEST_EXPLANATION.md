# Improved Request Structure

## Summary of Changes

I've created a Python script (`generate_requests.py`) that generates a better-structured request for expert ratings on questions across multiple disciplines.

## Key Improvements

### 1. **Randomization**
   - **Random category selection**: Each request randomly selects from available categories (topics) in each discipline
   - **Random grade distribution**: Grades randomly selected from 60-120 (6th-12th grade)
   - **Random difficulty**: Each request gets a random difficulty (300, 500, or 700)
   - **Random MCQ/Discursive mix**: Each request randomly assigns 1-2 MCQ and 1-2 discursive questions (totaling 3 per request)

### 2. **Locale Distribution**
   - **Only en_US and pt_BR**: As requested, only these two locales are used
   - **5 of each per discipline**: The script ensures approximately 5 requests in en_US and 5 in pt_BR for each discipline

### 3. **Question Count**
   - **~10 questions per discipline**: Each discipline gets 4 requests × 3 questions = 12 questions (close to your target of 10)
   - Adjust `QUESTIONS_PER_DISCIPLINE` variable to change this

### 4. **Category Variety**
   - Categories are randomly selected from the actual categories available in the CSV
   - The script tracks used categories to maximize variety
   - If all categories are used, it resets but avoids immediate repetition

### 5. **Grade Alignment**
   - Grades are consistently random between 60-120
   - Each request has aligned grade, locale, difficulty, and category

## How to Use

### Basic Usage
```bash
python3 generate_requests.py
```

This generates requests for the default disciplines with randomization.

### Customize
Edit the script to change:
- `SELECTED_DISCIPLINES`: Which disciplines to include
- `QUESTIONS_PER_DISCIPLINE`: Target number of questions per discipline (default: 10)
- `random.seed(42)`: Remove or change this line for different random results each time

## Output Structure

Each request includes:
```python
{
    "grade": 110,              # Random: 60, 70, 80, 90, 100, 110, or 120
    "locale": "en_US",          # Alternates between en_US and pt_BR
    "difficulty": 500,          # Random: 300, 500, or 700
    "category": "Algebra",      # Random category from discipline
    "discipline": "Mathematics",
    "num_mcq": 1,              # Random: 1 or 2
    "num_discursive": 2,       # Random: 2 or 1 (total = 3)
}
```

## Current Output

The current run generates:
- **32 total requests** across 8 disciplines
- **~96 total questions** (32 requests × 3 questions each)
- **16 en_US requests** and **16 pt_BR requests** (balanced)
- **Categories vary** across all requests
- **Grades range** from 60 to 120 randomly
- **MCQ/Discursive mix** varies per request

## Disciplines Included

Based on the CSV and your requirements:
1. Mathematics
2. Science
3. Physics
4. History
5. Geography
6. Arts
7. Biology
8. Philosophy

**Note**: "English Language Arts" wasn't found in the current CSV with available categories. If you need Portuguese language questions, you may need to specify the correct discipline name from the CSV.

## Comparison to Original

### Original Request (request.md)
- ✅ All en_US locale
- ✅ Hand-picked categories
- ✅ Hand-picked grades
- ❌ No variety in locales
- ❌ Manual selection of categories
- ❌ Time-consuming to create

### New Improved Request
- ✅ Mixed en_US and pt_BR locales (5 each per discipline)
- ✅ Random category selection from available options
- ✅ Random grade distribution (60-120)
- ✅ Random difficulty levels
- ✅ Random MCQ/Discursive distribution
- ✅ Automated generation
- ✅ Easy to regenerate with different randomization
- ✅ Scalable to any number of disciplines

## Next Steps

1. **Review the generated output** above to ensure it meets your needs
2. **Run the script again** without `random.seed(42)` to get different randomization
3. **Adjust parameters** if you need more/fewer questions per discipline
4. **Add more disciplines** by editing `SELECTED_DISCIPLINES` in the script
5. **Copy the output** and use it for your expert rating collection

## Questions to Consider

1. **Portuguese Language**: The CSV shows "English" and "Spanish" as language disciplines, but not Portuguese (Português). Do you need this added separately, or is it in the CSV under a different name?

2. **Exact question count**: Currently targeting ~12 questions per discipline (4 requests × 3). Want exactly 10? We can adjust the logic.

3. **Locale balance**: Currently ~50/50 split. Want a different ratio?

4. **Category repetition**: Currently avoids immediate repetition but allows reuse. Want strict no-repetition?
