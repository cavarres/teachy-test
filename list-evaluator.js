// Global state
let allQuestionLists = []; // Array of question lists from JSON
let filteredQuestionLists = []; // Filtered lists based on selection
let listKeys = []; // Array of list keys in order
let currentListIndex = 0; // Index in listKeys array
let currentListKey = null;
let currentQuestionList = [];
let currentListData = null; // The full list object with list_id and request_context
let listContext = {};
let evaluation = null;
let listId = null;
let userName = null;
let selectedSubject = null;
let selectedLanguage = null;

// Discipline name mapping (Portuguese -> English) for normalization
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

// Criteria definitions (same as before)
const criteria = {
    gradeLevel: {
        title: "Grade-Level Appropriateness",
        category: "Pedagogical Fundamentals",
        question: "Is the entire list consistently appropriate for the target grade level in vocabulary, complexity, and cognitive expectations?",
        scores: {
            0: "Multiple questions have vocabulary or complexity clearly too advanced or too simple; language is not grade-appropriate",
            1: "Mostly appropriate with some issues (occasional vocabulary or concepts slightly off-level)",
            2: "Uniformly appropriate vocabulary, sentence complexity, and cognitive expectations for the target grade; language is accessible and suitable"
        }
    },
    teacherInput: {
        title: "Teacher Input Alignment",
        category: "Pedagogical Fundamentals",
        question: "Does the list accurately reflect what the teacher requested and any provided materials?",
        scores: {
            0: "Ignores teacher specifications (topic, grade, difficulty preferences, or uploaded materials not reflected)",
            1: "Partially follows teacher input but misses some key specifications or materials",
            2: "Fully aligned with all teacher inputs: topic, grade, difficulty preferences, uploaded materials, and specified constraints"
        }
    },
    difficultyProgression: {
        title: "Difficulty Progression",
        category: "Pedagogical Fundamentals",
        question: "Does the list progress from easier questions at the beginning to harder questions at the end?",
        scores: {
            0: "No progression; difficult questions at start with easy at end, or difficulty jumps erratically throughout",
            1: "Some progression visible but inconsistent (rough ordering with some difficulty jumps)",
            2: "Clear easier-to-harder progression throughout the assessment; students build confidence as they work"
        }
    },
    uniqueness: {
        title: "Uniqueness & Diversity",
        category: "Content Quality",
        question: "Are all questions distinct, non-repetitive, and varied in their approach?",
        scores: {
            0: "Duplicate or near-identical questions exist (same concept tested multiple times with only superficial changes)",
            1: "All questions are unique but some feel similar or lack variety in approach",
            2: "All questions assess distinct knowledge/skills with no redundancy; questions feel fresh and varied"
        }
    },
    topicCoverage: {
        title: "Topic Coverage",
        category: "Content Quality",
        question: "Does the list comprehensively cover the relevant content domain as specified by the teacher?",
        scores: {
            0: "Narrow focus with major subtopics or concepts missing entirely; doesn't reflect the teacher's input",
            1: "Partial coverage with some gaps; key areas present but some important subtopics underrepresented",
            2: "Comprehensive representation of all key subtopics appropriate for the grade level, subject, and teacher specifications"
        }
    },
    cognitiveDiversity: {
        title: "Cognitive Level Diversity",
        category: "Content Quality",
        question: "Does the list include appropriate variety across different thinking levels?",
        scores: {
            0: "Only recall/recognition questions with no higher-order thinking",
            1: "Some higher-order thinking questions but predominantly lower-level cognitive demand",
            2: "Balanced distribution across thinking levels (Remember/Understand/Apply/Analyze/Evaluate/Create) appropriate for the grade and assessment purpose"
        }
    },
    questionTypeBalance: {
        title: "Question Type Balance",
        category: "Assessment Design",
        question: "Is the mix of question types appropriate for the assessment goals?",
        scores: {
            0: "All same type when variety needed, OR types don't match assessment purpose",
            1: "Reasonable mix but suboptimal (some variety but ratios could be better aligned with goals)",
            2: "Optimal mix of multiple-choice and discursive questions for the stated assessment goals and cognitive levels being measured"
        }
    },
    answerLeakage: {
        title: "Answer Leakage Prevention",
        category: "Assessment Design",
        question: "Does the list avoid questions that inadvertently reveal answers to other questions?",
        scores: {
            0: "Clear answer leakage exists (later questions or answer choices reveal correct answers to earlier questions)",
            1: "Minor leakage risks present (some questions provide hints but don't fully reveal answers)",
            2: "No cross-question answer hints; each question can be answered independently"
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    setupEventListeners();
    updateExportButton();
    loadJsonFile();
});

function setupEventListeners() {
    // Selection page listeners
    document.getElementById('userNameInput').addEventListener('input', validateSelection);
    document.getElementById('subjectSelect').addEventListener('change', validateSelection);
    document.getElementById('languageSelect').addEventListener('change', validateSelection);
    document.getElementById('startEvaluatorBtn').addEventListener('click', startEvaluator);
    
    // Evaluator page listeners
    document.getElementById('backToSelectionBtn').addEventListener('click', backToSelection);
    document.getElementById('listSelector').addEventListener('change', onListSelect);
    document.getElementById('exportYamlBtn').addEventListener('click', exportToYaml);
    document.getElementById('toggleCriteriaBtn').addEventListener('click', toggleCriteria);
    document.getElementById('closeCriteriaBtn').addEventListener('click', toggleCriteria);
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
    
    loadCriteriaContent();
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
        .then(jsonData => {
            // Load question_lists from the JSON
            allQuestionLists = (jsonData.question_lists || []).filter(list => 
                list.questions && Array.isArray(list.questions) && list.questions.length > 0
            );
            
            if (allQuestionLists.length === 0) {
                document.getElementById('selectionPage').innerHTML = '<p style="color: #e74c3c;">No valid question lists found in JSON file.</p>';
                return;
            }
            
            // Populate subject dropdown
            populateSelectionDropdowns();
            
            // Try to restore evaluator state after JSON loads
            tryRestoreEvaluatorState();
        })
        .catch(error => {
            document.getElementById('loadingMessage').innerHTML = '<p style="color: #e74c3c;">Error loading JSON file: ' + error.message + '</p>';
        });
}

function transformQuestion(q, index) {
    // Get original discipline name
    const originalDiscipline = q.disciplineName || q.request_context?.discipline || '';
    // Normalize to English discipline name
    const normalizedDiscipline = DISCIPLINE_TRANSLATIONS_REVERSE[originalDiscipline] || originalDiscipline;
    
    // Map JSON fields to expected format
    const mappedQuestion = {
        question_id: `q_${index + 1}`, // Generate question_id if not present
        question_statement: q.question_statement || '',
        question_solution: q.question_solution || '',
        discipline: normalizedDiscipline, // Use normalized English name
        discipline_original: originalDiscipline, // Keep original for display if needed
        category: q.categoryName || q.request_context?.category || '',
        grade: q.grade || q.request_context?.grade || '',
        difficulty: q.difficulty || q.difficulty_level || '',
        type: q.type === 'multiple_choice' ? 'MCQ' : (q.type || 'discursive'),
        locale: q.request_context?.locale || '',
        language: q.request_context?.locale === 'pt_BR' ? 'Portuguese' : (q.request_context?.locale === 'en_US' ? 'English' : ''),
        // Handle answer and alternatives
        correct_answer: q.answer || '',
        incorrect_alternative_1: q.incorrect_alternatives && q.incorrect_alternatives[0] ? q.incorrect_alternatives[0] : '',
        incorrect_alternative_2: q.incorrect_alternatives && q.incorrect_alternatives[1] ? q.incorrect_alternatives[1] : '',
        incorrect_alternative_3: q.incorrect_alternatives && q.incorrect_alternatives[2] ? q.incorrect_alternatives[2] : '',
        incorrect_alternative_4: q.incorrect_alternatives && q.incorrect_alternatives[3] ? q.incorrect_alternatives[3] : ''
    };
    return mappedQuestion;
}

function populateSelectionDropdowns() {
    // Get unique subjects from all question lists
    const subjects = new Set();
    
    allQuestionLists.forEach(list => {
        const reqCtx = list.request_context || {};
        const discipline = reqCtx.discipline || '';
        if (discipline && discipline.trim() !== '') {
            // Normalize to English discipline name
            const normalizedDiscipline = DISCIPLINE_TRANSLATIONS_REVERSE[discipline.trim()] || discipline.trim();
            subjects.add(normalizedDiscipline);
        }
    });
    
    // Populate subject dropdown
    const subjectSelect = document.getElementById('subjectSelect');
    const sortedSubjects = Array.from(subjects).sort();
    
    // Add "All Subjects" option first
    const allOption = document.createElement('option');
    allOption.value = 'ALL';
    allOption.textContent = 'All Subjects';
    subjectSelect.appendChild(allOption);
    
    // Add individual subjects
    sortedSubjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectSelect.appendChild(option);
    });
}

function validateSelection() {
    const userNameInput = document.getElementById('userNameInput');
    const subjectSelect = document.getElementById('subjectSelect');
    const languageSelect = document.getElementById('languageSelect');
    const startBtn = document.getElementById('startEvaluatorBtn');
    
    if (userNameInput.value.trim() && subjectSelect.value && languageSelect.value) {
        startBtn.disabled = false;
    } else {
        startBtn.disabled = true;
    }
}

function startEvaluator() {
    userName = document.getElementById('userNameInput').value.trim();
    selectedSubject = document.getElementById('subjectSelect').value;
    selectedLanguage = document.getElementById('languageSelect').value;
    
    if (!userName) {
        alert('Please enter your name.');
        return;
    }
    
    if (!selectedSubject) {
        alert('Please select a subject or "All Subjects".');
        return;
    }
    
    if (!selectedLanguage) {
        alert('Please select a language.');
        return;
    }
    
    // Filter lists based on subject
    if (selectedSubject === 'ALL') {
        filteredQuestionLists = allQuestionLists;
    } else {
        filteredQuestionLists = allQuestionLists.filter(list => {
            const reqCtx = list.request_context || {};
            const discipline = reqCtx.discipline || '';
            const normalizedDiscipline = DISCIPLINE_TRANSLATIONS_REVERSE[discipline.trim()] || discipline.trim();
            return normalizedDiscipline === selectedSubject;
        });
    }
    
    // Filter by language (locale)
    if (selectedLanguage !== 'BOTH') {
        filteredQuestionLists = filteredQuestionLists.filter(list => {
            const reqCtx = list.request_context || {};
            const locale = (reqCtx.locale || '').trim();
            if (selectedLanguage === 'English') {
                return locale === 'en_US';
            } else if (selectedLanguage === 'Portuguese') {
                return locale === 'pt_BR';
            }
            return false;
        });
    }
    
    if (filteredQuestionLists.length === 0) {
        alert('No question lists found matching your selection. Please try different criteria.');
        return;
    }
    
    // Save selection to localStorage
    saveToLocalStorage();
    
    // Hide selection page and show evaluator page
    document.getElementById('selectionPage').style.display = 'none';
    document.getElementById('evaluatorPage').style.display = 'block';
    
    // Update display
    document.getElementById('selectedSubjectDisplay').textContent = selectedSubject === 'ALL' ? 'All Subjects' : selectedSubject;
    document.getElementById('selectedLanguageDisplay').textContent = selectedLanguage;
    
    // Populate list selector with filtered lists
    populateListSelector();
    
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('evaluatorInterface').style.display = 'block';
}

function backToSelection() {
    // Clear the saved selection state
    clearSelectionState();
    
    // Show selection page and hide evaluator page
    document.getElementById('selectionPage').style.display = 'block';
    document.getElementById('evaluatorPage').style.display = 'none';
    
    // Reset form
    const userNameInput = document.getElementById('userNameInput');
    if (userNameInput) userNameInput.value = userName || '';
    const subjectSelect = document.getElementById('subjectSelect');
    if (subjectSelect && selectedSubject) {
        subjectSelect.value = selectedSubject;
    }
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect && selectedLanguage) {
        languageSelect.value = selectedLanguage;
    }
    
    // Validate selection
    validateSelection();
}

function populateListSelector() {
    const selector = document.getElementById('listSelector');
    selector.innerHTML = '<option value="">Select a list...</option>';
    
    // Store list indices in array for navigation
    listKeys = filteredQuestionLists.map((list, index) => index);
    
    filteredQuestionLists.forEach((list, index) => {
        const reqCtx = list.request_context || {};
        const discipline = DISCIPLINE_TRANSLATIONS_REVERSE[reqCtx.discipline] || reqCtx.discipline || 'Unknown';
        const grade = formatGrade(reqCtx.grade || '');
        const category = reqCtx.category || 'No category';
        const numQuestions = list.questions ? list.questions.length : 0;
        
        const option = document.createElement('option');
        option.value = index.toString();
        option.textContent = `List ${list.list_id || index + 1}: ${discipline} - ${grade} - ${category} (${numQuestions} questions)`;
        selector.appendChild(option);
    });
    
    // Update navigation display
    updateListNavigation();
}

function onListSelect() {
    const selector = document.getElementById('listSelector');
    const selectedIndex = parseInt(selector.value);
    
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= filteredQuestionLists.length) {
        currentListKey = null;
        currentListIndex = -1;
        currentQuestionList = [];
        currentListData = null;
        return;
    }
    
    // Get the selected list from filtered lists
    currentListIndex = selectedIndex;
    currentListKey = selectedIndex.toString();
    currentListData = filteredQuestionLists[selectedIndex];
    
    // Transform questions to match expected format
    currentQuestionList = (currentListData.questions || []).map((q, qIndex) => transformQuestion(q, qIndex))
        .filter(q => q.question_statement && q.question_statement.trim() !== '')
        .sort((a, b) => {
            // Sort by difficulty if available
            const diffA = parseInt(a.difficulty) || 0;
            const diffB = parseInt(b.difficulty) || 0;
            return diffA - diffB;
        });
    
    // Extract list context from request_context
    extractListContext();
    
    // Generate list ID
    listId = generateListId();
    
    // Load existing evaluation
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
    
    // Update UI
    updateListSummary();
    displayQuestionsList();
    updateListNavigation();
    loadEvaluation();
}

function extractListContext() {
    if (!currentListData || !currentListData.request_context) return;
    
    const reqCtx = currentListData.request_context;
    listContext = {
        grade: reqCtx.grade || 'Not specified',
        locale: reqCtx.locale || 'Not specified',
        category: reqCtx.category || 'Not specified',
        discipline: DISCIPLINE_TRANSLATIONS_REVERSE[reqCtx.discipline] || reqCtx.discipline || 'Not specified',
        difficulty: reqCtx.difficulty || 'Not specified',
        numMultipleChoice: reqCtx.num_mcq_requested || currentQuestionList.filter(q => q.type === 'MCQ').length,
        numDiscursive: reqCtx.num_discursive_requested || currentQuestionList.filter(q => q.type !== 'MCQ').length,
        list_id: currentListData.list_id || null,
        teacherInput: null, // Not in this data structure
        uploadedFiles: [] // Not in this data structure
    };
}

function generateListId() {
    if (!currentListData) return null;
    const listIdNum = currentListData.list_id || currentListIndex;
    const hash = `list_${listIdNum}_${currentQuestionList.length}`;
    return 'list_' + btoa(hash).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
}

function updateListSummary() {
    document.getElementById('listTotalQuestions').textContent = currentQuestionList.length;
    // Calculate total points (assuming 1 point per question, or use difficulty)
    const totalPoints = currentQuestionList.length; // You can adjust this based on actual point values
    document.getElementById('listTotalPoints').textContent = totalPoints;
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
    if (!difficulty) return 'N/A';
    const diff = parseInt(difficulty);
    if (diff <= 300) return 'Easy';
    if (diff <= 600) return 'Medium';
    return 'Hard';
}

function getDifficultyClass(difficulty) {
    if (!difficulty) return '';
    const diff = parseInt(difficulty);
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
    if (filteredQuestionLists.length === 0) {
        document.getElementById('questionCounter').textContent = 'No lists available';
        document.getElementById('prevBtn').disabled = true;
        document.getElementById('nextBtn').disabled = true;
        return;
    }
    
    // Update counter to show list number
    const listIdNum = currentListData ? (currentListData.list_id || currentListIndex + 1) : currentListIndex + 1;
    document.getElementById('questionCounter').textContent = `List ${listIdNum} of ${filteredQuestionLists.length}`;
    
    // Update navigation buttons
    document.getElementById('prevBtn').disabled = currentListIndex === 0;
    document.getElementById('nextBtn').disabled = currentListIndex === filteredQuestionLists.length - 1;
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
    if (newListIndex >= 0 && newListIndex < filteredQuestionLists.length) {
        // Update selector to the new list
        document.getElementById('listSelector').value = newListIndex.toString();
        // Trigger the list selection
        onListSelect();
    }
}

function convertMathTags(text) {
    if (!text) return '';
    
    // Convert {{MATHBLOCK}}...{{/MATHBLOCK}} to block math (handle multiline with [\s\S])
    text = text.replace(/\{\{MATHBLOCK\}\}([\s\S]*?)\{\{\/MATHBLOCK\}\}/g, (match, content) => {
        return `\\[${content.trim()}\\]`;
    });
    
    // Convert {{MATH}}...{{/MATH}} to inline math
    text = text.replace(/\{\{MATH\}\}(.*?)\{\{\/MATH\}\}/g, (match, content) => {
        return `\\(${content.trim()}\\)`;
    });
    
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
        // Clear all scores
        Object.keys(criteria).forEach(criterion => {
            clearButtonState(criterion);
        });
        document.getElementById('summary').value = '';
        updateScore();
        return;
    }
    
    // Load scores - try both old format (direct properties) and new format (criterion_scores array)
    Object.keys(criteria).forEach(criterion => {
        let score = null;
        
        // Try old format first (direct property on evaluation)
        if (evaluation[criterion] !== undefined && evaluation[criterion] !== null) {
            score = evaluation[criterion];
        } else if (evaluation.criterion_scores && Array.isArray(evaluation.criterion_scores)) {
            // Try new format (criterion_scores array)
            const keyMap = {
                'gradeLevel': 'Grade-Level Appropriateness',
                'teacherInput': 'Teacher Input Alignment',
                'difficultyProgression': 'Difficulty Progression',
                'uniqueness': 'Uniqueness & Diversity',
                'topicCoverage': 'Topic Coverage',
                'cognitiveDiversity': 'Cognitive Level Diversity',
                'questionTypeBalance': 'Question Type Balance',
                'answerLeakage': 'Answer Leakage Prevention'
            };
            const criterionData = evaluation.criterion_scores.find(c => c.criterion === keyMap[criterion]);
            if (criterionData && criterionData.score !== undefined) {
                score = criterionData.score;
            }
        }
        
        if (score !== null && score !== undefined) {
            setButtonState(criterion, score.toString());
        } else {
            clearButtonState(criterion);
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
    const criterionScores = {};
    
    Object.keys(criteria).forEach(criterion => {
        const value = getButtonValue(criterion);
        const score = value !== '' ? parseInt(value) : null;
        criterionScores[criterion] = score;
        if (score !== null) {
            totalScore += score;
        }
    });
    
    document.getElementById('totalScore').textContent = totalScore;
    const percentage = ((totalScore / 16) * 100).toFixed(1);
    document.getElementById('percentageScore').textContent = percentage;
    
    const allScored = Object.values(criterionScores).every(score => score !== null);
    const statusEl = document.getElementById('statusDisplay');
    if (allScored) {
        statusEl.className = 'status-display pass';
        statusEl.textContent = 'Evaluation complete';
    } else {
        statusEl.className = 'status-display';
        statusEl.textContent = 'Incomplete - Please score all criteria';
    }
}

function saveEvaluation() {
    if (!listId) {
        alert('No list selected');
        return;
    }
    
    const criterionScores = {};
    let allScored = true;
    
    Object.keys(criteria).forEach(criterion => {
        const value = getButtonValue(criterion);
        const score = value !== '' ? parseInt(value) : null;
        criterionScores[criterion] = score;
        if (score === null) {
            allScored = false;
        }
    });
    
    if (!allScored) {
        alert('Please score all 8 criteria before saving.');
        return;
    }
    
    const summary = document.getElementById('summary').value;
    const totalScore = Object.values(criterionScores).reduce((sum, score) => sum + score, 0);
    const percentage = (totalScore / 16) * 100;
    
    const criterionScoresArray = Object.keys(criteria).map(key => ({
        category: criteria[key].category,
        criterion: criteria[key].title,
        score: criterionScores[key],
        justification: '',
        maxScore: 2
    }));
    
    evaluation = {
        list_id: listId,
        list_context: listContext,
        criterion_scores: criterionScoresArray,
        total_score: totalScore,
        max_possible_score: 16,
        percentage: percentage,
        summary: summary || null,
        evaluated_at: new Date().toISOString(),
        evaluator_name: userName || null
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
    }, 2000);
}

function exportToYaml() {
    if (!evaluation) {
        alert('No evaluation to export.');
        return;
    }
    
    const yamlData = { evaluation: evaluation };
    const yamlString = jsyaml.dump(yamlData, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
    });
    
    const blob = new Blob([yamlString], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `list_evaluation_${new Date().toISOString().split('T')[0]}.yaml`;
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
        // Save selection state
        saveSelectionState();
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const savedUserName = localStorage.getItem('listEvaluatorUserName');
        if (savedUserName) {
            userName = savedUserName;
            const userNameInput = document.getElementById('userNameInput');
            if (userNameInput) {
                userNameInput.value = savedUserName;
            }
        }
    } catch (e) {
        console.warn('Could not load from localStorage:', e);
    }
}

function saveSelectionState() {
    try {
        const selectionState = {
            userName: userName,
            subject: selectedSubject,
            language: selectedLanguage,
            currentListIndex: currentListIndex
        };
        localStorage.setItem('listEvaluatorSelectionState', JSON.stringify(selectionState));
        if (userName) {
            localStorage.setItem('listEvaluatorUserName', userName);
        }
    } catch (e) {
        console.warn('Could not save selection state to localStorage:', e);
    }
}

function clearSelectionState() {
    try {
        localStorage.removeItem('listEvaluatorSelectionState');
    } catch (e) {
        console.warn('Could not clear selection state from localStorage:', e);
    }
}

function tryRestoreEvaluatorState() {
    try {
        const savedState = localStorage.getItem('listEvaluatorSelectionState');
        if (!savedState) {
            return; // No saved state, show selection page
        }
        
        const selectionState = JSON.parse(savedState);
        if (!selectionState.userName || !selectionState.subject || !selectionState.language) {
            return; // Invalid state, show selection page
        }
        
        // Restore the state
        userName = selectionState.userName;
        selectedSubject = selectionState.subject;
        selectedLanguage = selectionState.language;
        currentListIndex = selectionState.currentListIndex || 0;
        
        // Restore form values
        const userNameInput = document.getElementById('userNameInput');
        const subjectSelect = document.getElementById('subjectSelect');
        const languageSelect = document.getElementById('languageSelect');
        
        if (userNameInput) userNameInput.value = userName;
        if (subjectSelect) subjectSelect.value = selectedSubject;
        if (languageSelect) languageSelect.value = selectedLanguage;
        
        // Validate and enable start button
        validateSelection();
        
        // Auto-start evaluator if all fields are valid
        if (userName && selectedSubject && selectedLanguage) {
            // Use setTimeout to ensure DOM is ready
            setTimeout(() => {
                startEvaluator();
            }, 100);
        }
    } catch (e) {
        console.warn('Could not restore evaluator state:', e);
    }
}

function toggleCriteria() {
    const panel = document.getElementById('criteriaPanel');
    const btn = document.getElementById('toggleCriteriaBtn');
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
    html += `<h4>Scoring Guide:</h4><ul>`;
    Object.keys(criterion.scores).sort().forEach(score => {
        html += `<li><strong>${score}:</strong> ${criterion.scores[score]}</li>`;
    });
    html += `</ul>`;
    
    body.innerHTML = html;
    modal.style.display = 'flex';
}

function updateExportButton() {
    const hasEvaluation = evaluation !== null;
    document.getElementById('exportYamlBtn').disabled = !hasEvaluation;
}

function handleKeyboardInput(e) {
    // Only handle if evaluator interface is visible
    const evaluatorInterface = document.getElementById('evaluatorInterface');
    if (!evaluatorInterface || evaluatorInterface.style.display === 'none') {
        return;
    }
    
    // Don't handle if user is typing in an input field
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT')) {
        return;
    }
    
    // Only handle 0, 1, 2 keys
    const key = e.key;
    if (key !== '0' && key !== '1' && key !== '2') {
        return;
    }
    
    // Prevent default behavior
    e.preventDefault();
    
    // Determine which field to set based on what's missing (in order of criteria)
    const gradeLevel = getButtonValue('gradeLevel');
    const teacherInput = getButtonValue('teacherInput');
    const difficultyProgression = getButtonValue('difficultyProgression');
    const uniqueness = getButtonValue('uniqueness');
    const topicCoverage = getButtonValue('topicCoverage');
    const cognitiveDiversity = getButtonValue('cognitiveDiversity');
    const questionTypeBalance = getButtonValue('questionTypeBalance');
    const answerLeakage = getButtonValue('answerLeakage');
    
    // Determine target field and value
    let targetField = null;
    let targetValue = key; // All criteria use 0-2 scale
    
    if (!gradeLevel) {
        targetField = 'gradeLevel';
    } else if (!teacherInput) {
        targetField = 'teacherInput';
    } else if (!difficultyProgression) {
        targetField = 'difficultyProgression';
    } else if (!uniqueness) {
        targetField = 'uniqueness';
    } else if (!topicCoverage) {
        targetField = 'topicCoverage';
    } else if (!cognitiveDiversity) {
        targetField = 'cognitiveDiversity';
    } else if (!questionTypeBalance) {
        targetField = 'questionTypeBalance';
    } else if (!answerLeakage) {
        targetField = 'answerLeakage';
    } else {
        // All fields filled, don't do anything
        return;
    }
    
    // Set the button state
    if (targetField && targetValue !== null) {
        setButtonState(targetField, targetValue);
        updateScore();
    }
}
