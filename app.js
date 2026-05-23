// API and Application State
let appState = {
    apiKey: localStorage.getItem('axis_api_key') || '',
    selectedModel: localStorage.getItem('axis_model') || 'gemini-2.5-flash',
    systemPrompt: localStorage.getItem('axis_system_prompt') || 'You are Axis AI, a highly professional, elite engineering and scientific assistant. Provide precise mathematical formulas in LaTeX, clear descriptions, structural calculations, and coding scripts where relevant. Keep your responses technical, accurate, and extremely well-formatted.',
    temperature: parseFloat(localStorage.getItem('axis_temp')) || 0.2,
    sessions: JSON.parse(localStorage.getItem('axis_sessions')) || [],
    activeSessionId: localStorage.getItem('axis_active_session_id') || null,
    isRecording: false,
    recognition: null
};

// Quick Reference Database
const refDatabase = [
    { name: "Young's Modulus (Structural Steel)", value: "200 GPa", type: "constant", category: "Materials" },
    { name: "Young's Modulus (Aluminum 6061-T6)", value: "69 GPa", type: "constant", category: "Materials" },
    { name: "Young's Modulus (Titanium Grade 5)", value: "114 GPa", type: "constant", category: "Materials" },
    { name: "Density of Structural Steel", value: "7850 kg/m³", type: "constant", category: "Materials" },
    { name: "Density of Aluminum", value: "2700 kg/m³", type: "constant", category: "Materials" },
    { name: "Acceleration of Gravity (g)", value: "9.81 m/s²", type: "constant", category: "Physics" },
    { name: "Speed of Light (c)", value: "299,792,458 m/s", type: "constant", category: "Physics" },
    { name: "Planck's Constant (h)", value: "6.626 x 10⁻³⁴ J·s", type: "constant", category: "Physics" },
    { name: "Universal Gas Constant (R)", value: "8.314 J/(mol·K)", type: "constant", category: "Physics" },
    { name: "Stefan-Boltzmann Constant (σ)", value: "5.670 x 10⁻⁸ W/(m²·K⁴)", type: "constant", category: "Physics" },
    { name: "Boltzmann Constant (k)", value: "1.380 x 10⁻²³ J/K", type: "constant", category: "Physics" },
    { name: "Euler-Bernoulli Beam Deflection", value: "δ_max = P * L³ / (48 * E * I) [Center Point Load]", type: "formula", category: "Structural" },
    { name: "Bending Stress Formula", value: "σ = M * y / I", type: "formula", category: "Structural" },
    { name: "Reynolds Number", value: "Re = ρ * v * D / μ", type: "formula", category: "Fluids" },
    { name: "Bernoulli Equation", value: "p + 0.5*ρ*v² + ρ*g*h = constant", type: "formula", category: "Fluids" },
    { name: "Carnot Thermal Efficiency", value: "η_max = 1 - (T_L / T_H)", type: "formula", category: "Thermodynamics" },
    { name: "Ideal Gas Law", value: "P * V = n * R * T", type: "formula", category: "Thermodynamics" },
    { name: "Ohm's Law", value: "V = I * R", type: "formula", category: "Electrical" },
    { name: "Fourier's Law of Heat Conduction", value: "q = -k * dT/dx", type: "formula", category: "Thermodynamics" }
];

// Unit Conversion Coefficients (values relative to base unit)
const unitCategories = {
    pressure: {
        base: 'Pa',
        units: {
            'Pa': 1,
            'kPa': 1000,
            'MPa': 1000000,
            'psi': 6894.76,
            'bar': 100000,
            'atm': 101325
        }
    },
    force: {
        base: 'N',
        units: {
            'N': 1,
            'kN': 1000,
            'lbf': 4.44822,
            'kgf': 9.80665
        }
    },
    temp: {
        base: 'C',
        custom: true // custom math for temp
    },
    length: {
        base: 'm',
        units: {
            'm': 1,
            'mm': 0.001,
            'cm': 0.01,
            'in': 0.0254,
            'ft': 0.3048,
            'yd': 0.9144
        }
    },
    mass: {
        base: 'kg',
        units: {
            'kg': 1,
            'g': 0.001,
            'lb': 0.453592,
            'oz': 0.0283495
        }
    },
    energy: {
        base: 'J',
        units: {
            'J': 1,
            'kJ': 1000,
            'cal': 4.184,
            'kcal': 4184,
            'Wh': 3600,
            'kWh': 3600000
        }
    }
};

// Elements
const threadContainer = document.getElementById('threadContainer');
const messageContainer = document.getElementById('messageContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const themeToggle = document.getElementById('themeToggle');
const newSessionBtn = document.getElementById('newSessionBtn');
const sessionsList = document.getElementById('sessionsList');
const activeSessionTitle = document.getElementById('activeSessionTitle');
const modelSelect = document.getElementById('modelSelect');
const selectedModelLabel = document.getElementById('selectedModelLabel');
const statusMessage = document.getElementById('statusMessage');
const keyBadge = document.getElementById('keyBadge');
const connStatusText = document.getElementById('connStatusText');
const connStatusIcon = document.getElementById('connStatusIcon');
const consoleStatusBar = document.getElementById('consoleStatusBar');
const apiKeyAlert = document.getElementById('apiKeyAlert');
const configureKeyQuickBtn = document.getElementById('configureKeyQuickBtn');
const dashboardView = document.getElementById('dashboardView');

// Modal Elements
const settingsModal = document.getElementById('settingsModal');
const openSettingsBtn = document.getElementById('openSettingsBtn');
const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const apiKeyInput = document.getElementById('apiKeyInput');
const systemPromptInput = document.getElementById('systemPromptInput');
const tempInput = document.getElementById('tempInput');
const tempValue = document.getElementById('tempValue');
const toggleApiKeyVisBtn = document.getElementById('toggleApiKeyVisBtn');
const keyVisIcon = document.getElementById('keyVisIcon');

// Sandbox Elements
const sandboxModal = document.getElementById('sandboxModal');
const closeSandboxModalBtn = document.getElementById('closeSandboxModalBtn');
const modalSandboxIframe = document.getElementById('modalSandboxIframe');
const sandboxIframe = document.getElementById('sandboxIframe');
const sandboxRunBtn = document.getElementById('sandboxRunBtn');
const sandboxClearBtn = document.getElementById('sandboxClearBtn');
let activeSandboxCode = '';

// Exporters
const exportPdfBtn = document.getElementById('exportPdfBtn');
const exportMdBtn = document.getElementById('exportMdBtn');

// Sidebar toggle button (for responsive view)
const menuBtn = document.getElementById('menuBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const sidebar = document.getElementById('sidebar');
const utilsPanel = document.getElementById('utilsPanel');
const toggleUtilsBtn = document.getElementById('toggleUtilsBtn');

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose'
});

// Setup Marked choices
marked.setOptions({
    breaks: true,
    gfm: true
});

// --- Lifecycle & Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
    setupVoiceRecognition();
});

function initApp() {
    // Populate Modal Settings inputs
    apiKeyInput.value = appState.apiKey;
    modelSelect.value = appState.selectedModel;
    selectedModelLabel.textContent = appState.selectedModel;
    systemPromptInput.value = appState.systemPrompt;
    tempInput.value = appState.temperature;
    tempValue.textContent = appState.temperature;
    
    updateAPIKeyBadge();
    
    // Load conversations
    if (appState.sessions.length === 0) {
        createNewSession("Initial Analysis Env");
    } else {
        if (!appState.activeSessionId) {
            appState.activeSessionId = appState.sessions[0].id;
        }
        renderSessionsList();
        loadSession(appState.activeSessionId);
    }
    
    // Initialize Utilities Content
    setupUnitConverter();
    setupQuickReference();
    setupMathSolver();
    
    // Theme loading
    const savedTheme = localStorage.getItem('axis_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);
}

function updateAPIKeyBadge() {
    if (appState.apiKey) {
        keyBadge.textContent = "Gemini AI";
        keyBadge.className = "badge success";
        connStatusIcon.style.color = "var(--success)";
        connStatusIcon.innerHTML = `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>`;
        connStatusText.textContent = "AI Connected • Gemini Engine Active";
        if (apiKeyAlert) apiKeyAlert.style.display = 'none';
        consoleStatusBar.className = "console-status-bar connected";
        selectedModelLabel.textContent = appState.selectedModel;
    } else {
        keyBadge.textContent = "Free AI";
        keyBadge.className = "badge success";
        connStatusIcon.style.color = "var(--success)";
        connStatusIcon.innerHTML = `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>`;
        connStatusText.textContent = "AI Connected • Free AI Engine Active (No Key Required)";
        if (apiKeyAlert) apiKeyAlert.style.display = 'none';
        consoleStatusBar.className = "console-status-bar connected";
        selectedModelLabel.textContent = "Free GPT-OSS";
    }
}

// --- Session & History Managers ---
function createNewSession(title = "New Analysis") {
    const id = 'session_' + Date.now();
    const newSession = {
        id: id,
        title: title,
        messages: [],
        systemPrompt: appState.systemPrompt,
        model: appState.selectedModel,
        temp: appState.temperature
    };
    appState.sessions.unshift(newSession);
    appState.activeSessionId = id;
    saveAppState();
    renderSessionsList();
    loadSession(id);
    
    // Smooth transition
    dashboardView.classList.add('fade-in');
    setTimeout(() => {
        dashboardView.classList.remove('fade-in');
    }, 400);
}

function saveAppState() {
    localStorage.setItem('axis_sessions', JSON.stringify(appState.sessions));
    localStorage.setItem('axis_active_session_id', appState.activeSessionId);
    localStorage.setItem('axis_api_key', appState.apiKey);
    localStorage.setItem('axis_model', appState.selectedModel);
    localStorage.setItem('axis_system_prompt', appState.systemPrompt);
    localStorage.setItem('axis_temp', appState.temperature);
}

function renderSessionsList() {
    sessionsList.innerHTML = '';
    appState.sessions.forEach(sess => {
        const item = document.createElement('div');
        item.className = `nav-item session-nav-item ${sess.id === appState.activeSessionId ? 'active' : ''}`;
        item.dataset.id = sess.id;
        
        item.innerHTML = `
            <i data-lucide="message-square" style="width: 16px;"></i>
            <span class="session-name-txt" title="Double click to rename">${sess.title}</span>
            <button class="delete-session-btn" title="Delete Session"><i data-lucide="trash-2"></i></button>
        `;
        
        // Load Session on click
        item.addEventListener('click', (e) => {
            if (e.target.closest('.delete-session-btn')) {
                e.stopPropagation();
                deleteSession(sess.id);
                return;
            }
            loadSession(sess.id);
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('show');
            }
        });
        
        // Rename Session on double click
        const textSpan = item.querySelector('.session-name-txt');
        textSpan.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const originalText = textSpan.textContent;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = originalText;
            input.className = 'session-rename-input';
            textSpan.replaceWith(input);
            input.focus();
            input.select();
            
            const handleRename = () => {
                const newTitle = input.value.trim() || originalText;
                sess.title = newTitle;
                saveAppState();
                renderSessionsList();
                if (sess.id === appState.activeSessionId) {
                    activeSessionTitle.textContent = newTitle;
                }
            };
            
            input.addEventListener('blur', handleRename);
            input.addEventListener('keypress', (keyEvent) => {
                if (keyEvent.key === 'Enter') handleRename();
            });
        });
        
        sessionsList.appendChild(item);
    });
    lucide.createIcons();
}

function loadSession(id) {
    appState.activeSessionId = id;
    saveAppState();
    
    // Highlight sidebar
    const items = sessionsList.querySelectorAll('.session-nav-item');
    items.forEach(el => {
        el.classList.toggle('active', el.dataset.id === id);
    });
    
    const session = appState.sessions.find(s => s.id === id);
    if (!session) return;
    
    activeSessionTitle.textContent = session.title;
    messageContainer.innerHTML = '';
    
    if (session.messages.length === 0) {
        dashboardView.style.display = 'block';
    } else {
        dashboardView.style.display = 'none';
        session.messages.forEach(msg => {
            renderMessageNode(msg.content, msg.role, false);
        });
        // Render math in loaded messages
        document.querySelectorAll('.message-node.ai-node').forEach(node => {
            renderMathAndIntegrations(node);
        });
    }
    
    // Scroll to bottom
    scrollToBottom();
}

function deleteSession(id) {
    const confirmDelete = confirm("Are you sure you want to delete this session?");
    if (!confirmDelete) return;
    
    const index = appState.sessions.findIndex(s => s.id === id);
    if (index === -1) return;
    
    appState.sessions.splice(index, 1);
    
    if (appState.sessions.length === 0) {
        createNewSession("Initial Analysis Env");
    } else {
        if (appState.activeSessionId === id) {
            appState.activeSessionId = appState.sessions[0].id;
        }
        saveAppState();
        renderSessionsList();
        loadSession(appState.activeSessionId);
    }
}

// --- Text-to-Speech & Speech-to-Text ---
function setupVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        voiceBtn.style.display = 'none';
        return;
    }
    
    appState.recognition = new SpeechRecognition();
    appState.recognition.continuous = false;
    appState.recognition.lang = 'en-US';
    appState.recognition.interimResults = false;
    
    appState.recognition.onstart = () => {
        appState.isRecording = true;
        voiceBtn.classList.add('recording');
        voiceBtn.innerHTML = `<i data-lucide="mic-off"></i>`;
        lucide.createIcons();
    };
    
    appState.recognition.onend = () => {
        appState.isRecording = false;
        voiceBtn.classList.remove('recording');
        voiceBtn.innerHTML = `<i data-lucide="mic"></i>`;
        lucide.createIcons();
    };
    
    appState.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const currentText = userInput.value;
        userInput.value = currentText + (currentText ? ' ' : '') + transcript;
        userInput.dispatchEvent(new Event('input'));
    };
    
    voiceBtn.addEventListener('click', () => {
        if (appState.isRecording) {
            appState.recognition.stop();
        } else {
            appState.recognition.start();
        }
    });
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        // Cancel active speeches
        window.speechSynthesis.cancel();
        
        // Strip markdown & math syntaxes for readable audio
        let cleanText = text
            .replace(/\$\$(.*?)\$\$/g, ' equation ')
            .replace(/\$(.*?)\$/g, ' $1 ')
            .replace(/[#*`_-]/g, '')
            .replace(/```[\s\S]*?```/g, ' [code block omitted] ');
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

// --- Theme Switcher ---
function updateThemeUI(theme) {
    const icon = themeToggle.querySelector('#themeIcon');
    const txt = themeToggle.querySelector('#themeText');
    
    if (theme === 'dark') {
        icon.setAttribute('data-lucide', 'sun');
        txt.textContent = 'Light Mode';
    } else {
        icon.setAttribute('data-lucide', 'moon');
        txt.textContent = 'Dark Mode';
    }
    lucide.createIcons();
}

// --- Message Rendering & Dynamic Processing (Math, Chart, Mermaid, Sandbox) ---
function renderMessageNode(content, role = 'user', shouldScroll = true) {
    const node = document.createElement('div');
    node.className = `message-node ${role}-node`;
    
    const icon = role === 'user' ? 'user' : 'cpu';
    const label = role === 'user' ? 'Engineering Analyst' : 'Axis Intelligence Kernel';
    
    let actionsHtml = '';
    if (role === 'ai') {
        actionsHtml = `
            <div class="message-actions">
                <button class="msg-action-btn speak-btn" title="Read Aloud"><i data-lucide="volume-2"></i></button>
                <button class="msg-action-btn copy-btn" title="Copy Content"><i data-lucide="copy"></i></button>
            </div>
        `;
    }
    
    node.innerHTML = `
        <div class="node-avatar">
            <i data-lucide="${icon}"></i>
        </div>
        <div class="node-content">
            <div class="node-header-row">
                <div class="node-role">${label}</div>
                ${actionsHtml}
            </div>
            <div class="node-body">
                ${role === 'ai' ? marked.parse(content) : `<p>${escapeHTML(content)}</p>`}
            </div>
        </div>
    `;
    
    messageContainer.appendChild(node);
    lucide.createIcons();
    
    // Add Event Listeners for actions
    if (role === 'ai') {
        const speakBtn = node.querySelector('.speak-btn');
        speakBtn.addEventListener('click', () => speakText(content));
        
        const copyBtn = node.querySelector('.copy-btn');
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(content);
            copyBtn.innerHTML = `<i data-lucide="check" style="color:var(--success);"></i>`;
            lucide.createIcons();
            setTimeout(() => {
                copyBtn.innerHTML = `<i data-lucide="copy"></i>`;
                lucide.createIcons();
            }, 1500);
        });
    }
    
    if (shouldScroll) {
        scrollToBottom();
    }
    
    return node;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

function renderMathAndIntegrations(messageNode) {
    const body = messageNode.querySelector('.node-body');
    if (!body) return;
    
    // 1. Render LaTeX math (Display $$ and Inline $)
    // Display Math
    body.innerHTML = body.innerHTML.replace(/\$\$(.+?)\$\$/sg, (match, formula) => {
        try {
            return katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false });
        } catch (e) { return match; }
    });
    
    // Inline Math
    body.innerHTML = body.innerHTML.replace(/\$(.+?)\$/g, (match, formula) => {
        try {
            return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false });
        } catch (e) { return match; }
    });
    
    // 2. Render Mermaid.js diagrams
    const codeBlocks = body.querySelectorAll('pre code');
    codeBlocks.forEach((block, blockIndex) => {
        const codeText = block.innerText.trim();
        
        // Handle Mermaid syntax
        if (block.classList.contains('language-mermaid') || codeText.startsWith('graph ') || codeText.startsWith('flowchart ') || codeText.startsWith('sequenceDiagram')) {
            const preElement = block.parentElement;
            const mermaidId = `mermaid_${Date.now()}_${blockIndex}`;
            
            // Create diagram rendering container
            const diagramDiv = document.createElement('div');
            diagramDiv.className = 'mermaid-container';
            diagramDiv.id = mermaidId;
            diagramDiv.innerHTML = `<div class="mermaid-loading"><i data-lucide="loader" class="spin"></i> Rendering diagram...</div>`;
            
            preElement.replaceWith(diagramDiv);
            lucide.createIcons();
            
            try {
                mermaid.render(`${mermaidId}_svg`, codeText).then(({ svg }) => {
                    diagramDiv.innerHTML = svg;
                }).catch(err => {
                    diagramDiv.innerHTML = `<div class="alert-box error" style="margin:0;"><i data-lucide="alert-circle"></i> Mermaid render error: ${err.message || 'Syntax Error'}</div>`;
                    lucide.createIcons();
                });
            } catch (e) {
                diagramDiv.innerHTML = `<div class="alert-box error" style="margin:0;">Error rendering diagram: ${e.message}</div>`;
            }
        } 
        // 3. Render Custom Chart widgets (if AI returns json schema with type: "chart")
        else if (block.classList.contains('language-json')) {
            try {
                const parsed = JSON.parse(codeText);
                if (parsed.type === 'chart') {
                    const preElement = block.parentElement;
                    const canvasId = `chart_${Date.now()}_${blockIndex}`;
                    
                    const chartContainer = document.createElement('div');
                    chartContainer.className = 'chart-widget-container';
                    chartContainer.innerHTML = `
                        <div class="chart-widget-title">${parsed.title || 'Dynamic Data Plot'}</div>
                        <canvas id="${canvasId}"></canvas>
                    `;
                    preElement.replaceWith(chartContainer);
                    
                    const ctx = document.getElementById(canvasId).getContext('2d');
                    new Chart(ctx, {
                        type: parsed.chartType || 'line',
                        data: parsed.data,
                        options: parsed.options || {
                            responsive: true,
                            plugins: {
                                legend: { labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() } }
                            },
                            scales: {
                                x: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: 'rgba(128,128,128,0.8)' } },
                                y: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: 'rgba(128,128,128,0.8)' } }
                            }
                        }
                    });
                }
            } catch (e) {
                // Not chart JSON, ignore
            }
        }
        // 4. Inject Sandbox execution overlay button for code elements (HTML/CSS/JS)
        else if (block.classList.contains('language-html') || block.classList.contains('language-xml') || block.classList.contains('language-javascript') || block.classList.contains('language-css')) {
            const preElement = block.parentElement;
            
            // Add a run button to the top right of the code block
            const actionContainer = document.createElement('div');
            actionContainer.className = 'code-block-header-actions';
            
            const runBtn = document.createElement('button');
            runBtn.className = 'btn-code-run';
            runBtn.innerHTML = `<i data-lucide="play" style="width:12px;height:12px;"></i> Run Code`;
            
            actionContainer.appendChild(runBtn);
            preElement.style.position = 'relative';
            preElement.appendChild(actionContainer);
            lucide.createIcons();
            
            runBtn.addEventListener('click', () => {
                let codeToRun = codeText;
                
                // If it is just JS or CSS, wrap it in a structural body
                if (block.classList.contains('language-javascript')) {
                    codeToRun = `<!DOCTYPE html><html><head><style>body { font-family: sans-serif; padding: 20px; color: #333; }</style></head><body><h3>JavaScript Console Output:</h3><div id="output"></div><script>
                        const outputDiv = document.getElementById('output');
                        const log = console.log;
                        console.log = (...args) => {
                            outputDiv.innerHTML += args.join(' ') + '<br>';
                            log(...args);
                        };
                        try {
                            ${codeText}
                        } catch(e) {
                            outputDiv.innerHTML += '<span style="color:red">Error: ' + e.message + '</span>';
                        }
                    </script></body></html>`;
                } else if (block.classList.contains('language-css')) {
                    codeToRun = `<!DOCTYPE html><html><head><style>${codeText}</style></head><body><div class="test-element">CSS Styles Applied</div></body></html>`;
                }
                
                // Set to active code & run sandbox
                activeSandboxCode = codeToRun;
                runSandbox();
            });
        }
    });
}

function runSandbox() {
    // Open the utility tab
    const sandboxTabBtn = document.querySelector('.tab-btn[data-tab="sandbox"]');
    if (sandboxTabBtn) {
        sandboxTabBtn.click();
    }
    
    // Inject code into sandbox iframe
    const doc = sandboxIframe.contentDocument || sandboxIframe.contentWindow.document;
    doc.open();
    doc.write(activeSandboxCode);
    doc.close();
    
    // Also trigger full screen modal check
    if (window.innerWidth <= 1200) {
        sandboxModal.classList.add('show');
        const modalDoc = modalSandboxIframe.contentDocument || modalSandboxIframe.contentWindow.document;
        modalDoc.open();
        modalDoc.write(activeSandboxCode);
        modalDoc.close();
    }
}

function scrollToBottom() {
    threadContainer.scrollTop = threadContainer.scrollHeight;
}

// --- Dynamic Technical Loading Mock Logs ---
function showLoadingNode() {
    const loadingNode = document.createElement('div');
    loadingNode.className = 'message-node ai-node loading-node';
    loadingNode.innerHTML = `
        <div class="node-avatar"><i data-lucide="loader" class="spin"></i></div>
        <div class="node-content">
            <div class="node-role">System Computational Pipeline</div>
            <div class="node-body loading-logs">
                <p class="log-line animate-log-1">[INFO] Initializing computational API socket...</p>
                <p class="log-line animate-log-2" style="display:none;">[INFO] Resolving context tensors (${appState.sessions.find(s=>s.id===appState.activeSessionId)?.messages.length || 0} messages)...</p>
                <p class="log-line animate-log-3" style="display:none;">[INFO] Querying model ${appState.selectedModel}...</p>
                <p class="log-line animate-log-4" style="display:none;">[DATA] Streaming response packets...</p>
            </div>
        </div>
    `;
    messageContainer.appendChild(loadingNode);
    lucide.createIcons();
    scrollToBottom();
    
    // Animate computational log feeds sequentially
    setTimeout(() => {
        const line2 = loadingNode.querySelector('.animate-log-2');
        if (line2) line2.style.display = 'block';
        scrollToBottom();
    }, 450);
    
    setTimeout(() => {
        const line3 = loadingNode.querySelector('.animate-log-3');
        if (line3) line3.style.display = 'block';
        scrollToBottom();
    }, 900);

    setTimeout(() => {
        const line4 = loadingNode.querySelector('.animate-log-4');
        if (line4) line4.style.display = 'block';
        scrollToBottom();
    }, 1400);

    return loadingNode;
}

// --- Core API Integration (Google Gemini API) ---
async function generateAIResponse(query) {
    const currentSession = appState.sessions.find(s => s.id === appState.activeSessionId);
    if (!currentSession) return;
    
    // Add user message to active state
    currentSession.messages.push({ role: 'user', content: query, timestamp: Date.now() });
    
    // Hide dashboard, add user node
    dashboardView.style.display = 'none';
    renderMessageNode(query, 'user');
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Show technical logs loader
    const loader = showLoadingNode();
    
    // Create the complete request context
    const chatHistory = currentSession.messages;
    
    // Setup model parameters
    const model = appState.selectedModel;
    const apiKey = appState.apiKey;
    
    if (!apiKey) {
        // Free AI Engine Mode (Pollinations AI GPT-OSS)
        try {
            const pollinationsMessages = [];
            if (appState.systemPrompt) {
                pollinationsMessages.push({ role: 'system', content: appState.systemPrompt });
            }
            const contextMessages = chatHistory.slice(-12);
            contextMessages.forEach(msg => {
                pollinationsMessages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            });
            
            const res = await fetch('https://text.pollinations.ai/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: pollinationsMessages,
                    model: 'openai',
                    json: false
                })
            });
            
            if (!res.ok) {
                throw new Error(`HTTP error ${res.status}`);
            }
            
            const replyText = await res.text();
            messageContainer.removeChild(loader);
            
            // Auto title session based on first query
            if (chatHistory.length <= 2) {
                const firstWords = query.split(' ').slice(0, 4).join(' ');
                currentSession.title = firstWords + (query.split(' ').length > 4 ? '...' : '');
                saveAppState();
                renderSessionsList();
            }
            
            currentSession.messages.push({ role: 'ai', content: replyText, timestamp: Date.now() });
            saveAppState();
            
            const responseNode = renderMessageNode(replyText, 'ai');
            renderMathAndIntegrations(responseNode);
            
        } catch (error) {
            messageContainer.removeChild(loader);
            const errMsg = `### ⚠️ Free AI Engine Connection Error\n\nFailed to establish connection with the Free AI API.\n\n**Details:** \`${error.message}\`\n\n**Troubleshooting steps:**\n1. Verify your internet connection.\n2. Try re-running your query.`;
            const responseNode = renderMessageNode(errMsg, 'ai');
            renderMathAndIntegrations(responseNode);
        }
        return;
    }
    
    // Gemini API Mode
    try {
        const systemInstructionPart = { text: appState.systemPrompt };
        const contextMessages = chatHistory.slice(-12);
        const contents = contextMessages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));
        
        const requestBody = {
            contents: contents,
            systemInstruction: {
                parts: [systemInstructionPart]
            },
            generationConfig: {
                temperature: appState.temperature,
                maxOutputTokens: 2500
            }
        };
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error?.message || `HTTP error ${res.status}`);
        }
        
        const data = await res.json();
        messageContainer.removeChild(loader);
        
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received. Please check settings or try again.";
        
        // Auto title session based on first query
        if (chatHistory.length <= 2) {
            const firstWords = query.split(' ').slice(0, 4).join(' ');
            currentSession.title = firstWords + (query.split(' ').length > 4 ? '...' : '');
            saveAppState();
            renderSessionsList();
        }
        
        currentSession.messages.push({ role: 'ai', content: replyText, timestamp: Date.now() });
        saveAppState();
        
        const responseNode = renderMessageNode(replyText, 'ai');
        renderMathAndIntegrations(responseNode);
        
    } catch (error) {
        messageContainer.removeChild(loader);
        const errMsg = `### ⚠️ Computational Pipeline Error\n\nFailed to establish connection with the AI Engine.\n\n**Details:** \`${error.message}\`\n\n**Troubleshooting steps:**\n1. Confirm your Gemini API Key in the **AI Engine Settings**.\n2. Verify your internet connection.\n3. Make sure the selected model is supported with your key.`;
        
        const responseNode = renderMessageNode(errMsg, 'ai');
        renderMathAndIntegrations(responseNode);
    }
}

// Fallback Mock Responses for Demo Mode
function getMockResponse(query) {
    const lower = query.toLowerCase();
    
    if (lower.includes('stress') || lower.includes('beam') || lower.includes('deflection')) {
        return `### Structural Beam Analysis (Demo Mode)

For a simply supported beam under centralized point load $P$, the bending moment is calculated at the critical central section:

$$ M_{max} = \\frac{P L}{4} $$

Maximum deflection occurs at the center:

$$ \\delta_{max} = \\frac{P L^3}{48 E I} $$

Where:
- $P$ is the force applied.
- $L$ is the span length.
- $E$ is Young's Modulus (e.g., $200\\text{ GPa}$ for structural steel).
- $I$ is the Area Moment of Inertia.

*Note: This is a placeholder response. Provide a real Gemini API Key in AI settings to query general physics, formulas, materials, or calculations.*`;
    }
    
    if (lower.includes('chart') || lower.includes('graph') || lower.includes('plot')) {
        return `### Material Property Comparison Chart (Demo Mode)

Below is a plot showing the yield strengths of structural metals:

\`\`\`json
{
  "type": "chart",
  "title": "Yield Strength Comparison (MPa)",
  "chartType": "bar",
  "data": {
    "labels": ["Structural Steel", "Aluminum 6061-T6", "Titanium Grade 5", "Copper C101"],
    "datasets": [{
      "label": "Yield Strength (MPa)",
      "data": [250, 276, 880, 70],
      "backgroundColor": [
        "rgba(54, 162, 235, 0.6)",
        "rgba(255, 206, 86, 0.6)",
        "rgba(75, 192, 192, 0.6)",
        "rgba(255, 99, 132, 0.6)"
      ],
      "borderColor": [
        "rgba(54, 162, 235, 1)",
        "rgba(255, 206, 86, 1)",
        "rgba(75, 192, 192, 1)",
        "rgba(255, 99, 132, 1)"
      ],
      "borderWidth": 1
    }]
  }
}
\`\`\`

*Enable Real AI Mode to dynamically generate data tables, plots, or structural charts for any system!*`;
    }

    if (lower.includes('mermaid') || lower.includes('diagram') || lower.includes('flowchart')) {
        return `### Turbofan Engine Workflow (Demo Mode)

Here is a system flowchart for a two-spool turbofan engine:

\`\`\`mermaid
flowchart TD
    A[Inlet Air] --> B(Fan)
    B --> C[Bypass Stream]
    B --> D[Core Stream]
    D --> E(Low Pressure Compressor)
    E --> F(High Pressure Compressor)
    F --> G{Combustor}
    G --> H(High Pressure Turbine)
    H --> I(Low Pressure Turbine)
    I --> J(Exhaust Nozzle)
    C --> J
\`\`\`

*Configure your API key to generate system flowcharts, engineering pipeline processes, or chemical reactions!*`;
    }

    if (lower.includes('sandbox') || lower.includes('html') || lower.includes('calculator')) {
        return `### Interactive Fluid Reynolds Number Calculator (Demo Mode)

Click **Run Code** below to run this interactive calculation layout:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Segoe UI', system-ui; padding: 20px; background: #fafafa; color: #333; }
  .calc-card { background: white; padding: 24px; border-radius: 12px; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  h2 { margin-top: 0; color: #1e3a8a; }
  .form-group { margin-bottom: 12px; }
  label { display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; }
  input { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 6px; }
  button { width: 100%; background: #2563eb; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; }
  button:hover { background: #1d4ed8; }
  .res { margin-top: 16px; font-weight: bold; padding: 10px; border-radius: 6px; text-align: center; }
  .laminar { background: #dcfce7; color: #166534; }
  .turbulent { background: #fee2e2; color: #991b1b; }
</style>
</head>
<body>
<div class="calc-card">
  <h2>Fluid Reynolds Number</h2>
  <div class="form-group">
    <label>Diameter (m)</label>
    <input type="number" id="dVal" value="0.05" step="0.01">
  </div>
  <div class="form-group">
    <label>Velocity (m/s)</label>
    <input type="number" id="vVal" value="1.2" step="0.1">
  </div>
  <button onclick="calc()">Calculate</button>
  <div id="output" class="res laminar">Re = 60000 (Turbulent)</div>
</div>
<script>
function calc() {
  const d = parseFloat(document.getElementById('dVal').value);
  const v = parseFloat(document.getElementById('vVal').value);
  const density = 1000; // Water
  const viscosity = 0.001;
  const re = (density * v * d) / viscosity;
  const out = document.getElementById('output');
  if(re < 2300) {
     out.className = "res laminar";
     out.textContent = "Re = " + re.toFixed(0) + " (Laminar Flow)";
  } else {
     out.className = "res turbulent";
     out.textContent = "Re = " + re.toFixed(0) + " (Turbulent Flow)";
  }
}
</script>
</body>
</html>
\`\`\`

*Run Code block overlays seamlessly. Enable full AI mode to generate any tailored HTML widget.*`;
    }

    return `### Welcome to Axis AI Workbench (Demo Mode)

I am currently running in **offline demo simulation mode** because no Gemini API Key is configured. 

To make this a fully functional environment capable of answering any science, engineering, maths, or programming question:
1. Click **AI Engine Settings** in the left sidebar.
2. Get a free API key from [Google AI Studio](https://aistudio.google.com/).
3. Save the key in the settings panel.

**Try asking queries containing these keywords for simulations:**
- \`stress\`, \`beam\`, or \`deflection\` (renders LaTeX calculations)
- \`chart\`, \`graph\` or \`plot\` (renders dynamic Chart.js canvas)
- \`mermaid\`, \`flowchart\`, or \`diagram\` (renders flowchart diagrams)
- \`sandbox\` or \`html\` (creates interactive coding sandboxes)`;
}

// --- Sidebar Utilities Functionalities ---

// 1. Unit Converter
function setupUnitConverter() {
    const catSelect = document.getElementById('convCategory');
    const fromUnitSelect = document.getElementById('convFromUnit');
    const toUnitSelect = document.getElementById('convToUnit');
    const fromVal = document.getElementById('convFromValue');
    const toVal = document.getElementById('convToValue');
    
    function populateUnits() {
        const category = catSelect.value;
        fromUnitSelect.innerHTML = '';
        toUnitSelect.innerHTML = '';
        
        if (category === 'temp') {
            const tempUnits = ['Celsius (°C)', 'Fahrenheit (°F)', 'Kelvin (K)'];
            tempUnits.forEach(unit => {
                fromUnitSelect.add(new Option(unit, unit));
                toUnitSelect.add(new Option(unit, unit));
            });
            // default selections
            toUnitSelect.selectedIndex = 2; // Kelvin
        } else {
            const list = Object.keys(unitCategories[category].units);
            list.forEach(unit => {
                fromUnitSelect.add(new Option(unit, unit));
                toUnitSelect.add(new Option(unit, unit));
            });
            // default selections
            if (list.length > 1) toUnitSelect.selectedIndex = 1;
        }
        performConversion();
    }
    
    function performConversion() {
        const category = catSelect.value;
        const val = parseFloat(fromVal.value);
        if (isNaN(val)) {
            toVal.value = '';
            return;
        }
        
        if (category === 'temp') {
            const fromUnit = fromUnitSelect.value;
            const toUnit = toUnitSelect.value;
            let tempC = val;
            
            // convert input to base Celsius
            if (fromUnit.includes('Fahrenheit')) {
                tempC = (val - 32) * 5/9;
            } else if (fromUnit.includes('Kelvin')) {
                tempC = val - 273.15;
            }
            
            // convert Celsius to target unit
            let finalVal = tempC;
            if (toUnit.includes('Fahrenheit')) {
                finalVal = (tempC * 9/5) + 32;
            } else if (toUnit.includes('Kelvin')) {
                finalVal = tempC + 273.15;
            }
            toVal.value = finalVal.toFixed(4).replace(/\.?0+$/, "");
        } else {
            const fromUnit = fromUnitSelect.value;
            const toUnit = toUnitSelect.value;
            const catData = unitCategories[category];
            
            // convert to base unit
            const valInBase = val * catData.units[fromUnit];
            // convert base unit to target unit
            const converted = valInBase / catData.units[toUnit];
            
            toVal.value = converted.toFixed(6).replace(/\.?0+$/, "");
        }
    }
    
    catSelect.addEventListener('change', populateUnits);
    fromUnitSelect.addEventListener('change', performConversion);
    toUnitSelect.addEventListener('change', performConversion);
    fromVal.addEventListener('input', performConversion);
    
    populateUnits();
}

// 2. Math Solver Helper
function setupMathSolver() {
    const mathInput = document.getElementById('mathInput');
    const mathResultVal = document.getElementById('mathResultVal');
    
    mathInput.addEventListener('input', () => {
        const query = mathInput.value.trim();
        if (!query) {
            mathResultVal.textContent = '-';
            return;
        }
        
        try {
            // Safe mathematical transformation and execution
            let processed = query
                .replace(/pi/gi, 'Math.PI')
                .replace(/e/g, 'Math.E')
                .replace(/sin\(/gi, 'Math.sin(')
                .replace(/cos\(/gi, 'Math.cos(')
                .replace(/tan\(/gi, 'Math.tan(')
                .replace(/log\(/gi, 'Math.log10(')
                .replace(/ln\(/gi, 'Math.log(')
                .replace(/sqrt\(/gi, 'Math.sqrt(')
                .replace(/pow\(/gi, 'Math.pow(')
                .replace(/deg/gi, '* Math.PI / 180')
                .replace(/\^/g, '**');
            
            // Simple validation to only allow numbers, math operators, decimals, and Math operations
            if (/^[0-9+\-*/().\sMathPIEsinctalogrdg,**]+$/.test(processed)) {
                const answer = eval(processed);
                if (typeof answer === 'number' && !isNaN(answer)) {
                    mathResultVal.textContent = answer.toLocaleString(undefined, { maximumFractionDigits: 6 });
                } else {
                    mathResultVal.textContent = 'Invalid expression';
                }
            } else {
                mathResultVal.textContent = 'Prohibited characters';
            }
        } catch (e) {
            mathResultVal.textContent = 'Expression error';
        }
    });
}

// 3. Searchable Quick Reference Database
function setupQuickReference() {
    const searchInput = document.getElementById('refSearch');
    const resultsContainer = document.getElementById('refResults');
    
    function renderRefItems(filter = '') {
        resultsContainer.innerHTML = '';
        const lowercaseFilter = filter.toLowerCase();
        
        const filtered = refDatabase.filter(item => 
            item.name.toLowerCase().includes(lowercaseFilter) ||
            item.value.toLowerCase().includes(lowercaseFilter) ||
            item.category.toLowerCase().includes(lowercaseFilter)
        );
        
        if (filtered.length === 0) {
            resultsContainer.innerHTML = `<div style="font-size:0.85rem;color:var(--text-secondary);text-align:center;padding:16px;">No reference records found.</div>`;
            return;
        }
        
        filtered.forEach(item => {
            const card = document.createElement('div');
            card.className = 'ref-item-card';
            card.innerHTML = `
                <div class="ref-item-header">
                    <span class="ref-item-name">${item.name}</span>
                    <span class="ref-item-tag ${item.type}">${item.category}</span>
                </div>
                <div class="ref-item-value">${item.value}</div>
            `;
            
            // Add click-to-copy or click-to-insert capability
            card.addEventListener('click', () => {
                navigator.clipboard.writeText(item.value);
                const valDiv = card.querySelector('.ref-item-value');
                const origVal = valDiv.textContent;
                valDiv.style.color = 'var(--success)';
                valDiv.textContent = 'Copied to Clipboard!';
                setTimeout(() => {
                    valDiv.style.color = '';
                    valDiv.textContent = origVal;
                }, 1000);
            });
            
            resultsContainer.appendChild(card);
        });
    }
    
    searchInput.addEventListener('input', () => {
        renderRefItems(searchInput.value);
    });
    
    renderRefItems();
}

// --- Exporters ---
function setupExporters() {
    exportPdfBtn.addEventListener('click', () => {
        window.print();
    });
    
    exportMdBtn.addEventListener('click', () => {
        const session = appState.sessions.find(s => s.id === appState.activeSessionId);
        if (!session || session.messages.length === 0) return;
        
        let markdownContent = `# ${session.title}\nActive Environment Workspace\n\n`;
        session.messages.forEach(msg => {
            const roleName = msg.role === 'user' ? 'USER ANALYSIS' : 'SYSTEM INTELLIGENCE ASSISTANT';
            markdownContent += `### ${roleName}\n\n${msg.content}\n\n---\n\n`;
        });
        
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${session.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_history.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// --- Event Listeners and Layout Handlers ---
function setupEventListeners() {
    // Send message handling
    sendBtn.addEventListener('click', () => {
        const text = userInput.value.trim();
        if (text) {
            generateAIResponse(text);
        }
    });
    
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    });
    
    // Auto resize text area height dynamically
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
    
    // New Session
    newSessionBtn.addEventListener('click', () => {
        createNewSession("New Session " + (appState.sessions.length + 1));
    });
    
    // Settings Modals Actions
    openSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('show');
    });
    
    configureKeyQuickBtn.addEventListener('click', () => {
        settingsModal.classList.add('show');
    });
    
    closeSettingsModalBtn.addEventListener('click', () => {
        settingsModal.classList.remove('show');
    });
    
    cancelSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('show');
    });
    
    saveSettingsBtn.addEventListener('click', () => {
        appState.apiKey = apiKeyInput.value.trim();
        appState.selectedModel = modelSelect.value;
        appState.systemPrompt = systemPromptInput.value.trim();
        appState.temperature = parseFloat(tempInput.value);
        
        saveAppState();
        updateAPIKeyBadge();
        selectedModelLabel.textContent = appState.selectedModel;
        settingsModal.classList.remove('show');
        
        // Update current session parameter indicators
        const currentSession = appState.sessions.find(s => s.id === appState.activeSessionId);
        if (currentSession) {
            currentSession.model = appState.selectedModel;
            currentSession.temp = appState.temperature;
            currentSession.systemPrompt = appState.systemPrompt;
            saveAppState();
        }
    });
    
    toggleApiKeyVisBtn.addEventListener('click', () => {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            keyVisIcon.setAttribute('data-lucide', 'eye-off');
        } else {
            apiKeyInput.type = 'password';
            keyVisIcon.setAttribute('data-lucide', 'eye');
        }
        lucide.createIcons();
    });
    
    // Theme switch actions
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('axis_theme', next);
        updateThemeUI(next);
    });
    
    // Exporters
    setupExporters();
    
    // Utility Sandbox handlers
    sandboxRunBtn.addEventListener('click', () => {
        runSandbox();
    });
    
    sandboxClearBtn.addEventListener('click', () => {
        const doc = sandboxIframe.contentDocument || sandboxIframe.contentWindow.document;
        doc.open();
        doc.write('<h3>Sandbox Reset</h3>');
        doc.close();
        activeSandboxCode = '';
    });
    
    closeSandboxModalBtn.addEventListener('click', () => {
        sandboxModal.classList.remove('show');
    });
    
    // Quick insertion tool actions
    document.getElementById('insertFormulaBtn').addEventListener('click', () => {
        const cursor = userInput.selectionStart;
        const text = userInput.value;
        userInput.value = text.substring(0, cursor) + "$$ \\delta = \\frac{F L^3}{3 E I} $$" + text.substring(userInput.selectionEnd);
        userInput.focus();
        userInput.dispatchEvent(new Event('input'));
    });
    
    document.getElementById('insertCodeBtn').addEventListener('click', () => {
        const cursor = userInput.selectionStart;
        const text = userInput.value;
        userInput.value = text.substring(0, cursor) + "\n```html\n\n```" + text.substring(userInput.selectionEnd);
        userInput.focus();
        userInput.dispatchEvent(new Event('input'));
    });
    
    clearChatBtn.addEventListener('click', () => {
        const confirmClear = confirm("Clear all messages in the active workspace session?");
        if (!confirmClear) return;
        
        const currentSession = appState.sessions.find(s => s.id === appState.activeSessionId);
        if (currentSession) {
            currentSession.messages = [];
            saveAppState();
            loadSession(appState.activeSessionId);
        }
    });
    
    // Dashboard Prompt Card clicking triggers message submit
    document.querySelectorAll('.prompt-card').forEach(card => {
        card.addEventListener('click', () => {
            const promptText = card.dataset.prompt;
            if (promptText) {
                generateAIResponse(promptText);
            }
        });
    });
    
    // Responsive UI Sidebar Actions
    menuBtn.addEventListener('click', () => {
        sidebar.classList.add('show');
    });
    
    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('show');
    });
    
    // Toggle utilities panel view
    toggleUtilsBtn.addEventListener('click', () => {
        utilsPanel.classList.toggle('show');
        toggleUtilsBtn.classList.toggle('active');
    });
    
    // Utility tab clicks
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const targetTab = btn.dataset.tab;
            document.getElementById(`tab-${targetTab}`).classList.add('active');
        });
    });

    // Temp slider update value text
    tempInput.addEventListener('input', () => {
        tempValue.textContent = tempInput.value;
    });
}
