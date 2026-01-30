// Discipline name mapping (Portuguese -> English) for subject dropdown: one subject in English
const DISCIPLINE_TRANSLATIONS_REVERSE = {
    "Matemática": "Mathematics",
    "Ciências": "Science",
    "Física": "Physics",
    "História": "History",
    "Geografia": "Geography",
    "Biologia": "Biology",
    "Inglês": "English Language Arts",
    "Filosofia": "Philosophy",
    "Educação Física": "Physical Education",
    "Artes": "Arts",
    "Português": "Portuguese",
    "Espanhol": "Spanish"
};

// Global state: data from list_of_questions_to_test_v3.json
let allQuestionLists = []; // Raw list objects from JSON
let listsBySubject = {}; // normalized (English) discipline -> array of normalized list objects
let selectedSubject = null;
let selectedLanguage = null; // 'English' | 'Portuguese' | 'BOTH'
let listsForCurrentSubject = []; // Lists for selected subject + language filter
let listKeys = [];
let currentListIndex = 0;
let currentList = null;
let currentQuestionList = [];
let listContext = {};
let evaluation = null;
let listId = null;

// Rubric criteria for info modal (keys must match list-evaluator.html data-criterion attributes)
const criteria = {
    teacherInputCompliance: {
        title: "1. Teacher Input Compliance (0–3)",
        category: "Category 1: Teacher Input Alignment",
        question: "Does the list meet the teacher's explicit technical specifications?",
        subItems: [
            "Correct language (1 point): Questions are in the language specified by the teacher",
            "Correct total number of questions (1 point): Total number of questions matches the teacher's request",
            "Correct question type distribution (1 point): Question types match teacher's selection — MCQ only → all multiple choice; Open-ended only → all open-ended; Both → at least one MCQ AND at least one open-ended"
        ],
        scoreNote: "Score: 0–3 (sum of checks passed)"
    },
    topicMaterialsAlignment: {
        title: "2. Topic & Materials Alignment (0–2)",
        category: "Category 1: Teacher Input Alignment",
        question: "Does the list address the topic requested by the teacher and appropriately incorporate any uploaded materials?",
        scores: {
            0: "The list is about a substantially different topic than requested, OR uploaded materials are ignored entirely.",
            1: "The list addresses the general topic area but may drift into tangential content, OR uploaded materials are only partially reflected.",
            2: "The list stays focused on the requested topic throughout and appropriately incorporates all uploaded materials where relevant."
        }
    },
    gradeLevelDifficulty: {
        title: "3. Grade-Level & Difficulty Alignment (0–2)",
        category: "Category 1: Teacher Input Alignment",
        question: "Is the exercise list consistently appropriate for the target grade level and specified difficulty level in vocabulary, complexity, and cognitive expectations?",
        scores: {
            0: "The list does not match the specified grade and difficulty level. Multiple questions have vocabulary, language complexity and/or expected reasoning that are too advanced or too simple for the requested grade-difficulty combination.",
            1: "The list mostly matches the specified grade and difficulty level, but there are some issues with vocabulary, language complexity and/or expected reasoning being off-level for the requested combination.",
            2: "The list is uniformly appropriate for the specified grade level and difficulty level. Vocabulary and language are accessible, and the cognitive expectations consistently match the requested grade-difficulty combination throughout."
        }
    },
    uniqueness: {
        title: "4. Uniqueness & Diversity of Questions (0–2)",
        category: "Category 2: Pedagogical Fundamentals",
        question: "Does the exercise list avoid unintended redundancy and show meaningful variation in how the target skill(s) are assessed?",
        scores: {
            0: "The list includes clear duplication or near-identical questions, indicating unintended redundancy (the same concept tested repeatedly with only superficial changes).",
            1: "The list avoids direct duplication, but shows limited variation in approach (similar formats, contexts, or problem structures used repeatedly).",
            2: "The list shows meaningful variation in how the target skill(s) are assessed, avoiding unintended redundancy while allowing purposeful repetition when relevant."
        }
    },
    topicCoverage: {
        title: "5. Topic Coverage (0–2)",
        category: "Category 2: Pedagogical Fundamentals",
        question: "Does the exercise list provide appropriate coverage of the content domain within the scope defined by the teacher?",
        scores: {
            0: "The list shows major coverage gaps within the requested scope (key subtopics or concepts are missing or severely underrepresented).",
            1: "The list covers the main content area, but includes noticeable gaps, with some important subtopics underrepresented relative to the intended scope.",
            2: "The list covers all major key subtopics appropriate for the grade level, subject, and teacher specifications."
        }
    },
    cognitiveDiversity: {
        title: "6. Cognitive Level Diversity (0–2)",
        category: "Category 2: Pedagogical Fundamentals",
        question: "Does the list include appropriate variety across different thinking levels?",
        scores: {
            0: "The list is limited to a single low-level cognitive demand, with no higher-order thinking where it would be expected.",
            1: "The list shows some variation in cognitive demand, but the range or distribution is not clearly aligned with the assessment purpose.",
            2: "The list includes a purposeful range of cognitive demands (Remember/Understand/Apply/Analyze/Evaluate/Create) aligned with the grade level and assessment purpose."
        }
    },
    difficultyProgression: {
        title: "7. Difficulty Progression (0–2)",
        category: "Category 2: Pedagogical Fundamentals",
        question: "Is the exercise list ordered in a way that avoids unnecessary difficulty spikes and supports a coherent progression for students?",
        scores: {
            0: "The list has no clear progression and includes abrupt or confusing difficulty jumps that make the assessment hard to follow.",
            1: "Some progression is visible, but the ordering is inconsistent, with occasional difficulty jumps or uneven transitions.",
            2: "The list shows a clear and intentional progression or distribution of difficulty that supports smooth navigation through the assessment."
        }
    },
    answerLeakage: {
        title: "8. Answer Leakage Prevention (0–2)",
        category: "Category 3: Assessment Design",
        question: "Does the list avoid questions that inadvertently reveal answers to other questions?",
        scores: {
            0: "Clear answer leakage exists (later questions or answer choices reveal correct answers to earlier questions).",
            1: "Minor leakage risks present (some questions provide hints but don't fully reveal answers).",
            2: "No cross-question answer hints; each question can be answered independently."
        }
    }
};

// List-evaluator form fields (must match list-evaluator.html data-field attributes)
const LIST_EVALUATOR_COMPLIANCE_FIELDS = ['teacherInputCompliance_language', 'teacherInputCompliance_count', 'teacherInputCompliance_type'];
const LIST_EVALUATOR_CRITERIA_FIELDS = ['topicMaterialsAlignment', 'gradeLevelDifficulty', 'uniqueness', 'topicCoverage', 'cognitiveDiversity', 'difficultyProgression', 'answerLeakage'];
const LIST_EVALUATOR_ALL_FIELDS = [...LIST_EVALUATOR_COMPLIANCE_FIELDS, ...LIST_EVALUATOR_CRITERIA_FIELDS];
const LIST_EVALUATOR_MAX_SCORE = 3 + (LIST_EVALUATOR_CRITERIA_FIELDS.length * 2); // 3 + 14 = 17
// Human-readable names for "missing criteria" warning (one label per criterion; compliance = 1 criterion with 3 sub-fields)
const LIST_EVALUATOR_FIELD_LABELS = {
    teacherInputCompliance_language: 'Teacher Input Compliance',
    teacherInputCompliance_count: 'Teacher Input Compliance',
    teacherInputCompliance_type: 'Teacher Input Compliance',
    topicMaterialsAlignment: 'Topic & Materials Alignment',
    gradeLevelDifficulty: 'Grade-Level & Difficulty Alignment',
    uniqueness: 'Uniqueness & Diversity',
    topicCoverage: 'Topic Coverage',
    cognitiveDiversity: 'Cognitive Level Diversity',
    difficultyProgression: 'Difficulty Progression',
    answerLeakage: 'Answer Leakage Prevention'
};

const LIST_EVALUATOR_STATE_KEY = 'listEvaluatorState';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadJsonFile();
});

function setupEventListeners() {
    // Selection page
    const subjectSelect = document.getElementById('subjectSelect');
    const userNameInput = document.getElementById('userNameInput');
    const languageSelect = document.getElementById('languageSelect');
    if (subjectSelect) {
        subjectSelect.addEventListener('change', validateSelection);
    }
    if (userNameInput) {
        userNameInput.addEventListener('input', validateSelection);
    }
    if (languageSelect) {
        languageSelect.addEventListener('change', validateSelection);
    }
    const startEvaluatorBtn = document.getElementById('startEvaluatorBtn');
    if (startEvaluatorBtn) {
        startEvaluatorBtn.addEventListener('click', startEvaluator);
    }
    const backToSelectionBtn = document.getElementById('backToSelectionBtn');
    if (backToSelectionBtn) {
        backToSelectionBtn.addEventListener('click', backToSelection);
    }
    // Export and evaluation
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToYaml);
    }
    const toggleCriteriaBtn = document.getElementById('toggleCriteriaBtn');
    const closeCriteriaBtn = document.getElementById('closeCriteriaBtn');
    if (toggleCriteriaBtn) toggleCriteriaBtn.addEventListener('click', toggleCriteria);
    if (closeCriteriaBtn) closeCriteriaBtn.addEventListener('click', toggleCriteria);
    document.getElementById('saveEvaluationBtn').addEventListener('click', saveEvaluation);
    document.getElementById('prevBtn').addEventListener('click', () => navigateQuestion(-1));
    document.getElementById('nextBtn').addEventListener('click', () => navigateQuestion(1));
    
    // Remove question click navigation - clicking questions just highlights them
    
    // Handle score button clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-score')) {
            const field = e.target.getAttribute('data-field');
            const value = e.target.getAttribute('data-value');
            
            const siblings = document.querySelectorAll(`.btn-score[data-field="${field}"]`);
            siblings.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            updateScore();
        }
        
        if (e.target.classList.contains('info-icon')) {
            const criterion = e.target.getAttribute('data-criterion');
            showCriterionInfo(criterion);
        }
        
        // Handle question item clicks in sidebar - just highlight, don't navigate
        if (e.target.closest('.question-list-item')) {
            const item = e.target.closest('.question-list-item');
            const index = parseInt(item.getAttribute('data-index'));
            if (!isNaN(index)) {
                selectQuestion(index);
            }
        }
    });
    
    document.getElementById('summary').addEventListener('input', updateScore);
    document.getElementById('closeInfoModal').addEventListener('click', () => {
        document.getElementById('infoModal').style.display = 'none';
    });
    
    // Keyboard shortcuts for scoring
    document.addEventListener('keydown', handleKeyboardInput);
    
    const criteriaContent = document.getElementById('criteriaContent');
    if (criteriaContent) loadCriteriaContent();
}

function validateSelection() {
    const userNameInput = document.getElementById('userNameInput');
    const subjectSelect = document.getElementById('subjectSelect');
    const languageSelect = document.getElementById('languageSelect');
    const startBtn = document.getElementById('startEvaluatorBtn');
    if (!userNameInput || !subjectSelect || !startBtn) return;
    if (userNameInput.value.trim() && subjectSelect.value && (!languageSelect || languageSelect.value)) {
        startBtn.disabled = false;
    } else {
        startBtn.disabled = true;
    }
}

function startEvaluator() {
    const subjectSelect = document.getElementById('subjectSelect');
    const languageSelect = document.getElementById('languageSelect');
    const userNameInput = document.getElementById('userNameInput');
    const subject = subjectSelect ? subjectSelect.value : '';
    const language = languageSelect ? languageSelect.value : 'BOTH';
    const userName = userNameInput ? userNameInput.value.trim() : '';
    if (!subject || !listsBySubject[subject] || listsBySubject[subject].length === 0) {
        alert('Please select a subject.');
        return;
    }
    selectedSubject = subject;
    selectedLanguage = language;
    const allForSubject = listsBySubject[subject];
    if (language === 'BOTH') {
        listsForCurrentSubject = allForSubject;
    } else {
        const localeFilter = language === 'English' ? 'en_US' : 'pt_BR';
        listsForCurrentSubject = allForSubject.filter(list => {
            const locale = (list.request_context.locale || '').trim();
            return locale === localeFilter;
        });
    }
    listKeys = listsForCurrentSubject.map((_, i) => i);
    currentListIndex = 0;

    if (listsForCurrentSubject.length === 0) {
        alert(`No lists found for ${subject} in ${language === 'BOTH' ? 'both languages' : language}.`);
        return;
    }

    saveListEvaluatorState();
    document.getElementById('selectionPage').style.display = 'none';
    document.getElementById('evaluatorPage').style.display = 'block';
    loadListByIndex(0);

    const selectedSubjectDisplay = document.getElementById('selectedSubjectDisplay');
    const selectedLanguageDisplay = document.getElementById('selectedLanguageDisplay');
    if (selectedSubjectDisplay) selectedSubjectDisplay.textContent = subject;
    if (selectedLanguageDisplay && languageSelect) {
        selectedLanguageDisplay.textContent = languageSelect.options[languageSelect.selectedIndex].text;
    }
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('evaluatorInterface').style.display = 'block';
}

function backToSelection() {
    saveListEvaluatorState({ page: 'selection' });
    document.getElementById('evaluatorPage').style.display = 'none';
    document.getElementById('selectionPage').style.display = 'flex';
}

function saveListEvaluatorState(overrides) {
    try {
        const userNameInput = document.getElementById('userNameInput');
        const subjectSelect = document.getElementById('subjectSelect');
        const languageSelect = document.getElementById('languageSelect');
        const onEvaluatorPage = document.getElementById('evaluatorPage').style.display !== 'none';
        const state = {
            page: (overrides && overrides.page) || (onEvaluatorPage ? 'evaluator' : 'selection'),
            userName: userNameInput ? userNameInput.value.trim() : '',
            subject: selectedSubject || (subjectSelect ? subjectSelect.value : ''),
            language: selectedLanguage || (languageSelect ? languageSelect.value : 'BOTH'),
            currentListIndex: currentListIndex
        };
        if (overrides) Object.assign(state, overrides);
        localStorage.setItem(LIST_EVALUATOR_STATE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('Could not save list evaluator state:', e);
    }
}

function tryRestoreListEvaluatorState() {
    try {
        const saved = localStorage.getItem(LIST_EVALUATOR_STATE_KEY);
        if (!saved) return;
        const state = JSON.parse(saved);
        if (!state.subject || !listsBySubject[state.subject]) return;

        const userNameInput = document.getElementById('userNameInput');
        const subjectSelect = document.getElementById('subjectSelect');
        const languageSelect = document.getElementById('languageSelect');
        if (userNameInput && state.userName) userNameInput.value = state.userName;
        if (subjectSelect) subjectSelect.value = state.subject;
        if (languageSelect && state.language) languageSelect.value = state.language;

        selectedSubject = state.subject;
        selectedLanguage = state.language || 'BOTH';
        const allForSubject = listsBySubject[selectedSubject];
        if (selectedLanguage === 'BOTH') {
            listsForCurrentSubject = allForSubject;
        } else {
            const localeFilter = selectedLanguage === 'English' ? 'en_US' : 'pt_BR';
            listsForCurrentSubject = allForSubject.filter(list => {
                const locale = (list.request_context.locale || '').trim();
                return locale === localeFilter;
            });
        }
        listKeys = listsForCurrentSubject.map((_, i) => i);
        currentListIndex = Math.min(state.currentListIndex || 0, Math.max(0, listsForCurrentSubject.length - 1));

        if (state.page === 'evaluator' && listsForCurrentSubject.length > 0) {
            document.getElementById('selectionPage').style.display = 'none';
            document.getElementById('evaluatorPage').style.display = 'block';
            const selectedSubjectDisplay = document.getElementById('selectedSubjectDisplay');
            const selectedLanguageDisplay = document.getElementById('selectedLanguageDisplay');
            if (selectedSubjectDisplay) selectedSubjectDisplay.textContent = selectedSubject;
            if (selectedLanguageDisplay && languageSelect) {
                selectedLanguageDisplay.textContent = languageSelect.options[languageSelect.selectedIndex].text;
            }
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('evaluatorInterface').style.display = 'block';
            loadListByIndex(currentListIndex);
        } else {
            validateSelection();
        }
    } catch (e) {
        console.warn('Could not restore list evaluator state:', e);
    }
}

function loadJsonFile() {
    const urlParams = new URLSearchParams(window.location.search);
    const jsonFile = urlParams.get('json') || 'list_of_questions_to_test_v3.json';

    fetch(jsonFile)
        .then(response => {
            if (!response.ok) {
                throw new Error('Could not load JSON file');
            }
            return response.json();
        })
        .then(data => {
            const rawLists = data.question_lists || [];
            if (rawLists.length === 0) {
                showSelectionError('No question lists found in JSON file.');
                return;
            }
            allQuestionLists = rawLists;
            buildListsBySubject();
            populateSubjectSelector();
            updateExportButton();
            tryRestoreListEvaluatorState();
        })
        .catch(error => {
            showSelectionError('Error loading JSON file: ' + error.message);
        });
}

function showSelectionError(message) {
    const selectionCard = document.querySelector('.selection-card');
    if (selectionCard) {
        const err = document.createElement('p');
        err.style.color = '#e74c3c';
        err.style.marginTop = '10px';
        err.textContent = message;
        selectionCard.appendChild(err);
    }
}

function normalizeQuestion(q) {
    const type = (q.type === 'multiple_choice' || q.type === 'MCQ') ? 'MCQ' : 'discursive';
    const alts = q.incorrect_alternatives || [];
    return {
        question_statement: q.question_statement || '',
        question_solution: q.question_solution || '',
        type: type,
        correct_answer: q.answer || q.correct_answer || '',
        incorrect_alternative_1: alts[0] || '',
        incorrect_alternative_2: alts[1] || '',
        incorrect_alternative_3: alts[2] || '',
        incorrect_alternative_4: alts[3] || '',
        difficulty: q.difficulty_level != null ? q.difficulty_level : (q.difficulty != null ? q.difficulty : null)
    };
}

function normalizeDiscipline(discipline) {
    if (!discipline || !discipline.trim()) return 'Unknown';
    const trimmed = discipline.trim();
    return DISCIPLINE_TRANSLATIONS_REVERSE[trimmed] || trimmed;
}

function buildListsBySubject() {
    listsBySubject = {};
    allQuestionLists.forEach(listObj => {
        const rc = listObj.request_context || {};
        const rawDiscipline = (rc.discipline || 'Unknown').trim();
        if (!rawDiscipline) return;
        const discipline = normalizeDiscipline(rawDiscipline);
        const questions = (listObj.questions || []).map(normalizeQuestion);
        const normalized = {
            list_id: listObj.list_id,
            request_context: rc,
            questions: questions
        };
        if (!listsBySubject[discipline]) {
            listsBySubject[discipline] = [];
        }
        listsBySubject[discipline].push(normalized);
    });
}

function populateSubjectSelector() {
    const subjectSelect = document.getElementById('subjectSelect');
    if (!subjectSelect) return;
    subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';

    const subjects = Object.keys(listsBySubject).sort();
    subjects.forEach(discipline => {
        const option = document.createElement('option');
        option.value = discipline;
        option.textContent = discipline;
        subjectSelect.appendChild(option);
    });

    updateListNavigation();
    validateSelection();
}

function loadListByIndex(index) {
    if (index < 0 || index >= listsForCurrentSubject.length) {
        currentList = null;
        currentQuestionList = [];
        return;
    }
    currentListIndex = index;
    currentList = listsForCurrentSubject[index];
    currentQuestionList = currentList.questions;

    extractListContext();
    listId = generateListId();

    const listHeadingEl = document.getElementById('listHeading');
    if (listHeadingEl) listHeadingEl.textContent = 'List ' + (listId || '—');

    try {
        const saved = localStorage.getItem(`listEvaluation_${listId}`);
        if (saved) {
            evaluation = JSON.parse(saved);
        } else {
            evaluation = null;
        }
    } catch (e) {
        console.warn('Could not load evaluation from localStorage:', e);
        evaluation = null;
    }

    updateListSummary();
    updateRequestDisplay();
    displayQuestionsList();
    updateListNavigation();
    loadEvaluation();
    saveListEvaluatorState();
}

function loadListByKey(selectedKey) {
    const index = typeof selectedKey === 'number' ? selectedKey : listKeys.indexOf(selectedKey);
    if (index >= 0 && index < listsForCurrentSubject.length) {
        loadListByIndex(index);
    }
}

function extractListContext() {
    if (!currentList || !currentList.request_context) return;
    const rc = currentList.request_context;
    const numMcq = currentQuestionList.filter(q => q.type === 'MCQ').length;
    const numDisc = currentQuestionList.filter(q => q.type !== 'MCQ').length;
    listContext = {
        grade: rc.grade != null ? rc.grade : 'Not specified',
        locale: rc.locale || 'Not specified',
        category: rc.category || 'Not specified',
        discipline: rc.discipline || 'Not specified',
        difficulty: rc.difficulty != null ? rc.difficulty : 'Not specified',
        num_mcq_requested: rc.num_mcq_requested != null ? rc.num_mcq_requested : 0,
        num_discursive_requested: rc.num_discursive_requested != null ? rc.num_discursive_requested : 0,
        numMultipleChoice: numMcq,
        numDiscursive: numDisc,
        teacherInput: rc.teacher_input || null,
        uploadedFiles: rc.uploaded_files ? (typeof rc.uploaded_files === 'string' ? rc.uploaded_files.split(',').map(f => f.trim()) : []) : []
    };
}

function generateListId() {
    if (!currentList || currentList.list_id == null) return null;
    return 'list_' + currentList.list_id;
}

function formatLocale(locale) {
    if (!locale) return '—';
    if (locale === 'en_US') return 'English (US)';
    if (locale === 'pt_BR') return 'Portuguese (BR)';
    return locale;
}

function formatRequestedTypes(rc) {
    if (!rc) return '—';
    const mcq = rc.num_mcq_requested != null ? rc.num_mcq_requested : 0;
    const disc = rc.num_discursive_requested != null ? rc.num_discursive_requested : 0;
    if (mcq > 0 && disc > 0) return `${mcq} MCQ, ${disc} Open-ended`;
    if (mcq > 0) return `${mcq} MCQ only`;
    if (disc > 0) return `${disc} Open-ended only`;
    return '—';
}

function updateListSummary() {
    // Summary stats removed from UI
}

function updateRequestDisplay() {
    if (!currentList || !currentList.request_context) return;
    const rc = currentList.request_context;
    const totalRequested = (rc.num_mcq_requested != null ? rc.num_mcq_requested : 0) + (rc.num_discursive_requested != null ? rc.num_discursive_requested : 0);
    const typesStr = formatRequestedTypes(rc);
    const summary = totalRequested > 0 ? (typesStr !== '—' ? `${totalRequested} questions (${typesStr})` : `${totalRequested} questions`) : '—';
    setEl('listRequestSummary', summary);
    setEl('listRequestLocale', formatLocale(rc.locale));
    setEl('listDiscipline', normalizeDiscipline(rc.discipline) || '—');
    setEl('listCategory', rc.category || '—');
    setEl('listGrade', rc.grade != null ? formatGrade(String(rc.grade)) : '—');
    setEl('listDifficulty', rc.difficulty != null ? String(rc.difficulty) : '—');
}

function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function displayQuestionsList() {
    const questionsListEl = document.getElementById('questionsList');
    questionsListEl.innerHTML = '';
    
    currentQuestionList.forEach((question, index) => {
        const questionItem = document.createElement('div');
        questionItem.className = 'question-list-item';
        questionItem.setAttribute('data-index', index);
        
        const difficulty = getDifficultyLabel(question.difficulty);
        const difficultyClass = getDifficultyClass(question.difficulty);
        
        questionItem.innerHTML = `
            <div class="question-item-header">
                <span class="question-number">${index + 1}</span>
                <span class="question-difficulty ${difficultyClass}">${difficulty}</span>
            </div>
            <div class="question-item-content">
                <div class="section">
                    <h3>Statement</h3>
                    <div class="content-box">${convertMathTags(question.question_statement || '')}</div>
                </div>
                ${question.type === 'MCQ' ? getMCQDetail(question) : ''}
                <div class="section">
                    <h3>Solution/Explanation</h3>
                    <div class="content-box">${convertMathTags(question.question_solution || '')}</div>
                </div>
            </div>
        `;
        
        questionsListEl.appendChild(questionItem);
        
        // Render LaTeX for this question
        renderMath(questionItem);
    });
}

function getDifficultyLabel(difficulty) {
    if (difficulty == null || difficulty === '') return 'N/A';
    const diff = parseInt(difficulty, 10);
    if (isNaN(diff)) return 'N/A';
    if (diff <= 300) return 'Easy';
    if (diff <= 600) return 'Medium';
    return 'Hard';
}

function getDifficultyClass(difficulty) {
    if (difficulty == null || difficulty === '') return '';
    const diff = parseInt(difficulty, 10);
    if (isNaN(diff)) return '';
    if (diff <= 300) return 'easy';
    if (diff <= 600) return 'medium';
    return 'hard';
}

function getMCQDetail(question) {
    let html = `
        <div class="section" id="mcqOptionsSection">
            <h3>Answer Options</h3>
            <div id="mcqOptions" class="content-box">
    `;
    
    // Correct answer
    if (question.correct_answer) {
        html += `
            <div class="mcq-option correct">
                <strong>✓ Correct:</strong> ${convertMathTags(question.correct_answer)}
            </div>
        `;
    }
    
    // Incorrect alternatives
    const alternatives = [
        question.incorrect_alternative_1,
        question.incorrect_alternative_2,
        question.incorrect_alternative_3,
        question.incorrect_alternative_4
    ].filter(alt => alt && alt.trim() !== '');
    
    alternatives.forEach(alt => {
        html += `
            <div class="mcq-option incorrect">
                <strong>✗ Incorrect:</strong> ${convertMathTags(alt)}
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

function updateListNavigation() {
    const questionCounter = document.getElementById('questionCounter');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (!questionCounter || !prevBtn || !nextBtn) return;
    const total = listsForCurrentSubject.length;
    if (total === 0) {
        questionCounter.textContent = 'No lists available';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }
    const idx = Math.max(0, Math.min(currentListIndex, total - 1));
    questionCounter.textContent = `List ${idx + 1} of ${total}`;
    prevBtn.disabled = currentListIndex <= 0;
    nextBtn.disabled = currentListIndex >= total - 1;
}

function selectQuestion(index) {
    // Just highlight the question, no navigation needed
    document.querySelectorAll('.question-list-item').forEach((item, idx) => {
        if (idx === index) {
            item.classList.add('active');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            item.classList.remove('active');
        }
    });
}

function navigateQuestion(direction) {
    const newListIndex = currentListIndex + direction;
    if (newListIndex >= 0 && newListIndex < listsForCurrentSubject.length) {
        loadListByIndex(newListIndex);
    }
}

function convertMathTags(text) {
    if (!text) return '';
    // LaTeX blocks first (so ** inside LaTeX is not converted to bold)
    text = text.replace(/\{\{MATH\}\}(.*?)\{\{\/MATH\}\}/gs, (match, content) => {
        return `\\(${content.trim()}\\)`;
    });
    text = text.replace(/\{\{MATHBLOCK\}\}(.*?)\{\{\/MATHBLOCK\}\}/gs, (match, content) => {
        return `\\[${content.trim()}\\]`;
    });
    // Markdown-style bold: ** ... ** -> <strong>...</strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\n/g, '<br>');
    return text;
}

function renderMath(element) {
    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(element, {
            delimiters: [
                {left: '\\[', right: '\\]', display: true},
                {left: '\\(', right: '\\)', display: false}
            ],
            throwOnError: false
        });
    }
}

function truncateText(text, maxLength) {
    if (!text) return 'No statement';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatGrade(grade) {
    if (!grade) return 'N/A';
    const gradeNum = parseInt(grade);
    if (gradeNum === 0) return 'Kindergarten';
    if (gradeNum >= 10 && gradeNum <= 90) return `Grade ${gradeNum / 10}`;
    if (gradeNum >= 100 && gradeNum <= 120) return `Grade ${gradeNum / 10}`;
    if (gradeNum === 130) return 'University/College';
    return grade;
}

function loadEvaluation() {
    if (!listId || !evaluation) {
        // Clear all scores using actual form field names
        LIST_EVALUATOR_ALL_FIELDS.forEach(field => clearButtonState(field));
        document.getElementById('summary').value = '';
        updateScore();
        return;
    }
    
    // Load from evaluation.scores (field -> value) or legacy criterion_scores
    const scores = evaluation.scores || {};
    LIST_EVALUATOR_ALL_FIELDS.forEach(field => {
        const value = scores[field];
        if (value !== undefined && value !== null && value !== '') {
            setButtonState(field, String(value));
        } else {
            clearButtonState(field);
        }
    });
    
    document.getElementById('summary').value = evaluation.summary || '';
    updateScore();
}

function setButtonState(field, value) {
    if (!value) {
        clearButtonState(field);
        return;
    }
    
    const buttons = document.querySelectorAll(`.btn-score[data-field="${field}"]`);
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-value') === value) {
            btn.classList.add('active');
        }
    });
}

function clearButtonState(field) {
    const buttons = document.querySelectorAll(`.btn-score[data-field="${field}"]`);
    buttons.forEach(btn => btn.classList.remove('active'));
}

function getButtonValue(field) {
    const activeButton = document.querySelector(`.btn-score[data-field="${field}"].active`);
    return activeButton ? activeButton.getAttribute('data-value') : '';
}

function updateScore() {
    let totalScore = 0;

    // Teacher Input Compliance sub-scores (0-1 each, total 0-3)
    const complianceLang = getButtonValue('teacherInputCompliance_language');
    const complianceCount = getButtonValue('teacherInputCompliance_count');
    const complianceType = getButtonValue('teacherInputCompliance_type');
    const complianceTotal = [complianceLang, complianceCount, complianceType].reduce((sum, v) => sum + (v !== '' ? parseInt(v, 10) : 0), 0);
    totalScore += complianceTotal;

    LIST_EVALUATOR_CRITERIA_FIELDS.forEach(field => {
        const value = getButtonValue(field);
        if (value !== '') totalScore += parseInt(value, 10);
    });

    document.getElementById('totalScore').textContent = totalScore;
    const percentage = ((totalScore / LIST_EVALUATOR_MAX_SCORE) * 100).toFixed(1);
    document.getElementById('percentageScore').textContent = percentage;

    const allScored = getMissingCriteriaWithinList().length === 0;
    const statusEl = document.getElementById('statusDisplay');
    if (allScored) {
        statusEl.className = 'status-display pass';
        statusEl.textContent = 'Evaluation complete';
    } else {
        statusEl.className = 'status-display';
        statusEl.textContent = 'Incomplete - Please score all criteria';
    }
}

/** Returns human-readable names of criteria that are not yet scored (for warning when saving with skips). */
function getMissingCriteriaWithinList() {
    const missing = [];
    const seenLabels = new Set();
    LIST_EVALUATOR_COMPLIANCE_FIELDS.forEach(field => {
        if (getButtonValue(field) === '') {
            const label = LIST_EVALUATOR_FIELD_LABELS[field];
            if (!seenLabels.has(label)) {
                seenLabels.add(label);
                missing.push(label);
            }
        }
    });
    LIST_EVALUATOR_CRITERIA_FIELDS.forEach(field => {
        if (getButtonValue(field) === '') {
            missing.push(LIST_EVALUATOR_FIELD_LABELS[field]);
        }
    });
    return missing;
}

function saveEvaluation() {
    if (!listId) {
        alert('No list selected');
        return;
    }
    
    const missing = getMissingCriteriaWithinList();
    if (missing.length > 0) {
        alert('Please complete the following fields before continuing:\n\n' + missing.join('\n'));
        return;
    }
    
    const scores = {};
    LIST_EVALUATOR_ALL_FIELDS.forEach(field => {
        const value = getButtonValue(field);
        scores[field] = value !== '' ? value : null;
    });
    
    let totalScore = 0;
    LIST_EVALUATOR_COMPLIANCE_FIELDS.forEach(f => {
        const v = scores[f];
        if (v !== null) totalScore += parseInt(v, 10);
    });
    LIST_EVALUATOR_CRITERIA_FIELDS.forEach(f => {
        const v = scores[f];
        if (v !== null) totalScore += parseInt(v, 10);
    });
    
    const summary = document.getElementById('summary').value;
    const percentage = (totalScore / LIST_EVALUATOR_MAX_SCORE) * 100;
    
    const criterionLabels = [
        { field: 'teacherInputCompliance', label: 'Teacher Input Compliance', score: [scores.teacherInputCompliance_language, scores.teacherInputCompliance_count, scores.teacherInputCompliance_type].reduce((s, v) => s + (v != null ? parseInt(v, 10) : 0), 0), maxScore: 3 },
        { field: 'topicMaterialsAlignment', label: 'Topic & Materials Alignment', score: scores.topicMaterialsAlignment != null ? parseInt(scores.topicMaterialsAlignment, 10) : null, maxScore: 2 },
        { field: 'gradeLevelDifficulty', label: 'Grade-Level & Difficulty Alignment', score: scores.gradeLevelDifficulty != null ? parseInt(scores.gradeLevelDifficulty, 10) : null, maxScore: 2 },
        { field: 'uniqueness', label: 'Uniqueness & Diversity', score: scores.uniqueness != null ? parseInt(scores.uniqueness, 10) : null, maxScore: 2 },
        { field: 'topicCoverage', label: 'Topic Coverage', score: scores.topicCoverage != null ? parseInt(scores.topicCoverage, 10) : null, maxScore: 2 },
        { field: 'cognitiveDiversity', label: 'Cognitive Level Diversity', score: scores.cognitiveDiversity != null ? parseInt(scores.cognitiveDiversity, 10) : null, maxScore: 2 },
        { field: 'difficultyProgression', label: 'Difficulty Progression', score: scores.difficultyProgression != null ? parseInt(scores.difficultyProgression, 10) : null, maxScore: 2 },
        { field: 'answerLeakage', label: 'Answer Leakage Prevention', score: scores.answerLeakage != null ? parseInt(scores.answerLeakage, 10) : null, maxScore: 2 }
    ];
    const criterionScoresArray = criterionLabels.map(({ label, score, maxScore }) => ({
        criterion: label,
        score: score,
        justification: '',
        maxScore
    }));
    
    evaluation = {
        list_id: listId,
        list_context: listContext,
        scores,
        criterion_scores: criterionScoresArray,
        total_score: totalScore,
        max_possible_score: LIST_EVALUATOR_MAX_SCORE,
        percentage: percentage,
        summary: summary || null,
        evaluated_at: new Date().toISOString()
    };
    
    saveToLocalStorage();
    updateExportButton();
    
    const btn = document.getElementById('saveEvaluationBtn');
    const originalText = btn.textContent;
    btn.textContent = '✓ Saved!';
    btn.style.background = '#008F87';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        if (currentListIndex < listsForCurrentSubject.length - 1) {
            navigateQuestion(1);
        }
    }, 800);
}

/** Collect all list evaluations from localStorage (across all subjects). */
function getAllListEvaluations() {
    const out = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || key === LIST_EVALUATOR_STATE_KEY || !key.startsWith('listEvaluation_')) continue;
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            try {
                const ev = JSON.parse(raw);
                if (ev && typeof ev === 'object') {
                    if (ev.list_id == null) ev.list_id = key.replace('listEvaluation_', '');
                    out.push(ev);
                }
            } catch (_) {}
        }
    } catch (e) {
        console.warn('Could not read list evaluations from localStorage:', e);
    }
    return out.sort((a, b) => {
        const aId = a.list_id != null ? String(a.list_id) : '';
        const bId = b.list_id != null ? String(b.list_id) : '';
        return aId < bId ? -1 : aId > bId ? 1 : 0;
    });
}

function exportToYaml() {
    const all = getAllListEvaluations();
    if (all.length === 0) {
        alert('No evaluations to export.');
        return;
    }
    
    const escapeCsv = (v) => {
        if (v == null) return '';
        const s = String(v);
        if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
    };
    const rc = (ev) => (ev.list_context || {});
    const scores = (ev) => ev.scores || {};
    const headers = [
        'list_id', 'discipline', 'grade', 'difficulty', 'total_score', 'max_possible_score', 'percentage',
        'compliance_correct_language', 'compliance_correct_count', 'compliance_correct_type',
        'Teacher Input Compliance (0-3)', 'Topic & Materials Alignment', 'Grade-Level & Difficulty Alignment',
        'Uniqueness & Diversity', 'Topic Coverage', 'Cognitive Level Diversity', 'Difficulty Progression', 'Answer Leakage Prevention',
        'summary', 'evaluated_at'
    ];
    const criterionTitles = [
        'Teacher Input Compliance', 'Topic & Materials Alignment', 'Grade-Level & Difficulty Alignment',
        'Uniqueness & Diversity', 'Topic Coverage', 'Cognitive Level Diversity', 'Difficulty Progression', 'Answer Leakage Prevention'
    ];
    const rows = [headers.join(',')];
    all.forEach(ev => {
        const ctx = rc(ev);
        const s = scores(ev);
        const scoresByCriterion = {};
        (ev.criterion_scores || []).forEach(c => { scoresByCriterion[c.criterion] = c.score; });
        const complianceLang = s.teacherInputCompliance_language != null ? String(s.teacherInputCompliance_language) : '';
        const complianceCount = s.teacherInputCompliance_count != null ? String(s.teacherInputCompliance_count) : '';
        const complianceType = s.teacherInputCompliance_type != null ? String(s.teacherInputCompliance_type) : '';
        const row = [
            escapeCsv(ev.list_id),
            escapeCsv(ctx.discipline),
            escapeCsv(ctx.grade),
            escapeCsv(ctx.difficulty),
            ev.total_score != null ? ev.total_score : '',
            ev.max_possible_score != null ? ev.max_possible_score : '',
            ev.percentage != null ? ev.percentage : '',
            complianceLang === '' ? '' : (complianceLang === '1' ? '1' : '0'),
            complianceCount === '' ? '' : (complianceCount === '1' ? '1' : '0'),
            complianceType === '' ? '' : (complianceType === '1' ? '1' : '0'),
            scoresByCriterion['Teacher Input Compliance'] != null ? scoresByCriterion['Teacher Input Compliance'] : '',
            ...criterionTitles.slice(1).map(t => escapeCsv(scoresByCriterion[t])),
            escapeCsv(ev.summary),
            escapeCsv(ev.evaluated_at)
        ];
        rows.push(row.join(','));
    });
    const csvString = rows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `list_evaluations_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function saveToLocalStorage() {
    try {
        if (listId && evaluation) {
            localStorage.setItem(`listEvaluation_${listId}`, JSON.stringify(evaluation));
        }
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }
}

function toggleCriteria() {
    const panel = document.getElementById('criteriaPanel');
    const btn = document.getElementById('toggleCriteriaBtn');
    if (!panel || !btn) return;
    const isVisible = panel.style.display !== 'none';
    
    if (isVisible) {
        panel.style.display = 'none';
        btn.textContent = 'Show Criteria';
    } else {
        panel.style.display = 'block';
        btn.textContent = 'Hide Criteria';
    }
}

function loadCriteriaContent() {
    const criteriaContent = document.getElementById('criteriaContent');
    if (!criteriaContent) return;
    
    fetch('__list eval original_new.md')
        .then(response => {
            if (!response.ok) throw new Error('Could not load criteria file');
            return response.text();
        })
        .then(text => {
            const html = convertMarkdownToHtml(text);
            criteriaContent.innerHTML = html;
        })
        .catch(error => {
            criteriaContent.innerHTML = getEmbeddedCriteria();
        });
}

function convertMarkdownToHtml(markdown) {
    let html = markdown;
    html = html.replace(/^### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/^---$/gim, '<hr>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>(<h[2-4]>)/g, '$1');
    html = html.replace(/(<\/h[2-4]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    return html;
}

function getEmbeddedCriteria() {
    return '<h2>RUBRIC FOR LIST OF QUESTIONS (8 CRITERIA)</h2><p>See the markdown file for full criteria details.</p>';
}

function showCriterionInfo(criterionKey) {
    const criterion = criteria[criterionKey];
    if (!criterion) return;
    
    const modal = document.getElementById('infoModal');
    const title = document.getElementById('infoModalTitle');
    const body = document.getElementById('infoModalBody');
    
    title.textContent = criterion.title;
    
    let html = `<p><strong>Category:</strong> ${criterion.category}</p>`;
    html += `<p><strong>Question:</strong> ${criterion.question}</p>`;
    
    if (criterion.subItems) {
        html += `<h4>Evaluate each requirement independently (1 point each):</h4><ul>`;
        criterion.subItems.forEach(item => {
            html += `<li>${item}</li>`;
        });
        html += `</ul><p><strong>${criterion.scoreNote}</strong></p>`;
    } else if (criterion.scores) {
        html += `<h4>Scoring guide:</h4><ul>`;
        Object.keys(criterion.scores).sort().forEach(score => {
            html += `<li><strong>${score}:</strong> ${criterion.scores[score]}</li>`;
        });
        html += `</ul>`;
    }
    
    body.innerHTML = html;
    modal.style.display = 'flex';
}

function updateExportButton() {
    const hasAnyEvaluation = getAllListEvaluations().length > 0;
    const btn = document.getElementById('exportCsvBtn');
    if (btn) btn.disabled = !hasAnyEvaluation;
}

function handleKeyboardInput(e) {
    // Only handle if evaluator page is visible (same as evaluator.js)
    const evaluatorPage = document.getElementById('evaluatorPage');
    if (!evaluatorPage || evaluatorPage.style.display === 'none') {
        return;
    }
    
    const evaluatorInterface = document.getElementById('evaluatorInterface');
    if (!evaluatorInterface || evaluatorInterface.style.display === 'none') {
        return;
    }
    
    // Don't handle if user is typing in an input field (same as evaluator.js)
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
    }
    
    const key = e.key;
    if (key !== '0' && key !== '1' && key !== '2') {
        return;
    }
    
    e.preventDefault();
    
    // Find first missing field in form order (compliance = Yes/No: 0 or 1 only; criteria = 0–2)
    const complianceFields = LIST_EVALUATOR_COMPLIANCE_FIELDS;
    const criteriaFields = LIST_EVALUATOR_CRITERIA_FIELDS;
    
    let targetField = null;
    let targetValue = null;
    
    for (const field of complianceFields) {
        if (getButtonValue(field) === '') {
            targetField = field;
            if (key === '0') targetValue = '0';
            else if (key === '1') targetValue = '1';
            else return;
            break;
        }
    }
    
    if (!targetField) {
        for (const field of criteriaFields) {
            if (getButtonValue(field) === '') {
                targetField = field;
                targetValue = key;
                break;
            }
        }
    }
    
    if (targetField && targetValue !== null) {
        setButtonState(targetField, targetValue);
        updateScore();
    }
}
