const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// 提供 public 文件夹中的静态文件 (html, css, js)
app.use(express.static('public'));

// 创建一个 API 端点，用于读取、清洗和发送单词数据
app.get('/api/words', (req, res) => {
  const csvPath = path.join(__dirname, 'data', 'index.csv');
  
  fs.readFile(csvPath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading the CSV file:", err);
      return res.status(500).json({ error: 'Failed to read words file.' });
    }

    // 按行分割，并跳过第一行（表头）
    const lines = data.split('\n').slice(1);

    // 初始解析
    const parsedWords = lines
      .filter(line => line.trim() !== '') // 过滤掉空行
      .map(line => {
        const parts = line.split(',');
        // 确保一行至少被逗号分成了两部分
        if (parts.length >= 2) {
          const word = parts[0].trim().toLowerCase();
          const meaning = parts.slice(1).join(',').trim();
          return { word, meaning };
        }
        return null;
      })
      .filter(wordObj => wordObj !== null);

    // 使用 Map 进行去重
    const uniqueWordsMap = new Map();
    parsedWords.forEach(wordObj => {
        uniqueWordsMap.set(wordObj.word, wordObj);
    });

    const uniqueWords = Array.from(uniqueWordsMap.values());

    console.log(`CSV read complete. Total unique words sent: ${uniqueWords.length}`);

    // 发送清洗后的数据
    res.json(uniqueWords);
  });
});

app.listen(PORT, () => {
  console.log(`背单词应用已启动，请访问 http://localhost:${PORT}`);
});