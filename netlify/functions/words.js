const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
    const csvPath = path.join(__dirname, '..', '..', 'data', 'index.csv');

    try {
        const data = fs.readFileSync(csvPath, 'utf8');

        const lines = data.split('\n').slice(1);
        const parsedWords = lines
            .filter(line => line.trim() !== '')
            .map(line => {
                const parts = line.split(',');
                if (parts.length >= 2) {
                    const word = parts[0].trim().toLowerCase();
                    const meaning = parts.slice(1).join(',').trim();
                    return { word, meaning };
                }
                return null;
            })
            .filter(wordObj => wordObj !== null);

        const uniqueWordsMap = new Map();
        parsedWords.forEach(wordObj => {
            uniqueWordsMap.set(wordObj.word, wordObj);
        });
        const uniqueWords = Array.from(uniqueWordsMap.values());
        
        console.log(`Function read complete. Total unique words sent: ${uniqueWords.length}`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(uniqueWords),
        };
    } catch (error) {
        console.error("Error in Netlify function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to read words file.' }),
        };
    }
};