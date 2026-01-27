"""
Generate Expert Rating Requests for Questions

REQUIREMENTS:
- 10 questions per discipline
- Random categories (topics) from each discipline
- 5 English locales + 5 Portuguese (pt_BR) locales per discipline
- Random grades between 6th-12th grade (60-120 numeric format)
- Mix of multiple choice (MCQ) and discursive questions
"""

import random
import csv

# -------------------------------------------------------------------------
# CONFIGURATION
# -------------------------------------------------------------------------

# Locales - 5 en_US and 5 pt_BR per discipline
ENGLISH_LOCALE = "en_US"
PORTUGUESE_LOCALE = "pt_BR"

# Grade range: 60 (6th grade) to 120 (12th grade), increments of 10
AVAILABLE_GRADES = [60, 70, 80, 90, 100, 110, 120]

# Difficulty levels
DIFFICULTY_LEVELS = [300, 500, 700]

# Discipline name translations (English -> Portuguese)
DISCIPLINE_TRANSLATIONS = {
    "Mathematics": "Matemática",
    "Science": "Ciências",
    "Physics": "Física",
    "History": "História",
    "Geography": "Geografia",
    "Biology": "Biologia",
    "English Language Arts": "Inglês",
    "Philosophy": "Filosofia",
    "Physical Education": "Educação Física",
    "Arts": "Artes",
    "Portuguese": "Português",  # New discipline
}

# Reverse mapping for lookups
DISCIPLINE_TRANSLATIONS_REVERSE = {v: k for k, v in DISCIPLINE_TRANSLATIONS.items()}

# Load categories from CSV
def load_categories_from_csv(csv_path):
    """Load available categories for each discipline from the CSV."""
    disciplines_categories = {}

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            disc = row.get('discipline', '').strip()
            topic = row.get('topic', '').strip()

            if disc and topic:
                if disc not in disciplines_categories:
                    disciplines_categories[disc] = set()
                disciplines_categories[disc].add(topic)

    # Convert sets to lists for easier random selection
    return {k: list(v) for k, v in disciplines_categories.items()}


# -------------------------------------------------------------------------
# REQUEST GENERATOR
# -------------------------------------------------------------------------

def generate_question_distribution():
    """
    Generate distribution of MCQ vs Discursive questions.
    Returns 1 MCQ and 1 discursive for even distribution.

    Returns: (num_mcq, num_discursive)
    """
    num_mcq = 1
    num_discursive = 1
    return num_mcq, num_discursive


def generate_requests_for_discipline(discipline, categories, target_questions=10):
    """
    Generate requests for a single discipline to reach target number of questions.

    Parameters:
    - discipline: Name of the discipline
    - categories: List of available categories for this discipline
    - target_questions: Target number of questions (default 10)

    Each request yields 2 questions (1 MCQ + 1 discursive).
    For 10 questions: we need 5 requests (5 × 2 = 10 questions)
    """

    # Calculate number of requests needed (2 questions per request)
    num_requests = target_questions // 2

    # Determine locale pool based on discipline
    # Biology, Mathematics, Physics, and Science: English only
    # Other disciplines: 5 en_US + 5 pt_BR
    english_only_subjects = ["Biology", "Mathematics", "Physics", "Science"]

    if discipline in english_only_subjects:
        locale_pool = [ENGLISH_LOCALE] * num_requests
    else:
        locale_pool = [ENGLISH_LOCALE] * 5 + [PORTUGUESE_LOCALE] * 5

    requests = []

    # Track used categories to ensure variety
    used_categories = []
    available_categories = categories.copy()

    for i in range(num_requests):
        # Select random category, preferring unused ones
        if available_categories:
            category = random.choice(available_categories)
            available_categories.remove(category)
        else:
            # If all categories used, reset the pool but avoid immediate repetition
            available_categories = [c for c in categories if c not in used_categories[-2:]]
            if not available_categories:
                available_categories = categories.copy()
            category = random.choice(available_categories)
            available_categories.remove(category)

        used_categories.append(category)

        # Random locale from pool
        locale = random.choice(locale_pool)

        # Random grade between 60-120
        grade = random.choice(AVAILABLE_GRADES)

        # Random difficulty
        difficulty = random.choice(DIFFICULTY_LEVELS)

        # Fixed distribution: 1 MCQ + 1 discursive = 2 questions
        num_mcq, num_discursive = generate_question_distribution()

        request = {
            "grade": grade,
            "locale": locale,
            "difficulty": difficulty,
            "category": category,
            "discipline": discipline,
            "num_mcq": num_mcq,
            "num_discursive": num_discursive,
        }

        requests.append(request)

    return requests


def generate_all_requests(csv_path, selected_disciplines=None, questions_per_discipline=10):
    """
    Generate requests for multiple disciplines.

    Parameters:
    - csv_path: Path to the CSV file with discipline/category data
    - selected_disciplines: List of disciplines to include (None = all)
    - questions_per_discipline: Target questions per discipline (default 10)
    """

    # Load categories from CSV
    all_categories = load_categories_from_csv(csv_path)

    # Use selected disciplines or all available
    if selected_disciplines:
        disciplines = [d for d in selected_disciplines if d in all_categories]
    else:
        disciplines = list(all_categories.keys())

    all_requests = []

    for discipline in disciplines:
        categories = all_categories[discipline]

        if not categories:
            print(f"Warning: No categories found for {discipline}, skipping...")
            continue

        discipline_requests = generate_requests_for_discipline(
            discipline,
            categories,
            target_questions=questions_per_discipline
        )

        all_requests.extend(discipline_requests)

    return all_requests


def print_requests(requests):
    """Print requests in Python list format."""
    print("REQUESTS = [")

    for i, req in enumerate(requests):
        # Add discipline header comments
        if i == 0 or req["discipline"] != requests[i-1]["discipline"]:
            print(f"    # -------------------------------------------------------------------------")
            print(f"    # {req['discipline']}")
            print(f"    # -------------------------------------------------------------------------")

        print("    {")
        for key in ["grade", "locale", "difficulty", "category", "discipline", "num_mcq", "num_discursive"]:
            value = req[key]
            if isinstance(value, str):
                print(f'        "{key}": "{value}",')
            else:
                print(f'        "{key}": {value},')
        print("    },")

    print("]")


# -------------------------------------------------------------------------
# MAIN EXECUTION
# -------------------------------------------------------------------------

if __name__ == "__main__":
    # Configuration
    CSV_PATH = "/Users/camila/Turbo_SAFE/teachy/teachy-test/Biblioteca de Alexandria - en.csv"

    # Disciplines you're interested in based on your message
    # Note: "Matemática" and "Português" appear in Portuguese but the CSV uses English names
    # Mapping: Matemática -> Mathematics, Português -> ??? (not clear in CSV)
    # I'll use the disciplines from your original request.md

    SELECTED_DISCIPLINES = [
        "Mathematics",
        "Science",
        "Physics",
        "History",
        "Geography",
        "Arts",
        "Biology",
        "English Language Arts",  # This might be your "English" or could map to Portuguese language
        "Philosophy"
    ]

    QUESTIONS_PER_DISCIPLINE = 10

    # Set random seed for reproducibility (remove or change for different results)
    random.seed(42)

    print(f"# Generating requests for {len(SELECTED_DISCIPLINES)} disciplines")
    print(f"# Target: {QUESTIONS_PER_DISCIPLINE} questions per discipline")
    print(f"# Each request generates 2 questions (1 MCQ + 1 discursive)")
    print()

    # Generate requests
    requests = generate_all_requests(
        CSV_PATH,
        selected_disciplines=SELECTED_DISCIPLINES,
        questions_per_discipline=QUESTIONS_PER_DISCIPLINE
    )

    # Print in formatted style
    print_requests(requests)

    # Print summary
    print(f"\n# =========================================================================")
    print(f"# SUMMARY")
    print(f"# =========================================================================")
    print(f"# Total requests: {len(requests)}")
    print(f"# Total questions: {len(requests) * 2}")

    # Count by discipline
    from collections import Counter
    disc_counts = Counter(req["discipline"] for req in requests)
    locale_counts = Counter(req["locale"] for req in requests)

    print(f"\n# Requests per discipline:")
    for disc, count in sorted(disc_counts.items()):
        print(f"#   {disc}: {count} requests ({count * 2} questions)")

    print(f"\n# Locale distribution:")
    for locale, count in sorted(locale_counts.items()):
        print(f"#   {locale}: {count} requests")
