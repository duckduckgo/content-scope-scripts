import fs from 'fs';
import path from 'path';

function readFilesRecursively(directory) {
    const filenames = fs.readdirSync(directory);
    const files = {};

    filenames.forEach((filename) => {
        const filePath = path.join(directory, filename);
        const fileStats = fs.statSync(filePath);

        if (fileStats.isDirectory()) {
            const nestedFiles = readFilesRecursively(filePath);
            for (const [nestedFilePath, nestedFileContent] of Object.entries(nestedFiles)) {
                files[path.join(filename, nestedFilePath)] = nestedFileContent;
            }
        } else {
            files[filename] = fs.readFileSync(filePath, 'utf-8');
        }
    });

    return files;
}

function upperCaseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function displayDiffs(dir1Files, dir2Files) {
    const rollupGrouping = {};
    /**
     * Rolls up multiple files with the same diff into a single entry
     * @param {string} fileName
     * @param {string} string
     * @param {string} [summary]
     */
    function add(fileName, string, summary = undefined) {
        if (summary === undefined) {
            summary = string;
        }
        if (!(summary in rollupGrouping)) {
            rollupGrouping[summary] = { files: [] };
        }
        rollupGrouping[summary].files.push(fileName);
        rollupGrouping[summary].string = string;
    }
    for (const [filePath, fileContent] of Object.entries(dir1Files)) {
        let diffOut = '';
        let compareOut;
        if (filePath in dir2Files) {
            const fileOut = fileContent;
            const file2Out = dir2Files[filePath];
            delete dir2Files[filePath];
            if (fileOut === file2Out) {
                continue;
            } else {
                compareOut = filePath.split('/')[0];
                diffOut = `File has changed`;
            }
        } else {
            diffOut = '❌ File only exists in old changeset';
            compareOut = 'Removed Files';
        }
        add(filePath, diffOut, compareOut);
    }

    for (const filePath of Object.keys(dir2Files)) {
        add(filePath, '❌ File only exists in new changeset', 'New Files');
    }
    const outString = Object.keys(rollupGrouping)
        .map((key) => {
            const rollup = rollupGrouping[key];
            let outString = `
        `;
            const title = key;
            if (rollup.files.length) {
                for (const file of rollup.files) {
                    outString += `- ${file}\n`;
                }
            }
            outString += '\n\n' + rollup.string;
            return renderDetails(title, outString);
        })
        .join('\n');
    return outString;
}

function renderDetails(section, text) {
    if (section === 'dist') {
        section = 'apple';
    }
    const open = section !== 'integration' ? 'open' : '';
    return `<details ${open}>
<summary>${upperCaseFirstLetter(section)}</summary>
${text}
</details>`;
}

if (process.argv.length !== 4) {
    console.error('Usage: node diff_directories.js <directory1> <directory2>');
    process.exit(1);
}

const dir1 = process.argv[2];
const dir2 = process.argv[3];

const sections = {};
function sortFiles(dirFiles, dirName) {
    for (const [filePath, fileContent] of Object.entries(dirFiles)) {
        sections[dirName] = sections[dirName] || {};
        sections[dirName][filePath] = fileContent;
    }
}

const buildDir = '/build';
sortFiles(readFilesRecursively(dir1 + buildDir), 'dir1');
sortFiles(readFilesRecursively(dir2 + buildDir), 'dir2');

// console.log(Object.keys(files))
const fileOut = displayDiffs(sections.dir1, sections.dir2);
console.log(fileOut);
