// Global state
let allQuestions = [];
let questionLists = {}; // Grouped by discipline and grade
let listKeys = []; // Array of list keys in order
let currentListIndex = 0; // Index in listKeys array
let currentListKey = null;
let currentQuestionList = [];
let listContext = {};
let evaluation = null;
let listId = null;

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
    setupEventListeners();
    updateExportButton();
    loadJsonFile();
});

function setupEventListeners() {
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
    const jsonFile = urlParams.get('json') || 'individual_questions_to_test_Jan26.json';
    
    fetch(jsonFile)
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
                document.getElementById('loadingMessage').innerHTML = '<p style="color: #e74c3c;">No valid questions found in JSON file.</p>';
                return;
            }
            
            // Group questions by discipline and grade
            groupQuestionsByDisciplineAndGrade();
            
            // Populate list selector
            populateListSelector();
            
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('evaluatorInterface').style.display = 'block';
        })
        .catch(error => {
            document.getElementById('loadingMessage').innerHTML = '<p style="color: #e74c3c;">Error loading JSON file: ' + error.message + '</p>';
        });
}

function groupQuestionsByDisciplineAndGrade() {
    questionLists = {};
    
    allQuestions.forEach(question => {
        const discipline = question.discipline || 'Unknown';
        const grade = question.grade || 'Unknown';
        const key = `${discipline}_${grade}`;
        
        if (!questionLists[key]) {
            questionLists[key] = {
                discipline: discipline,
                grade: grade,
                questions: []
            };
        }
        
        questionLists[key].questions.push(question);
    });
    
    // Sort questions within each list by difficulty if available
    Object.keys(questionLists).forEach(key => {
        questionLists[key].questions.sort((a, b) => {
            const diffA = parseInt(a.difficulty) || 0;
            const diffB = parseInt(b.difficulty) || 0;
            return diffA - diffB;
        });
    });
}

function populateListSelector() {
    const selector = document.getElementById('listSelector');
    selector.innerHTML = '<option value="">Select a list...</option>';
    
    // Store sorted keys in array for navigation
    listKeys = Object.keys(questionLists).sort();
    
    listKeys.forEach(key => {
        const list = questionLists[key];
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${list.discipline} - ${formatGrade(list.grade)} (${list.questions.length} questions)`;
        selector.appendChild(option);
    });
    
    // Update navigation display
    updateListNavigation();
}

function onListSelect() {
    const selector = document.getElementById('listSelector');
    const selectedKey = selector.value;
    
    if (!selectedKey || !questionLists[selectedKey]) {
        currentListKey = null;
        currentListIndex = -1;
        currentQuestionList = [];
        return;
    }
    
    // Find the index of the selected list
    currentListIndex = listKeys.indexOf(selectedKey);
    currentListKey = selectedKey;
    currentQuestionList = questionLists[selectedKey].questions;
    
    // Extract list context
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
    if (currentQuestionList.length === 0) return;
    
    const firstQuestion = currentQuestionList[0];
    listContext = {
        grade: firstQuestion.grade || 'Not specified',
        locale: firstQuestion.locale || 'Not specified',
        category: firstQuestion.category || 'Not specified',
        discipline: firstQuestion.discipline || 'Not specified',
        numMultipleChoice: currentQuestionList.filter(q => q.type === 'MCQ').length,
        numDiscursive: currentQuestionList.filter(q => q.type !== 'MCQ').length,
        teacherInput: firstQuestion.teacher_input || null,
        uploadedFiles: firstQuestion.uploaded_files ? firstQuestion.uploaded_files.split(',').map(f => f.trim()) : []
    };
}

function generateListId() {
    if (!currentListKey) return null;
    const hash = currentListKey + '_' + currentQuestionList.length;
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
    if (listKeys.length === 0) {
        document.getElementById('questionCounter').textContent = 'No lists available';
        document.getElementById('prevBtn').disabled = true;
        document.getElementById('nextBtn').disabled = true;
        return;
    }
    
    // Update counter to show list number
    document.getElementById('questionCounter').textContent = `List ${currentListIndex + 1} of ${listKeys.length}`;
    
    // Update navigation buttons
    document.getElementById('prevBtn').disabled = currentListIndex === 0;
    document.getElementById('nextBtn').disabled = currentListIndex === listKeys.length - 1;
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
    if (newListIndex >= 0 && newListIndex < listKeys.length) {
        // Update selector to the new list
        const newListKey = listKeys[newListIndex];
        document.getElementById('listSelector').value = newListKey;
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
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
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
