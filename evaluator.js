// Global state
let questions = [];
let currentQuestionIndex = 0;
let evaluations = {};
let currentQuestionId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    setupEventListeners();
    updateExportButton();
    // Automatically load the CSV file
    loadCsvFile();
});

function setupEventListeners() {
    document.getElementById('exportYamlBtn').addEventListener('click', exportToYaml);
    document.getElementById('toggleCriteriaBtn').addEventListener('click', toggleCriteria);
    document.getElementById('closeCriteriaBtn').addEventListener('click', toggleCriteria);
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

    // Load criteria content
    loadCriteriaContent();
}

function loadCsvFile() {
    fetch('questions_to_test_no_scoresv2_jan18.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('Could not load CSV file');
            }
            return response.text();
        })
        .then(csvText => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    questions = results.data.filter(q => q.question_id && q.question_id.trim() !== '');
                    if (questions.length === 0) {
                        document.getElementById('loadingMessage').innerHTML = '<p style="color: #e74c3c;">No valid questions found in CSV file.</p>';
                        return;
                    }
                    
                    currentQuestionIndex = 0;
                    document.getElementById('loadingMessage').style.display = 'none';
                    document.getElementById('evaluatorInterface').style.display = 'block';
                    displayQuestion(0);
                    updateProgress();
                },
                error: (error) => {
                    document.getElementById('loadingMessage').innerHTML = '<p style="color: #e74c3c;">Error parsing CSV: ' + error.message + '</p>';
                }
            });
        })
        .catch(error => {
            document.getElementById('loadingMessage').innerHTML = '<p style="color: #e74c3c;">Error loading CSV file: ' + error.message + '</p>';
        });
}


function displayQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    
    currentQuestionIndex = index;
    const question = questions[index];
    currentQuestionId = question.question_id;

    // Update question info
    document.getElementById('questionId').textContent = question.question_id;
    document.getElementById('questionType').textContent = question.type || 'N/A';
    document.getElementById('questionGrade').textContent = formatGrade(question.grade);
    document.getElementById('questionDifficulty').textContent = question.difficulty || 'N/A';
    document.getElementById('questionCategory').textContent = question.category || 'N/A';
    document.getElementById('questionDiscipline').textContent = question.discipline || 'N/A';
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
    document.getElementById('explanationQualityGroup').style.display = isMCQ ? 'none' : 'block';

    // Clear all button states first
    clearButtonState('completeness');
    clearButtonState('factualCorrectness');
    clearButtonState('mcqQuality');
    clearButtonState('explanationQuality');
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
    
    // Convert {{MATH}}...{{/MATH}} to inline math
    text = text.replace(/\{\{MATH\}\}(.*?)\{\{\/MATH\}\}/g, (match, content) => {
        return `\\(${content.trim()}\\)`;
    });
    
    // Convert {{MATHBLOCK}}...{{/MATHBLOCK}} to block math
    text = text.replace(/\{\{MATHBLOCK\}\}(.*?)\{\{\/MATHBLOCK\}\}/g, (match, content) => {
        return `\\[${content.trim()}\\]`;
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
    }
}

function jumpToQuestion() {
    const input = document.getElementById('jumpToInput');
    const questionNum = parseInt(input.value);
    if (questionNum >= 1 && questionNum <= questions.length) {
        displayQuestion(questionNum - 1);
        updateProgress();
        input.value = '';
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
    if (evaluation.mcq_quality !== undefined && evaluation.mcq_quality !== null) {
        setButtonState('mcqQuality', evaluation.mcq_quality.toString());
    } else {
        clearButtonState('mcqQuality');
    }
    
    if (evaluation.explanation_quality !== undefined && evaluation.explanation_quality !== null) {
        setButtonState('explanationQuality', evaluation.explanation_quality.toString());
    } else {
        clearButtonState('explanationQuality');
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
    const mcqQuality = getButtonValue('mcqQuality');
    const explanationQuality = getButtonValue('explanationQuality');
    const cognitiveDemand = getButtonValue('cognitiveDemand');
    const reasoning = document.getElementById('reasoning').value;
    
    // Validate that all required fields are filled
    const missingFields = [];
    if (!completeness) missingFields.push('Completeness Check');
    if (!factualCorrectness) missingFields.push('Factual Correctness Check');
    
    // Check Phase 2 fields based on question type
    const isMCQ = questions[currentQuestionIndex]?.type === 'MCQ';
    if (isMCQ && !mcqQuality) {
        missingFields.push('MCQ Quality');
    } else if (!isMCQ && !explanationQuality) {
        missingFields.push('Explanation Quality');
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
        const mcqQ = mcqQuality !== '' ? parseInt(mcqQuality) : null;
        const expQ = explanationQuality !== '' ? parseInt(explanationQuality) : null;
        const cogD = cognitiveDemand !== '' ? parseInt(cognitiveDemand) : null;
        
        // Calculate total score: MCQ Quality (0-6) + Cognitive Demand (0-4) OR Explanation Quality (0-6) + Cognitive Demand (0-4)
        if (mcqQ !== null && cogD !== null) {
            totalScore = mcqQ + cogD;
        } else if (expQ !== null && cogD !== null) {
            totalScore = expQ + cogD;
        } else if (mcqQ !== null) {
            totalScore = mcqQ;
        } else if (expQ !== null) {
            totalScore = expQ;
        } else if (cogD !== null) {
            totalScore = cogD;
        }
    }
    
    const evaluation = {
        question_id: currentQuestionId,
        completeness: completeness || null,
        factual_correctness: factualCorrectness || null,
        mcq_quality: mcqQuality !== '' ? parseInt(mcqQuality) : null,
        explanation_quality: explanationQuality !== '' ? parseInt(explanationQuality) : null,
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
    const mcqQuality = getButtonValue('mcqQuality');
    const explanationQuality = getButtonValue('explanationQuality');
    const cognitiveDemand = getButtonValue('cognitiveDemand');
    
    let totalScore = 0;
    let status = '';
    
    if (completeness === 'FAIL' || factualCorrectness === 'FAIL') {
        totalScore = 0;
        status = '';
    } else if (completeness === 'PASS' && factualCorrectness === 'PASS') {
        const mcqQ = mcqQuality !== '' ? parseInt(mcqQuality) : null;
        const expQ = explanationQuality !== '' ? parseInt(explanationQuality) : null;
        const cogD = cognitiveDemand !== '' ? parseInt(cognitiveDemand) : null;
        
        // Calculate total score: MCQ Quality (0-6) + Cognitive Demand (0-4) OR Explanation Quality (0-6) + Cognitive Demand (0-4)
        if (mcqQ !== null && cogD !== null) {
            totalScore = mcqQ + cogD;
        } else if (expQ !== null && cogD !== null) {
            totalScore = expQ + cogD;
        } else if (mcqQ !== null) {
            totalScore = mcqQ; // Only MCQ quality set
        } else if (expQ !== null) {
            totalScore = expQ; // Only explanation quality set
        } else if (cogD !== null) {
            totalScore = cogD; // Only cognitive demand set
        }
        
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
    document.getElementById('exportYamlBtn').disabled = !hasEvaluations;
}

function exportToYaml() {
    if (Object.keys(evaluations).length === 0) {
        alert('No evaluations to export.');
        return;
    }
    
    const yamlData = {
        evaluations: {}
    };
    
    // Sort by question_id
    const sortedIds = Object.keys(evaluations).sort((a, b) => {
        const aNum = parseInt(a) || 0;
        const bNum = parseInt(b) || 0;
        return aNum - bNum;
    });
    
    sortedIds.forEach(id => {
        yamlData.evaluations[id] = evaluations[id];
    });
    
    const yamlString = jsyaml.dump(yamlData, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
    });
    
    // Create download
    const blob = new Blob([yamlString], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluations_${new Date().toISOString().split('T')[0]}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('questionEvaluations', JSON.stringify(evaluations));
        localStorage.setItem('questionEvaluationsIndex', currentQuestionIndex.toString());
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
    } catch (e) {
        console.warn('Could not load from localStorage:', e);
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
    
    // Load criteria from the markdown file via fetch
    fetch('__question eval_new.md')
        .then(response => {
            if (!response.ok) {
                throw new Error('Could not load criteria file');
            }
            return response.text();
        })
        .then(text => {
            // Convert markdown to HTML (simple conversion)
            const html = convertMarkdownToHtml(text);
            criteriaContent.innerHTML = html;
        })
        .catch(error => {
            // If file not found, use embedded criteria
            criteriaContent.innerHTML = getEmbeddedCriteria();
        });
}

function convertMarkdownToHtml(markdown) {
    let html = markdown;
    
    // Remove the SYSTEM_PROMPT and HUMAN_PROMPT_TEMPLATE wrapper
    html = html.replace(/SYSTEM_PROMPT\s*=\s*"""/g, '');
    html = html.replace(/HUMAN_PROMPT_TEMPLATE\s*=\s*"""/g, '');
    html = html.replace(/"""$/gm, '');
    
    // Convert headers
    html = html.replace(/^### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2>$1</h2>');
    
    // Convert bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert code/backticks
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Convert lists
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Convert horizontal rules
    html = html.replace(/^---$/gim, '<hr>');
    
    // Convert line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    
    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>(<h[2-4]>)/g, '$1');
    html = html.replace(/(<\/h[2-4]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    
    return html;
}

function getEmbeddedCriteria() {
    return `
        <h3>PHASE 1: GATE-KEEPING CRITERIA</h3>
        
        <h4>1. COMPLETENESS CHECK (Pass/Fail)</h4>
        <p><strong>Question:</strong> Is the question package complete with all required components?</p>
        <p><strong>Required components:</strong></p>
        <ul>
            <li>Question statement (prompt)</li>
            <li>Answer key</li>
            <li>Explanation/solution</li>
            <li><strong>For MCQ:</strong> Exactly 4-5 answer options total (including one correct answer and 3-4 distractors)</li>
            <li><strong>For Open-ended:</strong> Model answer or scoring rubric with clear expectations</li>
        </ul>
        <p><strong>FAIL if any of these are true:</strong></p>
        <ul>
            <li>Missing any required component listed above</li>
            <li>Truncated or incomplete content</li>
            <li>Broken formatting or LaTeX rendering errors</li>
            <li>Placeholders present (e.g., "[insert image]", "[explanation here]", "TBD")</li>
            <li>MCQ has wrong number of options (not 4-5 total)</li>
            <li>Open-ended lacks any guidance for what constitutes a good answer</li>
        </ul>
        <p><strong>Result:</strong> <code>PASS</code> or <code>FAIL</code></p>
        <p><strong>If FAIL, the question cannot proceed. Evaluation stops here. Question immediately gets a 0.</strong></p>
        
        <hr>
        
        <h4>2. FACTUAL CORRECTNESS CHECK (Pass/Fail)</h4>
        <p><strong>Question:</strong> Is the question factually and conceptually correct, and is the answer key correct?</p>
        <p><strong>FAIL if any of these are true:</strong></p>
        <ul>
            <li>Contains factual errors, incorrect concepts, or false information</li>
            <li>Answer key is wrong or misleading</li>
            <li>Logical contradictions or impossible scenarios</li>
            <li>Multiple defensible correct answers exist (unless intentionally designed as such)</li>
        </ul>
        <p><strong>Result:</strong> <code>PASS</code> or <code>FAIL</code></p>
        <p><strong>If FAIL, the question cannot proceed. Evaluation stops here. Question immediately gets a 0.</strong></p>
        
        <hr>
        
        <h3>PHASE 2: QUALITY ASSESSMENT</h3>
        <p>Questions that pass Phase 1 are now evaluated for quality.</p>
        <p><strong>Note:</strong> Both MCQ and open-ended questions are scored out of <strong>10 points maximum</strong> to ensure standardization across question types.</p>
        
        <hr>
        
        <h4>3. MCQ QUALITY (0-6) [MCQ only]</h4>
        <p>This criterion evaluates distractor quality and explanation quality for MCQ questions. <strong>Be very strict—only award high scores when distractors are excellent and explanations are pedagogically valuable.</strong></p>
        <p><strong>Evaluate:</strong> How good are the distractors AND how well are they explained?</p>
        <ul>
            <li><strong>0-1:</strong> Distractors are obviously wrong, nonsensical, use "all/none of the above" cop-outs, vary wildly in plausibility, OR no explanations provided</li>
            <li><strong>2-3:</strong> Distractors are plausible but <strong>generic</strong>—they don't represent specific, documented misconceptions. OR explanations are present but superficial.</li>
            <li><strong>4-5:</strong> Distractors represent <strong>specific misconceptions</strong> and are reasonably balanced, AND explanations identify why the correct answer is correct and attempt to name misconceptions</li>
            <li><strong>6:</strong> <strong>Excellence.</strong> Each distractor represents a <strong>specific, well-documented misconception</strong> that is balanced in plausibility. Explanations clearly state why the correct answer is correct with strong reasoning, AND <strong>explicitly name the specific misconception or error pattern</strong> each distractor represents.</li>
        </ul>
        
        <hr>
        
        <h4>4. EXPLANATION QUALITY (0-6) [Open-ended only]</h4>
        <p>Does the model answer or rubric provide clear, actionable guidance for what a good response includes? <strong>Be very strict—only award high scores when the guidance is comprehensive and pedagogically valuable.</strong></p>
        <ul>
            <li><strong>0-1:</strong> No model answer or rubric provided, OR guidance is too vague to be actionable</li>
            <li><strong>2-3:</strong> Provides some guidance but incomplete—e.g., lists expected elements but no indication of quality levels</li>
            <li><strong>4-5:</strong> Provides a reasonably detailed model answer or rubric with clear expectations and some indication of quality levels</li>
            <li><strong>6:</strong> <strong>Excellence.</strong> Provides a <strong>comprehensive, detailed model answer</strong> showing exactly what "good" performance looks like with full reasoning, OR a <strong>complete rubric with specific criteria, clear quality levels, and objective scoring guidance</strong></li>
        </ul>
        
        <hr>
        
        <h4>5. COGNITIVE DEMAND APPROPRIATENESS (0-4)</h4>
        <p><strong>Question:</strong> Is this question correctly categorized for the assigned grade and difficulty?</p>
        <p><strong>Evaluation Process:</strong></p>
        <p><strong>Step 1:</strong> Identify the Bloom's Taxonomy level (Remember, Understand, Apply, Analyze, Evaluate, Create)</p>
        <p><strong>Step 2:</strong> Map Bloom's level to expected difficulty:</p>
        <ul>
            <li><strong>Remember/Understand</strong> → Low difficulty (100-300)</li>
            <li><strong>Apply/Analyze</strong> → Medium difficulty (400-600)</li>
            <li><strong>Evaluate/Create</strong> → High difficulty (700-900)</li>
        </ul>
        <p><strong>Step 3:</strong> Evaluate alignment:</p>
        <ul>
            <li><strong>0-1:</strong> Bloom's level and assigned difficulty are severely mismatched (off by 2+ categories)</li>
            <li><strong>2-3:</strong> Bloom's level and assigned difficulty are moderately mismatched (off by 1 category)</li>
            <li><strong>4:</strong> Bloom's level aligns with assigned difficulty range (within the correct category or at most at the boundary)</li>
        </ul>
    `;
}

