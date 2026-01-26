"""
Improved Request Structure for Question Ratings

GOAL: Generate expert ratings for questions across multiple disciplines.

REQUIREMENTS:
- 10 questions per discipline (total across all requests for that discipline)
- Random category selection from available topics per discipline
- 5 English locales + 5 Portuguese locales per discipline
- Random grades between 6th-12th grade (60-120 in numeric format)
- Mix of multiple choice (MCQ) and discursive questions
"""

import random

# -------------------------------------------------------------------------
# CONFIGURATION
# -------------------------------------------------------------------------

# Available English locales (customize as needed)
ENGLISH_LOCALES = ["en_US"]

# Available Portuguese locales (customize as needed)
PORTUGUESE_LOCALES = ["pt_BR"]

# Numeric grade mapping (60 = 6th grade, 70 = 7th grade, ..., 120 = 12th grade)
AVAILABLE_GRADES = [60, 70, 80, 90, 100, 110, 120]

# Difficulty levels
DIFFICULTY_LEVELS = [300, 500, 700]

# Discipline categories mapping (from CSV analysis)
DISCIPLINE_CATEGORIES = {
    "Mathematics": [
        "Trigonometry",
        "Magnitudes and Measurements",
        "Arithmetic and Numbers",
        "Geometry",
        "Algebra",
        "Statistics",
        "Combinatorial Analysis and Probability"
    ],
    "Science": [
        "Matter and Energy",
        "Life and Evolution",
        "Earth and Universe"
    ],
    "Physics": [
        "Thermology",
        "Modern Physics and Relativity",
        "Electromagnetism",
        "Waves and Optics",
        "Introduction to Physics",
        "Statics and Dynamics",
        "Kinematics",
        "Astronomy"
    ],
    "Biology": [
        "Human Anatomy and Physiology",
        "Genetics and Heredity",
        "Biochemistry and Metabolism",
        "Introduction to Biology and Evolution",
        "Ecology and Environment",
        "Structure and Function of Organisms"
    ],
    "Chemistry": [
        "Inorganic Compounds and Stoichiometry",
        "Organic Chemistry: Isomerism and Reactions",
        "Atoms and Periodic Table",
        "Chemical Equilibrium and Electrochemistry",
        "Solutions and Colligative Properties",
        "Introduction to Chemistry",
        "Thermochemistry, Kinetics and Nuclear",
        "Organic Chemistry: Organic Compounds"
    ],
    "History": [
        "Ancient History",
        "Modern History",
        "Medieval History",
        "Contemporary History",
        "Theory of History"
    ],
    "Geography": [
        "Territory",
        "Geographic Space",
        "Theory of Geography",
        "Geopolitics",
        "Region",
        "Ecosystem and Biome",
        "Human Development"
    ],
    "English Language Arts": [
        "Verbs",
        "Vocabulary",
        "Reading, Writing, and Comprehension",
        "Grammar"
    ],
    "Philosophy": [
        "Culture",
        "Ethics",
        "Politics",
        "Origin",
        "Concept"
    ],
    "Arts": [
        "Performing Arts",
        "Music",
        "Visual Art",
        "Scenic Art",
        "Art Knowledge",
        "Art and Movement",
        "Artistic Production"
    ],
    "Physical Education": [
        "Dance",
        "Wrestling",
        "Recreation",
        "Research in Sports",
        "Sport",
        "Ethics in Sports",
        "Health"
    ],
    "Sociology": [
        "Individual and Social Class",
        "Sociology Theory",
        "Social Structure"
    ],
    "Economics": [
        "Current Economy",
        "Basic Economic Concepts",
        "Finance and Investment",
        "Economic Indicators and Policies",
        "Market Structures and Competition"
    ],
    "Environmental Sciences": [
        "Human Action",
        "Biomes and Ecosystems",
        "Action of Nature"
    ]
}


# -------------------------------------------------------------------------
# REQUEST GENERATOR
# -------------------------------------------------------------------------

def generate_question_distribution():
    """
    Generate random distribution of MCQ vs Discursive questions.
    Total must equal 3 questions per request.
    """
    num_mcq = random.randint(1, 2)  # 1 or 2 MCQ
    num_discursive = 3 - num_mcq     # Remaining are discursive
    return num_mcq, num_discursive


def generate_requests_for_discipline(discipline, num_requests=10):
    """
    Generate requests for a single discipline.

    Parameters:
    - discipline: Name of the discipline
    - num_requests: Total number of requests (default 10 to get 10 clusters of 3 questions each)

    Each request yields 3 questions, so 10 requests = 30 questions total.
    But you mentioned 10 questions per discipline, so you may want num_requests=4
    (4 requests × ~3 questions = ~12 questions, adjust as needed)
    """

    if discipline not in DISCIPLINE_CATEGORIES:
        raise ValueError(f"Unknown discipline: {discipline}")

    # Get available categories for this discipline
    available_categories = DISCIPLINE_CATEGORIES[discipline].copy()

    # Select 5 random English and 5 random Portuguese locales
    selected_en_locales = random.sample(ENGLISH_LOCALES, min(5, len(ENGLISH_LOCALES)))
    selected_pt_locales = random.sample(PORTUGUESE_LOCALES, min(5, len(PORTUGUESE_LOCALES)))
    all_locales = selected_en_locales + selected_pt_locales

    requests = []

    for i in range(num_requests):
        # Randomly select category (without replacement if possible)
        if available_categories:
            category = random.choice(available_categories)
            # Optionally remove to avoid repetition (comment out to allow repetition)
            # available_categories.remove(category)
        else:
            # If we run out, reset the pool
            available_categories = DISCIPLINE_CATEGORIES[discipline].copy()
            category = random.choice(available_categories)

        # Random locale from the selected 10
        locale = random.choice(all_locales)

        # Random grade
        grade = random.choice(AVAILABLE_GRADES)

        # Random difficulty
        difficulty = random.choice(DIFFICULTY_LEVELS)

        # Random MCQ/Discursive distribution
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


def generate_all_requests(disciplines=None, questions_per_discipline=10):
    """
    Generate requests for multiple disciplines.

    Parameters:
    - disciplines: List of disciplines (None = all disciplines)
    - questions_per_discipline: Target number of questions per discipline (default 10)

    Note: Each request generates ~3 questions. Adjust num_requests accordingly.
    For 10 questions per discipline: num_requests = 4 (4 × 3 = 12 questions, close to 10)
    """

    if disciplines is None:
        disciplines = list(DISCIPLINE_CATEGORIES.keys())

    # Calculate requests needed per discipline
    # Assuming ~3 questions per request, for 10 questions we need ~4 requests
    num_requests_per_discipline = (questions_per_discipline + 2) // 3

    all_requests = []

    for discipline in disciplines:
        print(f"\n# -------------------------------------------------------------------------")
        print(f"# {discipline} ({num_requests_per_discipline} requests)")
        print(f"# -------------------------------------------------------------------------")

        discipline_requests = generate_requests_for_discipline(
            discipline,
            num_requests=num_requests_per_discipline
        )

        all_requests.extend(discipline_requests)

    return all_requests


# -------------------------------------------------------------------------
# EXAMPLE USAGE
# -------------------------------------------------------------------------

if __name__ == "__main__":
    # Set random seed for reproducibility (remove for true randomness)
    random.seed(42)

    # Example 1: Generate requests for specific disciplines
    selected_disciplines = ["Mathematics", "Science", "Physics", "History", "Biology"]

    print("REQUESTS = [")
    requests = generate_all_requests(disciplines=selected_disciplines, questions_per_discipline=10)

    for req in requests:
        print("    {")
        for key, value in req.items():
            if isinstance(value, str):
                print(f'        "{key}": "{value}",')
            else:
                print(f'        "{key}": {value},')
        print("    },")

    print("]")

    print(f"\n# Total requests: {len(requests)}")
    print(f"# Total questions (approximate): {len(requests) * 3}")

    # Summary statistics
    print("\n# Summary by discipline:")
    by_discipline = {}
    for req in requests:
        disc = req["discipline"]
        by_discipline[disc] = by_discipline.get(disc, 0) + 1

    for disc, count in sorted(by_discipline.items()):
        print(f"#   {disc}: {count} requests (~{count * 3} questions)")
