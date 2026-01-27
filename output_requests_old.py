# Generating bilingual requests for 10 disciplines
# Target: 10 questions per discipline
# Each request: 2 questions (1 MCQ + 1 discursive)
# Portuguese requests use Portuguese names

REQUESTS = [
    # -------------------------------------------------------------------------
    # Matemática
    # -------------------------------------------------------------------------
    {
        "grade": 100,
        "locale": "pt_BR",
        "difficulty": 500,
        "category": "Notação Científica: Revisão",
        "discipline": "Matemática",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Mathematics
    # -------------------------------------------------------------------------
    {
        "grade": 60,
        "locale": "en_US",
        "difficulty": 300,
        "category": "Probability: Introduction",
        "discipline": "Mathematics",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 100,
        "locale": "en_US",
        "difficulty": 300,
        "category": "Circle: Eccentric Angles",
        "discipline": "Mathematics",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Matemática
    # -------------------------------------------------------------------------
    {
        "grade": 110,
        "locale": "pt_BR",
        "difficulty": 700,
        "category": "Análise Combinatória: Princípio Aditivo",
        "discipline": "Matemática",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 90,
        "locale": "pt_BR",
        "difficulty": 700,
        "category": "Volume: Prisma Retangular Contextualizado",
        "discipline": "Matemática",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Português
    # -------------------------------------------------------------------------
    {
        "grade": 120,
        "locale": "pt_BR",
        "difficulty": 300,
        "category": "Substantivos",
        "discipline": "Português",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 110,
        "locale": "pt_BR",
        "difficulty": 500,
        "category": "Interpretação Textual",
        "discipline": "Português",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 80,
        "locale": "pt_BR",
        "difficulty": 300,
        "category": "Interpretação de Texto",
        "discipline": "Português",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 120,
        "locale": "pt_BR",
        "difficulty": 500,
        "category": "Substantivo",
        "discipline": "Português",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 60,
        "locale": "pt_BR",
        "difficulty": 500,
        "category": "Substantivo",
        "discipline": "Português",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Science
    # -------------------------------------------------------------------------
    {
        "grade": 60,
        "locale": "en_US",
        "difficulty": 300,
        "category": "Human Body: Digestive System",
        "discipline": "Science",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Ciências
    # -------------------------------------------------------------------------
    {
        "grade": 90,
        "locale": "pt_BR",
        "difficulty": 500,
        "category": "Estequiometria Básica",
        "discipline": "Ciências",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Science
    # -------------------------------------------------------------------------
    {
        "grade": 80,
        "locale": "en_US",
        "difficulty": 300,
        "category": "Human Body: Human Reproduction",
        "discipline": "Science",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Ciências
    # -------------------------------------------------------------------------
    {
        "grade": 70,
        "locale": "pt_BR",
        "difficulty": 300,
        "category": "Novos Materiais e Tecnologias",
        "discipline": "Ciências",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Science
    # -------------------------------------------------------------------------
    {
        "grade": 90,
        "locale": "en_US",
        "difficulty": 500,
        "category": "Phases of the Moon",
        "discipline": "Science",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # História
    # -------------------------------------------------------------------------
    {
        "grade": 80,
        "locale": "pt_BR",
        "difficulty": 300,
        "category": "Independências Latino-Americanas: Formação das Primeiras Repúblicas",
        "discipline": "História",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # History
    # -------------------------------------------------------------------------
    {
        "grade": 80,
        "locale": "en_US",
        "difficulty": 300,
        "category": "French Revolution: Constitutional Monarchy, National Convention, and Directory",
        "discipline": "History",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 90,
        "locale": "en_US",
        "difficulty": 300,
        "category": "World War II",
        "discipline": "History",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # História
    # -------------------------------------------------------------------------
    {
        "grade": 70,
        "locale": "pt_BR",
        "difficulty": 300,
        "category": "Monarquias Absolutas",
        "discipline": "História",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # History
    # -------------------------------------------------------------------------
    {
        "grade": 100,
        "locale": "en_US",
        "difficulty": 500,
        "category": "Spanish Colonization: Economy, Politics, Society, Colonial Pact, and Slavery",
        "discipline": "History",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Geografia
    # -------------------------------------------------------------------------
    {
        "grade": 110,
        "locale": "pt_BR",
        "difficulty": 700,
        "category": "América Latina: Governos de Esquerda",
        "discipline": "Geografia",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Geography
    # -------------------------------------------------------------------------
    {
        "grade": 110,
        "locale": "en_US",
        "difficulty": 700,
        "category": "Europe: EURO and the Trade Blocks",
        "discipline": "Geography",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 120,
        "locale": "en_US",
        "difficulty": 700,
        "category": "Energy Sources: Renewable Energies: Review",
        "discipline": "Geography",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 110,
        "locale": "en_US",
        "difficulty": 700,
        "category": "Europe: EURO and the Trade Blocks",
        "discipline": "Geography",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 120,
        "locale": "en_US",
        "difficulty": 700,
        "category": "Modes and Transportation: Review",
        "discipline": "Geography",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Biologia
    # -------------------------------------------------------------------------
    {
        "grade": 120,
        "locale": "pt_BR",
        "difficulty": 300,
        "category": "Genética: 1ª Lei de Mendel",
        "discipline": "Biologia",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 120,
        "locale": "pt_BR",
        "difficulty": 300,
        "category": "Evolução",
        "discipline": "Biologia",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 100,
        "locale": "pt_BR",
        "difficulty": 300,
        "category": "Animais: Sistema Respiratório",
        "discipline": "Biologia",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Biology
    # -------------------------------------------------------------------------
    {
        "grade": 110,
        "locale": "en_US",
        "difficulty": 300,
        "category": "Human Body: Endocrine System",
        "discipline": "Biology",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 100,
        "locale": "en_US",
        "difficulty": 300,
        "category": "Plant Kingdom: Plants",
        "discipline": "Biology",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # English
    # -------------------------------------------------------------------------
    {
        "grade": 70,
        "locale": "en_US",
        "difficulty": 300,
        "category": "Prepositions of Time",
        "discipline": "English",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 60,
        "locale": "en_US",
        "difficulty": 300,
        "category": "Verbs: Introduction to Present Continuous",
        "discipline": "English",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 110,
        "locale": "en_US",
        "difficulty": 500,
        "category": "Pronouns and Adjectives: Demonstratives",
        "discipline": "English",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 100,
        "locale": "en_US",
        "difficulty": 300,
        "category": "Pronouns and Adjectives: Possessive and Genitive",
        "discipline": "English",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 90,
        "locale": "en_US",
        "difficulty": 300,
        "category": "Reading and Text Comprehension",
        "discipline": "English",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Filosofia
    # -------------------------------------------------------------------------
    {
        "grade": 120,
        "locale": "pt_BR",
        "difficulty": 300,
        "category": "Diversidade Cultural",
        "discipline": "Filosofia",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Philosophy
    # -------------------------------------------------------------------------
    {
        "grade": 120,
        "locale": "en_US",
        "difficulty": 300,
        "category": "Identity",
        "discipline": "Philosophy",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Filosofia
    # -------------------------------------------------------------------------
    {
        "grade": 100,
        "locale": "pt_BR",
        "difficulty": 300,
        "category": "Pensamento Científico vs. Senso Comum",
        "discipline": "Filosofia",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Philosophy
    # -------------------------------------------------------------------------
    {
        "grade": 100,
        "locale": "en_US",
        "difficulty": 300,
        "category": "Ethics in the Globalized World",
        "discipline": "Philosophy",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Filosofia
    # -------------------------------------------------------------------------
    {
        "grade": 120,
        "locale": "pt_BR",
        "difficulty": 300,
        "category": "Escolas Filosóficas: Antiga, Medieval, Moderna e Contemporânea",
        "discipline": "Filosofia",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Educação Física
    # -------------------------------------------------------------------------
    {
        "grade": 80,
        "locale": "pt_BR",
        "difficulty": 300,
        "category": "Transformações em Esportes",
        "discipline": "Educação Física",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 90,
        "locale": "pt_BR",
        "difficulty": 300,
        "category": "Futsal",
        "discipline": "Educação Física",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 120,
        "locale": "pt_BR",
        "difficulty": 300,
        "category": "Futebol",
        "discipline": "Educação Física",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Physical Education
    # -------------------------------------------------------------------------
    {
        "grade": 100,
        "locale": "en_US",
        "difficulty": 300,
        "category": "Health and Sports",
        "discipline": "Physical Education",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Educação Física
    # -------------------------------------------------------------------------
    {
        "grade": 100,
        "locale": "pt_BR",
        "difficulty": 300,
        "category": "Atletismo",
        "discipline": "Educação Física",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Physics
    # -------------------------------------------------------------------------
    {
        "grade": 120,
        "locale": "en_US",
        "difficulty": 700,
        "category": "Geometric Optics: Optical Instruments",
        "discipline": "Physics",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    # -------------------------------------------------------------------------
    # Física
    # -------------------------------------------------------------------------
    {
        "grade": 120,
        "locale": "pt_BR",
        "difficulty": 700,
        "category": "Ondas: Batimentos",
        "discipline": "Física",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 120,
        "locale": "pt_BR",
        "difficulty": 700,
        "category": "Lentes: Vergência",
        "discipline": "Física",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 110,
        "locale": "pt_BR",
        "difficulty": 700,
        "category": "Magnetismo: Lei de Faraday",
        "discipline": "Física",
        "num_mcq": 1,
        "num_discursive": 1,
    },
    {
        "grade": 100,
        "locale": "pt_BR",
        "difficulty": 300,
        "category": "Dinâmica: Força de Atrito",
        "discipline": "Física",
        "num_mcq": 1,
        "num_discursive": 1,
    },
]

# =========================================================================
# SUMMARY
# =========================================================================
# Total requests: 50
# Total questions: 100

# Requests per discipline:
#   Biology: 5 requests (10 questions)
#   English: 5 requests (10 questions)
#   Geography: 5 requests (10 questions)
#   History: 5 requests (10 questions)
#   Mathematics: 5 requests (10 questions)
#   Philosophy: 5 requests (10 questions)
#   Physical Education: 5 requests (10 questions)
#   Physics: 5 requests (10 questions)
#   Portuguese: 5 requests (10 questions)
#   Science: 5 requests (10 questions)

# Locale distribution:
#   en_US: 23 requests
#   pt_BR: 27 requests
