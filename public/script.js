// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- 全局状态变量 ---
    let allWords = [];
    let currentRoundWords = [];
    let currentIndex = 0;
    let history = new Set();
    
    // --- 分页状态 ---
    let historyCurrentPage = 1;
    const historyItemsPerPage = 10;

    // --- DOM 元素获取 ---
    const startBtn = document.getElementById('start-btn');
    const roundSizeInput = document.getElementById('round-size');
    const controlsPanel = document.querySelector('.controls-panel');
    const flashcardContainer = document.getElementById('flashcard-container');
    const graphIframeWrapper = document.getElementById('graph-iframe-wrapper');
    
    const wordDisplay = document.getElementById('word-display');
    const meaningDisplay = document.getElementById('meaning-display');
    const revealBtn = document.getElementById('reveal-btn');
    
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressIndicator = document.getElementById('progress-indicator');
    const newRoundBtn = document.getElementById('new-round-btn');

    const historyList = document.getElementById('history-list');
    
    const historyPagination = document.getElementById('history-pagination');
    const historyPrevBtn = document.getElementById('history-prev-btn');
    const historyNextBtn = document.getElementById('history-next-btn');
    const historyPageIndicator = document.getElementById('history-page-indicator');

    async function fetchWords() {
        try {
            const response = await fetch('/api/words');
            if (!response.ok) throw new Error('网络响应错误');
            allWords = await response.json();
            if (allWords.length > 0) {
                 startBtn.disabled = false;
                 console.log(`成功加载 ${allWords.length} 个单词。`);
            } else {
                wordDisplay.textContent = "单词库为空";
            }
        } catch (error) {
            console.error('获取单词失败:', error);
            wordDisplay.textContent = "加载单词失败";
        }
    }
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function startNewRound() {
        const roundSize = parseInt(roundSizeInput.value, 10);
        if (isNaN(roundSize) || roundSize <= 0) { alert("请输入有效的单词数量！"); return; }
        if (allWords.length === 0) { alert("单词库为空，无法开始！"); return; }
        
        shuffleArray(allWords);
        const unlearnedWords = allWords.filter(word => ![...history].some(h => h.word === word.word));
        currentRoundWords = unlearnedWords.slice(0, Math.min(roundSize, unlearnedWords.length));
        
        if (currentRoundWords.length === 0) {
            alert("恭喜你，所有单词都学过了！");
            goBackToSetup();
            return;
        }

        currentIndex = 0;
        displayWord();
        controlsPanel.classList.add('hidden');
        flashcardContainer.classList.remove('hidden');
    }

    function displayWord() {
        if (currentRoundWords.length === 0) return;
        const currentWord = currentRoundWords[currentIndex];
        wordDisplay.textContent = currentWord.word;
        meaningDisplay.textContent = currentWord.meaning;
        meaningDisplay.classList.add('hidden');
        updateNavigation();
    }

    function updateNavigation() {
        const total = currentRoundWords.length;
        progressIndicator.textContent = `${currentIndex + 1} / ${total}`;
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === total - 1;
        newRoundBtn.classList.toggle('hidden', currentIndex < total - 1);
    }

    function toggleMeaning() {
        if (currentRoundWords.length === 0) return;
        meaningDisplay.classList.toggle('hidden');
        
        // 当显示释义时，将单词添加到历史记录
        if (!meaningDisplay.classList.contains('hidden')) {
            const currentWord = currentRoundWords[currentIndex];
            
            // 查找历史记录中是否已存在该单词
            const existingEntry = [...history].find(h => h.word === currentWord.word);

            if (existingEntry) {
                // 如果存在，先从Set中删除
                history.delete(existingEntry);
                // 再添加回来，这样它会更新到列表顶部，同时保留isMarked状态
                history.add(existingEntry);
            } else {
                // 如果不存在，添加一个带有isMarked属性的新对象
                history.add({ ...currentWord, isMarked: false });
            }

            historyCurrentPage = 1; // 重置到第一页以显示最新项
            updateHistoryView();
        }
    }

    function updateHistoryView() {
        historyList.innerHTML = '';
        const historyArray = Array.from(history).reverse();

        if (historyArray.length === 0) {
            historyList.innerHTML = '<p class="no-history">暂无记录</p>';
            historyPagination.classList.add('hidden');
            return;
        }
        
        const totalPages = Math.ceil(historyArray.length / historyItemsPerPage);
        historyPagination.classList.toggle('hidden', totalPages <= 1);
        const startIndex = (historyCurrentPage - 1) * historyItemsPerPage;
        const endIndex = startIndex + historyItemsPerPage;
        const pageItems = historyArray.slice(startIndex, endIndex);

        pageItems.forEach(item => {
            const historyItem = document.createElement('div');
            // 根据isMarked状态添加'marked'类
            historyItem.className = `history-item ${item.isMarked ? 'marked' : ''}`;
            
            // 使用新的HTML结构，包含标记按钮
            historyItem.innerHTML = `
                <div class="details">
                    <div class="word">${item.word}</div>
                    <div class="meaning">${item.meaning}</div>
                </div>
                <button class="mark-btn" data-word="${item.word}">
                    ${item.isMarked ? '取消标记' : '标记'}
                </button>
            `;
            historyList.appendChild(historyItem);
        });

        historyPageIndicator.textContent = `第 ${historyCurrentPage} / ${totalPages} 页`;
        historyPrevBtn.disabled = (historyCurrentPage === 1);
        historyNextBtn.disabled = (historyCurrentPage === totalPages);
    }
    
    function goBackToSetup() {
        flashcardContainer.classList.add('hidden');
        controlsPanel.classList.remove('hidden');
    }

    // --- 事件监听器 ---
    startBtn.addEventListener('click', startNewRound);
    revealBtn.addEventListener('click', toggleMeaning);

    nextBtn.addEventListener('click', () => {
        if (currentIndex < currentRoundWords.length - 1) {
            currentIndex++;
            displayWord();
        }
    });
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            displayWord();
        }
    });
    newRoundBtn.addEventListener('click', goBackToSetup);
    
    historyPrevBtn.addEventListener('click', () => {
        if (historyCurrentPage > 1) {
            historyCurrentPage--;
            updateHistoryView();
        }
    });

    historyNextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(history.size / historyItemsPerPage);
        if (historyCurrentPage < totalPages) {
            historyCurrentPage++;
            updateHistoryView();
        }
    });

    // 新增：使用事件委托处理标记按钮的点击
    historyList.addEventListener('click', (e) => {
        // 检查点击的是否是标记按钮
        if (e.target.classList.contains('mark-btn')) {
            const wordToToggle = e.target.dataset.word;
            
            // 在history Set中找到对应的单词对象
            const entry = [...history].find(h => h.word === wordToToggle);
            
            if (entry) {
                // 切换isMarked状态
                entry.isMarked = !entry.isMarked;
                // 重新渲染历史视图以反映变化
                updateHistoryView();
            }
        }
    });

    // 初始化
    startBtn.disabled = true;
    fetchWords();
    updateHistoryView();
});