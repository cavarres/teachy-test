"""
Generate Bilingual Expert Rating Requests for Questions

REQUIREMENTS:
- 10 questions per discipline (1 MCQ + 1 discursive per request = 2 questions)
- Random categories from each discipline
- 5 en_US + 5 pt_BR locales per discipline
- Random grades 60-120
- Portuguese requests use Portuguese discipline names and category names
"""

import random
import csv

# -------------------------------------------------------------------------
# CONFIGURATION
# -------------------------------------------------------------------------

ENGLISH_LOCALE = "en_US"
PORTUGUESE_LOCALE = "pt_BR"

AVAILABLE_GRADES = [60, 70, 80, 90, 100, 110, 120]
DIFFICULTY_LEVELS = [300, 500, 700]

def map_difficulty_to_level_range(difficulty):
    """Map our difficulty (300/500/700) to CSV level ranges"""
    if difficulty == 300:
        return (0, 300)
    elif difficulty == 500:
        return (301, 600)
    else:  # 700
        return (601, 1000)

# Discipline translations (English -> Portuguese)
DISCIPLINE_TRANSLATIONS = {
    "Mathematics": "Matemática",
    "Science": "Ciências",
    "Physics": "Física",
    "History": "História",
    "Geography": "Geografia",
    "Biology": "Biologia",
    "English": "Inglês",
    "Philosophy": "Filosofia",
    "Physical Education": "Educação Física",
    "Arts": "Artes",
    "Spanish": "Espanhol",
    "Portuguese": "Português",
}

# Category translations (English -> Portuguese)
CATEGORY_TRANSLATIONS = {
    # Mathematics
    "Algebra": "Álgebra",
    "Arithmetic and Numbers": "Aritmética e Números",
    "Combinatorial Analysis and Probability": "Análise Combinatória e Probabilidade",
    "Geometry": "Geometria",
    "Magnitudes and Measurements": "Grandezas e Medidas",
    "Magnitudes and Measures": "Grandezas e Medidas",
    "Statistics": "Estatística",
    "Trigonometry": "Trigonometria",

    # Science
    "Earth and Universe": "Terra e Universo",
    "Life and Evolution": "Vida e Evolução",
    "Matter and Energy": "Matéria e Energia",

    # Physics
    "Astronomy": "Astronomia",
    "Electromagnetism": "Eletromagnetismo",
    "Introduction to Physics": "Introdução à Física",
    "Kinematics": "Cinemática",
    "Modern Physics and Relativity": "Física Moderna e Relatividade",
    "Modern physics and relativity": "Física Moderna e Relatividade",
    "Statics and Dynamics": "Estática e Dinâmica",
    "Thermology": "Termologia",
    "Waves and Optics": "Ondas e Óptica",

    # History
    "Ancient History": "História Antiga",
    "Contemporary History": "História Contemporânea",
    "Medieval History": "História Medieval",
    "Modern History": "História Moderna",
    "Theory of History": "Teoria da História",

    # Geography
    "Ecosystem and Biome": "Ecossistema e Bioma",
    "Geographic Space": "Espaço Geográfico",
    "Geographical Space": "Espaço Geográfico",
    "Geography Theory": "Teoria da Geografia",
    "Geopolitics": "Geopolítica",
    "Human Development": "Desenvolvimento Humano",
    "Region": "Região",
    "Territory": "Território",
    "Theory of Geography": "Teoria da Geografia",

    # Biology
    "Biochemistry and Metabolism": "Bioquímica e Metabolismo",
    "Ecology and Environment": "Ecologia e Meio Ambiente",
    "Genetics and Heredity": "Genética e Hereditariedade",
    "Genetics and Inheritance": "Genética e Herança",
    "Human Anatomy and Physiology": "Anatomia e Fisiologia Humana",
    "Introduction to Biology and Evolution": "Introdução à Biologia e Evolução",
    "Structure and Function of Organisms": "Estrutura e Função dos Organismos",

    # Philosophy
    "Concept": "Conceito",
    "Culture": "Cultura",
    "Ethics": "Ética",
    "Origin": "Origem",
    "Politics": "Política",

    # Physical Education
    "Dance": "Dança",
    "Ethics in Sports": "Ética no Esporte",
    "Health": "Saúde",
    "Recreation": "Recreação",
    "Research in Sports": "Pesquisa em Esportes",
    "Sport": "Esporte",
    "Wrestling": "Luta",

    # Arts
    "Art Knowledge": "Conhecimento em Arte",
    "Art and Movement": "Arte e Movimento",
    "Artistic Production": "Produção Artística",
    "Music": "Música",
    "Performing Arts": "Artes Cênicas",
    "Scenic Art": "Arte Cênica",
    "Visual Art": "Arte Visual",

    # English
    "Verbs": "Verbos",
    "Vocabulary": "Vocabulário",
    "Reading, Writing, and Comprehension": "Leitura, Escrita e Compreensão",
    "Reading, Writing and Comprehension": "Leitura, Escrita e Compreensão",
    "Grammar": "Gramática",
}

# -------------------------------------------------------------------------
# HELPER FUNCTIONS
# -------------------------------------------------------------------------

def load_categories_from_csv(csv_path):
    """
    Load available categories for each discipline from the CSV.
    Returns a dict mapping (discipline, grade, difficulty) -> list of categories
    """
    # Structure: discipline -> grade -> difficulty -> [categories]
    disciplines_categories = {}

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            disc = row.get('discipline', '').strip()
            category = row.get('category', '').strip()
            grade_str = row.get('grade', '').strip()
            level_str = row.get('level', '').strip()

            # Convert grade string to numeric (e.g., "6th grade" -> 60)
            grade_num = None
            if 'grade' in grade_str.lower():
                try:
                    # Extract number from strings like "6th grade", "12th grade"
                    grade_val = int(''.join(filter(str.isdigit, grade_str.split('th')[0])))
                    if 1 <= grade_val <= 12:
                        grade_num = grade_val * 10  # Convert to 60-120 format
                except:
                    continue

            # Get difficulty level and map to our difficulty buckets (300/500/700)
            csv_level = None
            if level_str:
                try:
                    csv_level = int(level_str)
                except:
                    continue

            # Map CSV level to our difficulty (300/500/700)
            difficulty = None
            if csv_level is not None:
                if 0 <= csv_level <= 300:
                    difficulty = 300
                elif 301 <= csv_level <= 600:
                    difficulty = 500
                else:  # 601+
                    difficulty = 700

            if disc and category and grade_num and difficulty:
                if disc not in disciplines_categories:
                    disciplines_categories[disc] = {}
                if grade_num not in disciplines_categories[disc]:
                    disciplines_categories[disc][grade_num] = {}
                if difficulty not in disciplines_categories[disc][grade_num]:
                    disciplines_categories[disc][grade_num][difficulty] = set()

                disciplines_categories[disc][grade_num][difficulty].add(category)

    # Convert sets to lists
    result = {}
    for disc in disciplines_categories:
        result[disc] = {}
        for grade in disciplines_categories[disc]:
            result[disc][grade] = {}
            for diff in disciplines_categories[disc][grade]:
                result[disc][grade][diff] = list(disciplines_categories[disc][grade][diff])

    # Add Portuguese language categories for all grades/difficulties
    # Since we don't have CSV data, we'll make them available for all combinations
    result['Portuguese'] = {}
    portuguese_categories = [
        'Classes Gramaticais',
        'Substantivo',
        'Substantivos',
        'Interpretação de Texto',
        'Crase',
        'Interpretação Textual',
        'Alfabetização',
        'Artigo de Opinião',
        'Preposição',
        'Parnasianismo',
        'Pontuação',
        'Classe de Palavras'
    ]
    for grade in AVAILABLE_GRADES:
        result['Portuguese'][grade] = {}
        for diff in DIFFICULTY_LEVELS:
            result['Portuguese'][grade][diff] = portuguese_categories.copy()

    return result


def translate_discipline(discipline, locale):
    """Translate discipline name based on locale."""
    if locale == PORTUGUESE_LOCALE and discipline in DISCIPLINE_TRANSLATIONS:
        return DISCIPLINE_TRANSLATIONS[discipline]
    return discipline


def translate_category(category, locale):
    """
    Categories from CSV are already in the correct language.
    No translation needed - just return as-is.
    """
    return category


# -------------------------------------------------------------------------
# REQUEST GENERATOR
# -------------------------------------------------------------------------

def generate_question_distribution():
    """Returns 1 MCQ and 1 discursive for even distribution."""
    return 1, 1


def generate_requests_for_discipline(discipline, grade_diff_categories, target_questions=10):
    """
    Generate requests for a single discipline.

    Each request yields 2 questions (1 MCQ + 1 discursive).
    For 10 questions: 5 requests needed.

    Args:
        discipline: Name of the discipline
        grade_diff_categories: Dict of grade -> difficulty -> [categories]
        target_questions: Number of questions to generate
    """
    num_requests = target_questions // 2

    # Special handling for language disciplines
    if discipline == "English":
        # English discipline: ALL questions in en_US
        locale_pool = [ENGLISH_LOCALE] * num_requests
    elif discipline == "Portuguese":
        # Portuguese discipline: ALL questions in pt_BR
        locale_pool = [PORTUGUESE_LOCALE] * num_requests
    else:
        # Other disciplines: 5 en_US + 5 pt_BR
        locale_pool = [ENGLISH_LOCALE] * 5 + [PORTUGUESE_LOCALE] * 5
        # Shuffle to randomize order
        random.shuffle(locale_pool)

    requests = []
    attempts_without_success = 0
    max_attempts_without_success = 100

    while len(requests) < num_requests and attempts_without_success < max_attempts_without_success:
        # Select locale from pool
        locale = locale_pool[len(requests) % len(locale_pool)]

        # Try to find a valid grade/difficulty/category combination
        category = None
        grade = None
        difficulty = None

        # Random grade and difficulty
        grade = random.choice(AVAILABLE_GRADES)
        difficulty = random.choice(DIFFICULTY_LEVELS)

        # Check if this grade/difficulty combo has categories
        if grade in grade_diff_categories and difficulty in grade_diff_categories[grade]:
            available_categories = grade_diff_categories[grade][difficulty]
            if available_categories:
                category = random.choice(available_categories)

        # If we found a valid combination, add it
        if category is not None:
            attempts_without_success = 0  # Reset counter

            # Fixed distribution: 1 MCQ + 1 discursive
            num_mcq, num_discursive = generate_question_distribution()

            # Translate discipline for Portuguese locale
            translated_discipline = translate_discipline(discipline, locale)

            request = {
                "grade": grade,
                "locale": locale,
                "difficulty": difficulty,
                "category": category,
                "discipline": translated_discipline,
                "num_mcq": num_mcq,
                "num_discursive": num_discursive,
            }

            requests.append(request)
        else:
            attempts_without_success += 1

    if len(requests) < num_requests:
        print(f"Warning: Only generated {len(requests)} out of {num_requests} requests for {discipline}")

    return requests


def generate_all_requests(csv_path, selected_disciplines=None, questions_per_discipline=10):
    """Generate requests for multiple disciplines."""
    all_categories = load_categories_from_csv(csv_path)

    if selected_disciplines:
        disciplines = [d for d in selected_disciplines if d in all_categories]
    else:
        disciplines = list(all_categories.keys())

    all_requests = []

    for discipline in disciplines:
        grade_diff_categories = all_categories[discipline]

        if not grade_diff_categories:
            print(f"Warning: No categories found for {discipline}, skipping...")
            continue

        discipline_requests = generate_requests_for_discipline(
            discipline,
            grade_diff_categories,
            target_questions=questions_per_discipline
        )

        all_requests.extend(discipline_requests)

    return all_requests


def print_requests(requests):
    """Print requests in Python list format."""
    print("REQUESTS = [")

    for i, req in enumerate(requests):
        # Add discipline header
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
    CSV_PATH = "/Users/camila/Turbo_SAFE/teachy/teachy-test/Biblioteca de Alexandria - en.csv"

    # Selected disciplines as requested
    SELECTED_DISCIPLINES = [
        "Mathematics",           # Matemática
        "Portuguese",            # Português (custom categories)
        "Science",              # Ciências
        "History",              # História
        "Geography",            # Geografia
        "Biology",              # Biologia
        "English",              # Inglês
        "Philosophy",           # Filosofia
        "Physical Education",   # Educação Física
        "Physics",              # Física
    ]

    QUESTIONS_PER_DISCIPLINE = 10

    # Set random seed for reproducibility (remove for different results)
    random.seed(42)

    print(f"# Generating bilingual requests for {len(SELECTED_DISCIPLINES)} disciplines")
    print(f"# Target: {QUESTIONS_PER_DISCIPLINE} questions per discipline")
    print(f"# Each request: 2 questions (1 MCQ + 1 discursive)")
    print(f"# Portuguese requests use Portuguese names")
    print()

    # Generate requests
    requests = generate_all_requests(
        CSV_PATH,
        selected_disciplines=SELECTED_DISCIPLINES,
        questions_per_discipline=QUESTIONS_PER_DISCIPLINE
    )

    # Print formatted output
    print_requests(requests)

    # Summary
    print(f"\n# =========================================================================")
    print(f"# SUMMARY")
    print(f"# =========================================================================")
    print(f"# Total requests: {len(requests)}")
    print(f"# Total questions: {len(requests) * 2}")

    from collections import Counter
    locale_counts = Counter(req["locale"] for req in requests)

    # Count by original discipline name
    disc_counts = {}
    for req in requests:
        # Get original English name for counting
        orig_disc = req["discipline"]
        for eng, port in DISCIPLINE_TRANSLATIONS.items():
            if port == orig_disc:
                orig_disc = eng
                break
        disc_counts[orig_disc] = disc_counts.get(orig_disc, 0) + 1

    print(f"\n# Requests per discipline:")
    for disc, count in sorted(disc_counts.items()):
        print(f"#   {disc}: {count} requests ({count * 2} questions)")

    print(f"\n# Locale distribution:")
    for locale, count in sorted(locale_counts.items()):
        print(f"#   {locale}: {count} requests")
