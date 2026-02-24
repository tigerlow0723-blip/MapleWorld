const fs = require('fs');

const base_headers = [
    "id", "type", "name", "grade", "cost", "count", "shapeMask",
    "hp", "atk", "def", "atkPercent", "accPercent", "critRate", "critDmg",
    "min_atk", "max_atk", "min_critRate", "max_critRate", "min_critDmg", "max_critDmg",
    "Spawn_Group", "spawn_rate", "imageRUID", "desc", "text"
];

const files = {
    "weapon": "Lucky_Backpack/RootDesk/MyDesk/DataSet/Data_Table - 아이템 - 장비.csv",
    "armor": "Lucky_Backpack/RootDesk/MyDesk/DataSet/Data_Table - 아이템 - 방어구.csv",
    "etc": "Lucky_Backpack/RootDesk/MyDesk/DataSet/Data_Table - 아이템 - 기타.csv"
};

function mapArmorGrade(desc) {
    if (!desc) return "";
    if (desc.includes("레어")) return "Rare";
    if (desc.includes("에픽")) return "Epic";
    if (desc.includes("유니크")) return "Unique";
    if (desc.includes("레전더리")) return "Legendary";
    return "";
}

function parseCSV(content) {
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.substring(1);
    }
    const lines = [];
    let currentLine = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < content.length && content[i + 1] === '"') {
                    currentField += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentLine.push(currentField);
                currentField = '';
            } else if (char === '\n' || char === '\r') {
                if (char === '\r' && i + 1 < content.length && content[i + 1] === '\n') {
                    i++;
                }
                currentLine.push(currentField);
                lines.push(currentLine);
                currentLine = [];
                currentField = '';
            } else {
                currentField += char;
            }
        }
    }
    if (currentField !== '' || currentLine.length > 0) {
        currentLine.push(currentField);
        lines.push(currentLine);
    }
    return lines;
}

function stringifyCSV(rows, headers) {
    let output = '\uFEFF' + headers.join(',') + '\r\n';
    for (const row of rows) {
        const line = headers.map(h => {
            let val = row[h] === undefined ? "" : String(row[h]);
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                val = '"' + val.replace(/"/g, '""') + '"';
            }
            return val;
        });
        output += line.join(',') + '\r\n';
    }
    return output;
}

for (const [ftype, path] of Object.entries(files)) {
    if (!fs.existsSync(path)) continue;

    const content = fs.readFileSync(path, 'utf8');
    const parsed = parseCSV(content);
    if (parsed.length === 0) continue;

    const oldHeaders = parsed[0];
    const dataRows = parsed.slice(1).filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));

    const rows = [];

    const mapping = {
        "atkCount": "count",
        "accPercent (%)": "accPercent",
        "critRate (%)": "critRate",
        "critDmg (%)": "critDmg",
        "Spawn_Rate(%)": "spawn_rate",
        "Spawn_Rate (%)": "spawn_rate",
        "atk (%)": "atkPercent",
        "min_critRate (%)": "min_critRate",
        "max_critRate (%)": "max_critRate",
        "min_critDmg (%)": "min_critDmg",
        "max_critDmg (%)": "max_critDmg",
        "min_hpRecovery (%)": "min_hpRecovery",
        "max_hpRecovery (%)": "max_hpRecovery"
    };

    for (const r of dataRows) {
        const newRow = {};
        for (const h of base_headers) newRow[h] = "";

        for (let i = 0; i < oldHeaders.length; i++) {
            let k = oldHeaders[i].trim();
            const v = r[i] !== undefined ? r[i].trim() : "";

            if (mapping[k]) k = mapping[k];

            if (base_headers.includes(k) || (ftype === 'weapon' && k === 'next_upgrade_id') ||
                (ftype === 'armor' && ['weaponCost', 'min_weaponCost', 'max_weaponCost', 'min_hpRecovery', 'max_hpRecovery'].includes(k)) ||
                (ftype === 'etc' && ['price', 'isRewardDrop', 'rewardDrop'].includes(k))) {
                newRow[k] = v;
            }
        }

        if (ftype === "armor" && newRow["desc"]) {
            newRow["grade"] = mapArmorGrade(newRow["desc"]);
        }
        rows.push(newRow);
    }

    const out_headers = [...base_headers];
    if (ftype === "weapon") {
        out_headers.push("next_upgrade_id");
    } else if (ftype === "armor") {
        out_headers.push("weaponCost", "min_weaponCost", "max_weaponCost", "min_hpRecovery", "max_hpRecovery");
    } else if (ftype === "etc") {
        out_headers.push("price", "isRewardDrop", "rewardDrop");
    }

    const outCSV = stringifyCSV(rows, out_headers);
    fs.writeFileSync(path, outCSV, 'utf8');
    console.log(`Processed ${ftype}`);
}
