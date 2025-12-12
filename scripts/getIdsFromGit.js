const https = require('https');
const fs = require('fs');

const langFile = 'https://raw.githubusercontent.com/Mojang/bedrock-samples/refs/heads/main/resource_pack/texts/en_US.lang'

https.get(langFile, (response) => {
    let data = '';

    response.on('data', (chunk) => {
        data += chunk;
    });

    response.on('end', () => {
        try {
            fs.writeFileSync(`./mojang-langs.txt`, data.split('\n').filter(x => x.includes('=')).map(x => '"' + x.split('=')[0] + '"').join(','))
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
        try {
            fs.writeFileSync(`./mojang-groups.txt`, data.split("\n").filter(entry => entry.toLowerCase().includes('itemgroup.name')).map(x => '"' + x.split('=')[0] + '"').join(","));
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });
}).on('error', (err) => {
    console.error('Error fetching the JSON file:', err);
});

const blocksFile = 'https://raw.githubusercontent.com/Mojang/bedrock-samples/refs/heads/main/resource_pack/blocks.json'

https.get(blocksFile, (response) => {
    let data = '';

    response.on('data', (chunk) => {
        data += chunk;
    });

    response.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            fs.writeFileSync(`./mojang-block-sounds.txt`, Array.from(new Set(Object.keys(jsonData).map(key => jsonData[key].sound).filter(sound => sound))).sort().map(x => '"' + x.split('=')[0] + '"').join(','))
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });
}).on('error', (err) => {
    console.error('Error fetching the JSON file:', err);
});