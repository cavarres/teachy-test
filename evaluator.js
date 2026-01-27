// Global state
let allQuestions = []; // All questions from JSON
let questions = []; // Filtered questions based on selection
let currentQuestionIndex = 0;
let evaluations = {};
let currentQuestionId = null;
let selectedSubject = null;
let selectedLanguage = null;
let userName = null;

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    setupEventListeners();
    updateExportButton();
    // Load JSON and populate selection dropdowns
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
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv);
    document.getElementById('prevBtn').addEventListener('click', () => navigateQuestion(-1));
    document.getElementById('nextBtn').addEventListener('click', () => navigateQuestion(1));
    document.getElementById('jumpToBtn').addEventListener('click', jumpToQuestion);
    document.getElementById('saveEvaluationBtn').addEventListener('click', saveEvaluation);
    
    // Handle PASS/FAIL button clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-toggle')) {
            const field = e.target.getAttribute('data-field');
            const value = e.target.getAttribute('data-value');
            
            // Remove active from siblings
            const siblings = document.querySelectorAll(`.btn-toggle[data-field="${field}"]`);
            siblings.forEach(btn => btn.classList.remove('active'));
            
            // Add active to clicked button
            e.target.classList.add('active');
            
            // Update score
            updateScore();
        }
        
        // Handle score button clicks
        if (e.target.classList.contains('btn-score')) {
            const field = e.target.getAttribute('data-field');
            const value = e.target.getAttribute('data-value');
            
            // Remove active from siblings
            const siblings = document.querySelectorAll(`.btn-score[data-field="${field}"]`);
            siblings.forEach(btn => btn.classList.remove('active'));
            
            // Add active to clicked button
            e.target.classList.add('active');
            
            // Update score
            updateScore();
        }
    });
    
    // Auto-update score on reasoning change
    document.getElementById('reasoning').addEventListener('input', updateScore);

    // Info icon click handlers
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('info-icon')) {
            const criterion = e.target.getAttribute('data-criterion');
            showInfoModal(criterion);
        }
    });
    
    // Close modal handlers
    document.getElementById('closeInfoModal').addEventListener('click', closeInfoModal);
    document.getElementById('infoModal').addEventListener('click', (e) => {
        if (e.target.id === 'infoModal') {
            closeInfoModal();
        }
    });
    
    // Keyboard shortcuts for scoring
    document.addEventListener('keydown', handleKeyboardInput);
}

function loadJsonFile() {
    fetch('individual_questions_to_test_Jan26.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Could not load JSON file');
            }
            return response.json();
        })
        .then(jsonData => {
            // Transform JSON questions to match expected format
            allQuestions = (jsonData.questions || []).map((q, index) => {
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
            }).filter(q => q.question_statement && q.question_statement.trim() !== '');
            
            if (allQuestions.length === 0) {
                document.getElementById('selectionPage').innerHTML = '<p style="color: #e74c3c;">No valid questions found in JSON file.</p>';
                return;
            }
            
            // Populate grade and subject dropdowns
            populateSelectionDropdowns();
            
            // Try to restore evaluator state after JSON loads
            tryRestoreEvaluatorState();
        })
        .catch(error => {
            document.getElementById('selectionPage').innerHTML = '<p style="color: #e74c3c;">Error loading JSON file: ' + error.message + '</p>';
        });
}

function populateSelectionDropdowns() {
    // Get unique subjects
    const subjects = new Set();
    
    allQuestions.forEach(q => {
        if (q.discipline && q.discipline.trim() !== '') {
            subjects.add(q.discipline.trim());
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
    
    // Filter questions based on subject or show all
    let filteredQuestions = [];
    if (selectedSubject === 'ALL') {
        filteredQuestions = allQuestions;
    } else {
        filteredQuestions = allQuestions.filter(q => {
            const subjectMatch = q.discipline && q.discipline.trim() === selectedSubject;
            return subjectMatch;
        });
    }
    
    // Filter by language (locale)
    if (selectedLanguage === 'BOTH') {
        questions = filteredQuestions; // Show all questions for the selected discipline regardless of locale
    } else {
        questions = filteredQuestions.filter(q => {
            // Filter by locale, not by language field
            const locale = (q.locale || '').trim();
            if (selectedLanguage === 'English') {
                return locale === 'en_US';
            } else if (selectedLanguage === 'Portuguese') {
                return locale === 'pt_BR';
            }
            return false;
        });
    }
    
    if (questions.length === 0) {
        alert(`No questions found for ${selectedSubject === 'ALL' ? 'All Subjects' : selectedSubject} in ${selectedLanguage === 'BOTH' ? 'both languages' : selectedLanguage}.`);
        return;
    }
    
    // Save selection state to localStorage
    saveSelectionState();
    
    // Hide selection page and show evaluator page
    document.getElementById('selectionPage').style.display = 'none';
    document.getElementById('evaluatorPage').style.display = 'block';
    
    // Update display with selected values
    document.getElementById('selectedSubjectDisplay').textContent = selectedSubject === 'ALL' ? 'All Subjects' : selectedSubject;
    document.getElementById('selectedLanguageDisplay').textContent = selectedLanguage === 'BOTH' ? 'Both' : selectedLanguage;
    
    // Initialize evaluator
    currentQuestionIndex = 0;
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('evaluatorInterface').style.display = 'block';
    displayQuestion(0);
    updateProgress();
}

function backToSelection() {
    // Clear the saved selection state
    clearSelectionState();
    
    // Show selection page and hide evaluator page
    document.getElementById('selectionPage').style.display = 'flex';
    document.getElementById('evaluatorPage').style.display = 'none';
    
    // Reset form
    document.getElementById('userNameInput').value = userName || '';
    if (selectedSubject) {
        document.getElementById('subjectSelect').value = selectedSubject;
    }
    if (selectedLanguage) {
        document.getElementById('languageSelect').value = selectedLanguage;
    }
    validateSelection();
}

function saveSelectionState() {
    try {
        const selectionState = {
            userName: userName,
            subject: selectedSubject,
            language: selectedLanguage,
            currentQuestionIndex: currentQuestionIndex
        };
        localStorage.setItem('evaluatorSelectionState', JSON.stringify(selectionState));
    } catch (e) {
        console.warn('Could not save selection state to localStorage:', e);
    }
}

function clearSelectionState() {
    try {
        localStorage.removeItem('evaluatorSelectionState');
    } catch (e) {
        console.warn('Could not clear selection state from localStorage:', e);
    }
}

function tryRestoreEvaluatorState() {
    try {
        const savedState = localStorage.getItem('evaluatorSelectionState');
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
        currentQuestionIndex = selectionState.currentQuestionIndex || 0;
        
        // Filter questions based on saved selection
        let filteredQuestions = [];
        if (selectedSubject === 'ALL') {
            filteredQuestions = allQuestions;
        } else {
            filteredQuestions = allQuestions.filter(q => {
                const subjectMatch = q.discipline && q.discipline.trim() === selectedSubject;
                return subjectMatch;
            });
        }
        
        // Filter by language (locale)
        if (selectedLanguage === 'BOTH') {
            questions = filteredQuestions;
        } else {
            questions = filteredQuestions.filter(q => {
                const locale = (q.locale || '').trim();
                if (selectedLanguage === 'English') {
                    return locale === 'en_US';
                } else if (selectedLanguage === 'Portuguese') {
                    return locale === 'pt_BR';
                }
                return false;
            });
        }
        
        if (questions.length === 0) {
            // No questions found, show selection page
            return;
        }
        
        // Ensure currentQuestionIndex is valid
        if (currentQuestionIndex >= questions.length) {
            currentQuestionIndex = 0;
        }
        
        // Hide selection page and show evaluator page
        document.getElementById('selectionPage').style.display = 'none';
        document.getElementById('evaluatorPage').style.display = 'block';
        
        // Update display with selected values
        document.getElementById('selectedSubjectDisplay').textContent = selectedSubject === 'ALL' ? 'All Subjects' : selectedSubject;
        document.getElementById('selectedLanguageDisplay').textContent = selectedLanguage === 'BOTH' ? 'Both' : selectedLanguage;
        
        // Initialize evaluator
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('evaluatorInterface').style.display = 'block';
        displayQuestion(currentQuestionIndex);
        updateProgress();
    } catch (e) {
        console.warn('Could not restore evaluator state:', e);
        // On error, show selection page
    }
}


function displayQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    
    currentQuestionIndex = index;
    const question = questions[index];
    currentQuestionId = question.question_id;

    // Update question info
    document.getElementById('questionId').textContent = question.question_id;
    
    // Set discipline and category (primary row - bigger)
    const disciplineEl = document.getElementById('questionDiscipline');
    disciplineEl.textContent = question.discipline || 'N/A';
    
    const categoryEl = document.getElementById('questionCategory');
    categoryEl.textContent = question.category || 'N/A';
    
    // Set grade, difficulty, and type (secondary row - smaller)
    const gradeEl = document.getElementById('questionGrade');
    gradeEl.textContent = formatGrade(question.grade);
    
    const difficultyEl = document.getElementById('questionDifficulty');
    const difficultyValue = question.difficulty || 'N/A';
    difficultyEl.textContent = difficultyValue;
    // Add data attribute for color coding
    if (difficultyValue !== 'N/A') {
        const difficultyNum = parseInt(difficultyValue);
        if (!isNaN(difficultyNum)) {
            // Numeric difficulty: use the number as-is for data attribute
            difficultyEl.setAttribute('data-difficulty', difficultyValue);
        } else {
            // Text difficulty: use lowercase for matching
            difficultyEl.setAttribute('data-difficulty', difficultyValue.toLowerCase());
        }
    } else {
        difficultyEl.removeAttribute('data-difficulty');
    }
    
    const typeEl = document.getElementById('questionType');
    typeEl.textContent = question.type || 'N/A';
    
    document.getElementById('questionCounter').textContent = `Question ${index + 1} of ${questions.length}`;

    // Display question statement with LaTeX
    const statementEl = document.getElementById('questionStatement');
    statementEl.innerHTML = convertMathTags(question.question_statement || '');

    // Display solution with LaTeX
    const solutionEl = document.getElementById('questionSolution');
    solutionEl.innerHTML = convertMathTags(question.question_solution || '');

    // Render LaTeX
    renderMath(statementEl);
    renderMath(solutionEl);

    // Handle MCQ options
    const isMCQ = question.type === 'MCQ';
    const mcqSection = document.getElementById('mcqOptionsSection');
    const mcqOptions = document.getElementById('mcqOptions');
    
    if (isMCQ) {
        mcqSection.style.display = 'block';
        mcqOptions.innerHTML = '';
        
        // Correct answer
        if (question.correct_answer) {
            const correctDiv = document.createElement('div');
            correctDiv.className = 'mcq-option correct';
            correctDiv.innerHTML = '<strong>✓ Correct:</strong> ' + convertMathTags(question.correct_answer);
            mcqOptions.appendChild(correctDiv);
            renderMath(correctDiv);
        }
        
        // Incorrect alternatives
        const alternatives = [
            question.incorrect_alternative_1,
            question.incorrect_alternative_2,
            question.incorrect_alternative_3,
            question.incorrect_alternative_4
        ].filter(alt => alt && alt.trim() !== '');
        
        alternatives.forEach(alt => {
            const incorrectDiv = document.createElement('div');
            incorrectDiv.className = 'mcq-option incorrect';
            incorrectDiv.innerHTML = '<strong>✗ Incorrect:</strong> ' + convertMathTags(alt);
            mcqOptions.appendChild(incorrectDiv);
            renderMath(incorrectDiv);
        });
    } else {
        mcqSection.style.display = 'none';
    }

    // Show/hide evaluation fields based on question type
    document.getElementById('mcqQualityGroup').style.display = isMCQ ? 'block' : 'none';
    document.getElementById('openEndedQualityGroup').style.display = isMCQ ? 'none' : 'block';

    // Clear all button states first
    clearButtonState('completeness');
    clearButtonState('factualCorrectness');
    clearButtonState('promptQuality');
    clearButtonState('mcqQuality');
    clearButtonState('openEndedQuality');
    clearButtonState('cognitiveDemand');
    document.getElementById('reasoning').value = '';

    // Load existing evaluation if available
    loadEvaluation(question.question_id);

    // Update navigation buttons
    document.getElementById('prevBtn').disabled = index === 0;
    document.getElementById('nextBtn').disabled = index === questions.length - 1;
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
    
    // Preserve line breaks
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

function formatGrade(grade) {
    if (!grade) return 'N/A';
    const gradeNum = parseInt(grade);
    if (gradeNum === 0) return 'Kindergarten';
    if (gradeNum >= 10 && gradeNum <= 90) return `Grade ${gradeNum / 10}`;
    if (gradeNum >= 100 && gradeNum <= 120) return `Grade ${gradeNum / 10}`;
    if (gradeNum === 130) return 'University/College';
    return grade;
}

function navigateQuestion(direction) {
    const newIndex = currentQuestionIndex + direction;
    if (newIndex >= 0 && newIndex < questions.length) {
        displayQuestion(newIndex);
        updateProgress();
        // Save the current question index
        saveSelectionState();
    }
}

function jumpToQuestion() {
    const input = document.getElementById('jumpToInput');
    const questionNum = parseInt(input.value);
    if (questionNum >= 1 && questionNum <= questions.length) {
        displayQuestion(questionNum - 1);
        updateProgress();
        input.value = '';
        // Save the current question index
        saveSelectionState();
    } else {
        alert(`Please enter a number between 1 and ${questions.length}`);
    }
}

function loadEvaluation(questionId) {
    const evaluation = evaluations[questionId] || {};
    
    // Set PASS/FAIL buttons
    setButtonState('completeness', evaluation.completeness || '');
    setButtonState('factualCorrectness', evaluation.factual_correctness || '');
    
    // Set score buttons
    if (evaluation.prompt_quality !== undefined && evaluation.prompt_quality !== null) {
        setButtonState('promptQuality', evaluation.prompt_quality.toString());
    } else {
        clearButtonState('promptQuality');
    }
    
    if (evaluation.mcq_quality !== undefined && evaluation.mcq_quality !== null) {
        setButtonState('mcqQuality', evaluation.mcq_quality.toString());
    } else {
        clearButtonState('mcqQuality');
    }
    
    if (evaluation.open_ended_quality !== undefined && evaluation.open_ended_quality !== null) {
        setButtonState('openEndedQuality', evaluation.open_ended_quality.toString());
    } else {
        clearButtonState('openEndedQuality');
    }
    
    if (evaluation.cognitive_demand !== undefined && evaluation.cognitive_demand !== null) {
        setButtonState('cognitiveDemand', evaluation.cognitive_demand.toString());
    } else {
        clearButtonState('cognitiveDemand');
    }
    
    document.getElementById('reasoning').value = evaluation.reasoning || '';
    
    updateScore();
}

function setButtonState(field, value) {
    if (!value) {
        clearButtonState(field);
        return;
    }
    
    const buttons = document.querySelectorAll(`.btn-toggle[data-field="${field}"], .btn-score[data-field="${field}"]`);
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-value') === value) {
            btn.classList.add('active');
        }
    });
}

function clearButtonState(field) {
    const buttons = document.querySelectorAll(`.btn-toggle[data-field="${field}"], .btn-score[data-field="${field}"]`);
    buttons.forEach(btn => btn.classList.remove('active'));
}

function saveEvaluation() {
    if (!currentQuestionId) return;
    
    const completeness = getButtonValue('completeness');
    const factualCorrectness = getButtonValue('factualCorrectness');
    const promptQuality = getButtonValue('promptQuality');
    const mcqQuality = getButtonValue('mcqQuality');
    const openEndedQuality = getButtonValue('openEndedQuality');
    const cognitiveDemand = getButtonValue('cognitiveDemand');
    const reasoning = document.getElementById('reasoning').value;
    
    // Validate that all required fields are filled
    const missingFields = [];
    if (!completeness) missingFields.push('Completeness Check');
    if (!factualCorrectness) missingFields.push('Factual Correctness Check');
    
    // Check Phase 2 fields based on question type
    const isMCQ = questions[currentQuestionIndex]?.type === 'MCQ';
    if (!promptQuality) missingFields.push('Prompt Quality');
    if (isMCQ && !mcqQuality) {
        missingFields.push('MCQ Quality');
    } else if (!isMCQ && !openEndedQuality) {
        missingFields.push('Open-ended Quality');
    }
    if (!cognitiveDemand) missingFields.push('Cognitive Demand');
    
    if (missingFields.length > 0) {
        alert('Please complete the following fields before continuing:\n\n' + missingFields.join('\n'));
        return;
    }
    
    // Calculate total score
    let totalScore = 0;
    if (completeness === 'FAIL' || factualCorrectness === 'FAIL') {
        totalScore = 0;
    } else {
        const promptQ = promptQuality !== '' ? parseInt(promptQuality) : 0;
        const mcqQ = mcqQuality !== '' ? parseInt(mcqQuality) : 0;
        const openQ = openEndedQuality !== '' ? parseInt(openEndedQuality) : 0;
        const cogD = cognitiveDemand !== '' ? parseInt(cognitiveDemand) : 0;
        
        // Calculate total score: Prompt Quality (0-2) + MCQ/Open-ended Quality (0-2) + Cognitive Demand (0-2) = max 6
        totalScore = promptQ + (isMCQ ? mcqQ : openQ) + cogD;
    }
    
    const evaluation = {
        question_id: currentQuestionId,
        evaluator_name: userName,
        completeness: completeness || null,
        factual_correctness: factualCorrectness || null,
        prompt_quality: promptQuality !== '' ? parseInt(promptQuality) : null,
        mcq_quality: mcqQuality !== '' ? parseInt(mcqQuality) : null,
        open_ended_quality: openEndedQuality !== '' ? parseInt(openEndedQuality) : null,
        cognitive_demand: cognitiveDemand !== '' ? parseInt(cognitiveDemand) : null,
        total_score: totalScore,
        reasoning: reasoning || null,
        issues: null,
        evaluated_at: new Date().toISOString()
    };
    
    evaluations[currentQuestionId] = evaluation;
    saveToLocalStorage();
    updateProgress();
    updateExportButton();
    
    // Auto-navigate to next question
    if (currentQuestionIndex < questions.length - 1) {
        navigateQuestion(1);
    } else {
        // Show confirmation if last question
        const btn = document.getElementById('saveEvaluationBtn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Saved!';
        btn.style.background = '#008F87';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }
}

function getButtonValue(field) {
    const activeButton = document.querySelector(`.btn-toggle[data-field="${field}"].active, .btn-score[data-field="${field}"].active`);
    return activeButton ? activeButton.getAttribute('data-value') : '';
}

function updateScore() {
    const completeness = getButtonValue('completeness');
    const factualCorrectness = getButtonValue('factualCorrectness');
    const promptQuality = getButtonValue('promptQuality');
    const mcqQuality = getButtonValue('mcqQuality');
    const openEndedQuality = getButtonValue('openEndedQuality');
    const cognitiveDemand = getButtonValue('cognitiveDemand');
    
    let totalScore = 0;
    let status = '';
    
    if (completeness === 'FAIL' || factualCorrectness === 'FAIL') {
        totalScore = 0;
        status = '';
    } else if (completeness === 'PASS' && factualCorrectness === 'PASS') {
        const promptQ = promptQuality !== '' ? parseInt(promptQuality) : 0;
        const isMCQ = questions[currentQuestionIndex]?.type === 'MCQ';
        const mcqQ = mcqQuality !== '' ? parseInt(mcqQuality) : 0;
        const openQ = openEndedQuality !== '' ? parseInt(openEndedQuality) : 0;
        const cogD = cognitiveDemand !== '' ? parseInt(cognitiveDemand) : 0;
        
        // Calculate total score: Prompt Quality (0-2) + MCQ/Open-ended Quality (0-2) + Cognitive Demand (0-2) = max 6
        totalScore = promptQ + (isMCQ ? mcqQ : openQ) + cogD;
        
        status = 'Ready for evaluation';
    } else {
        status = 'Incomplete - Fill Phase 1 first';
    }
    
    document.getElementById('totalScore').textContent = totalScore;
    
    const statusEl = document.getElementById('statusDisplay');
    if (status.includes('Incomplete')) {
        statusEl.className = 'status-display';
        statusEl.textContent = status;
    } else if (status === 'Ready for evaluation') {
        statusEl.className = 'status-display pass';
        statusEl.textContent = status;
    } else {
        statusEl.className = 'status-display';
        statusEl.textContent = status;
    }
}


function updateProgress() {
    const evaluatedCount = Object.keys(evaluations).length;
    const totalQuestions = questions.length;
    document.getElementById('progressText').textContent = `${evaluatedCount} of ${totalQuestions} evaluated`;
    
    // Update progress bar
    const progressBar = document.getElementById('progressBar');
    if (progressBar && totalQuestions > 0) {
        const percentage = (evaluatedCount / totalQuestions) * 100;
        progressBar.style.width = percentage + '%';
    }
}

function updateExportButton() {
    const hasEvaluations = Object.keys(evaluations).length > 0;
    document.getElementById('exportCsvBtn').disabled = !hasEvaluations;
}

function exportToCsv() {
    if (Object.keys(evaluations).length === 0) {
        alert('No evaluations to export.');
        return;
    }
    
    // Sort by question_id
    const sortedIds = Object.keys(evaluations).sort((a, b) => {
        const aNum = parseInt(a) || 0;
        const bNum = parseInt(b) || 0;
        return aNum - bNum;
    });
    
    // Define CSV headers
    const headers = [
        'question_id',
        'evaluator_name',
        'completeness',
        'factual_correctness',
        'prompt_quality',
        'mcq_quality',
        'open_ended_quality',
        'cognitive_demand',
        'total_score',
        'reasoning',
        'evaluated_at'
    ];
    
    // Create CSV rows
    const rows = [headers.join(',')];
    
    sortedIds.forEach(id => {
        const eval = evaluations[id];
        const row = [
            eval.question_id || '',
            eval.evaluator_name || '',
            eval.completeness || '',
            eval.factual_correctness || '',
            eval.prompt_quality !== null && eval.prompt_quality !== undefined ? eval.prompt_quality : '',
            eval.mcq_quality !== null && eval.mcq_quality !== undefined ? eval.mcq_quality : '',
            eval.open_ended_quality !== null && eval.open_ended_quality !== undefined ? eval.open_ended_quality : '',
            eval.cognitive_demand !== null && eval.cognitive_demand !== undefined ? eval.cognitive_demand : '',
            eval.total_score !== null && eval.total_score !== undefined ? eval.total_score : '',
            eval.reasoning ? `"${eval.reasoning.replace(/"/g, '""')}"` : '',
            eval.evaluated_at || ''
        ];
        rows.push(row.join(','));
    });
    
    const csvString = rows.join('\n');
    
    // Create download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluations_${userName || 'user'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('questionEvaluations', JSON.stringify(evaluations));
        localStorage.setItem('questionEvaluationsIndex', currentQuestionIndex.toString());
        if (userName) {
            localStorage.setItem('evaluatorUserName', userName);
        }
        // Also update the selection state with current question index
        saveSelectionState();
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('questionEvaluations');
        if (saved) {
            evaluations = JSON.parse(saved);
        }
        const savedIndex = localStorage.getItem('questionEvaluationsIndex');
        if (savedIndex) {
            currentQuestionIndex = parseInt(savedIndex);
        }
        const savedUserName = localStorage.getItem('evaluatorUserName');
        if (savedUserName) {
            userName = savedUserName;
            document.getElementById('userNameInput').value = savedUserName;
        }
    } catch (e) {
        console.warn('Could not load from localStorage:', e);
    }
}

function handleKeyboardInput(e) {
    // Only handle if evaluator page is visible
    const evaluatorPage = document.getElementById('evaluatorPage');
    if (!evaluatorPage || evaluatorPage.style.display === 'none') {
        return;
    }
    
    // Don't handle if user is typing in an input field
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
    }
    
    // Only handle 0, 1, 2 keys
    const key = e.key;
    if (key !== '0' && key !== '1' && key !== '2') {
        return;
    }
    
    // Prevent default behavior
    e.preventDefault();
    
    // Get current question type
    const isMCQ = questions[currentQuestionIndex]?.type === 'MCQ';
    
    // Determine which field to set based on what's missing
    const completeness = getButtonValue('completeness');
    const factualCorrectness = getButtonValue('factualCorrectness');
    const promptQuality = getButtonValue('promptQuality');
    const mcqQuality = getButtonValue('mcqQuality');
    const openEndedQuality = getButtonValue('openEndedQuality');
    const cognitiveDemand = getButtonValue('cognitiveDemand');
    
    // Determine target field and value
    let targetField = null;
    let targetValue = null;
    
    if (!completeness) {
        // Completeness Check (Pass/Fail): 0 = FAIL, 1 = PASS
        targetField = 'completeness';
        if (key === '0') {
            targetValue = 'FAIL';
        } else if (key === '1') {
            targetValue = 'PASS';
        } else {
            return; // 2 is not valid for Pass/Fail
        }
    } else if (!factualCorrectness) {
        // Factual Correctness Check (Pass/Fail): 0 = FAIL, 1 = PASS
        targetField = 'factualCorrectness';
        if (key === '0') {
            targetValue = 'FAIL';
        } else if (key === '1') {
            targetValue = 'PASS';
        } else {
            return; // 2 is not valid for Pass/Fail
        }
    } else if (!promptQuality) {
        // Prompt Quality (0-2)
        targetField = 'promptQuality';
        targetValue = key;
    } else if (isMCQ && !mcqQuality) {
        // MCQ Quality (0-2)
        targetField = 'mcqQuality';
        targetValue = key;
    } else if (!isMCQ && !openEndedQuality) {
        // Open-ended Quality (0-2)
        targetField = 'openEndedQuality';
        targetValue = key;
    } else if (!cognitiveDemand) {
        // Cognitive Demand (0-2)
        targetField = 'cognitiveDemand';
        targetValue = key;
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

function showInfoModal(criterion) {
    const modal = document.getElementById('infoModal');
    const title = document.getElementById('infoModalTitle');
    const body = document.getElementById('infoModalBody');
    
    const content = getCriterionInfo(criterion);
    title.textContent = content.title;
    body.innerHTML = content.html;
    
    modal.style.display = 'flex';
}

function closeInfoModal() {
    document.getElementById('infoModal').style.display = 'none';
}

function getCriterionInfo(criterion) {
    const info = {
        promptQuality: {
            title: 'Prompt Quality (0-2)',
            html: `
                <h4>0: Does not meet criterion</h4>
                <ul>
                    <li>Prompt is vague, ambiguous, or misleading</li>
                    <li>Does not specify expected depth or scope (e.g., asks to "explain" without clarifying if one benefit vs. full explanation vs. comparison is expected)</li>
                    <li>Multiple valid interpretations possible that would yield different responses</li>
                    <li>Critical context missing that students need to answer</li>
                    <li>Question stem is confusing or poorly worded</li>
                </ul>
                
                <h4>1: Partially meets criterion</h4>
                <ul>
                    <li>Prompt is generally clear but could be more precise</li>
                    <li>Some ambiguity about expected depth or scope remains</li>
                    <li>Minor wording issues that don't fundamentally undermine understanding</li>
                    <li>Most students would understand what's being asked but might be unsure about detail level expected</li>
                </ul>
                
                <h4>2: Fully meets criterion (excellence)</h4>
                <ul>
                    <li>Prompt is clear, specific, and unambiguous</li>
                    <li>Expected depth and scope are well-defined (e.g., "identify one benefit," "compare and contrast," "provide a detailed explanation")</li>
                    <li>Question stem is precisely worded with appropriate academic language for the grade level</li>
                    <li>Students know exactly what is being asked and what type of response is expected</li>
                    <li>All necessary context is provided without being overly verbose</li>
                </ul>
            `
        },
        mcqQuality: {
            title: 'MCQ Quality (0-2)',
            html: `
                <p><strong>Evaluate:</strong> How good are the distractors AND how well are they explained?</p>
                
                <h4>0: Does not meet criterion</h4>
                <ul>
                    <li>Distractors are obviously wrong, nonsensical, or use "all/none of the above" cop-outs</li>
                    <li>Distractors vary wildly in plausibility</li>
                    <li>No explanations provided, OR explanations are incorrect</li>
                    <li>Explanations only address correct answer without discussing distractors</li>
                </ul>
                
                <h4>1: Partially meets criterion</h4>
                <ul>
                    <li>Distractors are plausible but <strong>generic</strong>—don't represent specific, documented misconceptions</li>
                    <li>Explanations are present but superficial (just state "this is wrong" without naming specific misconceptions)</li>
                    <li>Distractors may be somewhat unbalanced in plausibility</li>
                    <li>The question is functional but lacks pedagogical depth</li>
                </ul>
                
                <h4>2: Fully meets criterion (excellence)</h4>
                <ul>
                    <li>Each distractor represents a <strong>specific, well-documented misconception</strong> that is balanced in plausibility</li>
                    <li>Explanations clearly state why the correct answer is correct with strong reasoning</li>
                    <li>Explanations <strong>explicitly name the specific misconception or error pattern</strong> each distractor represents</li>
                    <li>A student choosing any wrong answer reveals a diagnosable, specific gap in understanding</li>
                </ul>
            `
        },
        openEndedQuality: {
            title: 'Open-ended Quality (0-2)',
            html: `
                <p><strong>Evaluate:</strong> Quality of model answer or scoring rubric</p>
                
                <h4>0: Does not meet criterion</h4>
                <ul>
                    <li>No model answer or rubric provided</li>
                    <li>Guidance is too vague to be actionable (e.g., "explain photosynthesis" with no success criteria or expected elements)</li>
                    <li>Criteria are unclear or inconsistent</li>
                </ul>
                
                <h4>1: Partially meets criterion</h4>
                <ul>
                    <li>Provides some guidance but incomplete</li>
                    <li>Lists expected elements but no indication of quality levels</li>
                    <li>Provides a model answer but criteria for partial credit are unclear</li>
                    <li>Basic guidance present but lacks depth</li>
                </ul>
                
                <h4>2: Fully meets criterion (excellence)</h4>
                <ul>
                    <li>Provides a <strong>comprehensive, detailed model answer</strong> showing exactly what "good" performance looks like with full reasoning</li>
                    <li>OR provides a <strong>complete rubric with specific criteria, clear quality levels, and objective scoring guidance</strong></li>
                    <li>Makes assessment consistent and fair across evaluators</li>
                </ul>
            `
        },
        cognitiveDemand: {
            title: 'Cognitive Demand Appropriateness (0-2)',
            html: `
                <p><strong>Question:</strong> Is this question correctly categorized for the assigned grade and difficulty?</p>
                
                <p><strong>Evaluation Process:</strong></p>
                <p><strong>Step 1:</strong> Identify the Bloom's Taxonomy level (Remember, Understand, Apply, Analyze, Evaluate, Create)</p>
                <p><strong>Step 2:</strong> Map Bloom's level to expected difficulty:</p>
                <ul>
                    <li><strong>Remember/Understand</strong> → Low difficulty (100-300)</li>
                    <li><strong>Apply/Analyze</strong> → Medium difficulty (400-600)</li>
                    <li><strong>Evaluate/Create</strong> → High difficulty (700-900)</li>
                </ul>
                
                <h4>0: Does not meet criterion</h4>
                <ul>
                    <li>Bloom's level and assigned difficulty are severely mismatched (off by 2+ categories)</li>
                    <li>Cognitive demand clearly inappropriate for target grade level (e.g., abstract reasoning for 2nd grade, trivial recall for high school)</li>
                </ul>
                
                <h4>1: Partially meets criterion</h4>
                <ul>
                    <li>Bloom's level and assigned difficulty are moderately mismatched (off by 1 category)</li>
                    <li>Vocabulary is somewhat too advanced/simple for grade</li>
                    <li>Assumes prerequisites slightly atypical for the grade level</li>
                </ul>
                
                <h4>2: Fully meets criterion (excellence)</h4>
                <ul>
                    <li>Bloom's level aligns with assigned difficulty range (within the correct category or at most at the boundary)</li>
                    <li>Vocabulary and complexity appropriate for target grade level</li>
                    <li>Prerequisites are typical and reasonable for the grade</li>
                    <li>Do not penalize questions for being "too simple" or "too complex" within their assigned difficulty range—trust that the difficulty assignment is intentional</li>
                </ul>
            `
        }
    };
    
    return info[criterion] || { title: 'Information', html: '<p>No information available for this criterion.</p>' };
}


