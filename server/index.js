const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DB_FILE = './db.json';
const EXCEL_FILE = '../bom.xlsx';

app.use(cors());
app.use(bodyParser.json());

if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ updates: {} }));
}

function normalize(text) {
    if (!text) return '';
    return text.toString().trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

app.get('/api/data', (req, res) => {
    try {
        console.log(`Attempting to read: ${EXCEL_FILE}`);
        if (!fs.existsSync(EXCEL_FILE)) {
            console.error(`File NOT FOUND: ${path.resolve(EXCEL_FILE)}`);
            return res.status(404).json({ error: 'Excel file not found' });
        }

        const workbook = xlsx.readFile(EXCEL_FILE);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        console.log(`Raw rows found: ${rawData.length}`);
        
        if (rawData.length < 7) {
            console.error("Excel file has too few rows.");
            return res.json([]);
        }

        const headers = rawData[6];
        const dataRows = rawData.slice(7).filter(row => row.length > 0 && row[1]);
        console.log(`Valid data rows: ${dataRows.length}`);

        const db = JSON.parse(fs.readFileSync(DB_FILE));
        
        const mergedData = dataRows.map(row => {
            const item = {};
            headers.forEach((h, i) => { item[h] = row[i]; });
            const lineNo = item['Bom Line No']?.toString();
            const update = db.updates[lineNo] || {};

            let defaultStatus = 'Pending (PR)';
            if (item['Estimate Delivery Date']) {
                defaultStatus = 'Pending (ETA)';
            } else if (item['Pr No']) {
                defaultStatus = 'Pending (PR)';
            }

            return {
                ...item,
                'Module': normalize(item['Module']),
                'Total Price': parseFloat(item['Total Price']) || 0,
                'Actual Status': update.status || defaultStatus,
                'Attention Needed': update.attention || false,
                'Remark': update.remark || ''
            };
        });
        res.json(mergedData);
    } catch (err) {
        console.error("Detailed Server Error:", err);
        res.status(500).json({ error: 'Excel Parsing Error', details: err.message });
    }
});

app.post('/api/update', (req, res) => {
    const { lineNo, status, attention, remark } = req.body;
    const db = JSON.parse(fs.readFileSync(DB_FILE));
    if (!db.updates[lineNo]) db.updates[lineNo] = {};
    if (status !== undefined) db.updates[lineNo].status = status;
    if (attention !== undefined) db.updates[lineNo].attention = attention;
    if (remark !== undefined) db.updates[lineNo].remark = remark;
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    res.json({ success: true });
});

app.post('/api/update-batch', (req, res) => {
    try {
        const { lineNos, status, attention, remark } = req.body;
        if (!lineNos || !Array.isArray(lineNos)) {
            return res.status(400).json({ error: 'No lineNos provided' });
        }
        const db = JSON.parse(fs.readFileSync(DB_FILE));
        lineNos.forEach(lineNo => {
            if (!db.updates[lineNo]) db.updates[lineNo] = {};
            if (status !== undefined) db.updates[lineNo].status = status;
            if (attention !== undefined) db.updates[lineNo].attention = attention;
            if (remark !== undefined) db.updates[lineNo].remark = remark;
        });
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        res.json({ success: true, count: lineNos.length });
    } catch (err) {
        console.error("Batch Error:", err);
        res.status(500).json({ error: 'Batch Update Failed' });
    }
});

app.listen(PORT, () => console.log(`Server: ${PORT}`));
