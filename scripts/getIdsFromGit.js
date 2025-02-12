const https = require('https');
const fs = require('fs');

const entityFile = 'https://raw.githubusercontent.com/Mojang/bedrock-samples/main/metadata/vanilladata_modules/mojang-entities.json';
const itemFile = 'https://raw.githubusercontent.com/Mojang/bedrock-samples/main/metadata/vanilladata_modules/mojang-items.json';
const blockFile = 'https://raw.githubusercontent.com/Mojang/bedrock-samples/main/metadata/vanilladata_modules/mojang-blocks.json';

const urls = [entityFile, itemFile, blockFile];

urls.forEach(url => {
    https.get(url, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                fs.writeFileSync(`./${url.split('/').pop().slice(0, -5)}.txt`, jsonData['data_items'].map(entry => "\"" + entry.name + "\"").join(','))
            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        });
    }).on('error', (err) => {
        console.error('Error fetching the JSON file:', err);
    });
});

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