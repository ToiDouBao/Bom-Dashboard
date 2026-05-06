const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const xlsx = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = 5000;
const EXCEL_FILE = '../bom.xlsx';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.use(cors());
app.use(bodyParser.json());

function normalize(text) {
    if (!text) return '';
    return text.toString().trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

app.get('/api/data', async (req, res) => {
    try {
        const fs = require('fs');
        console.log(`Attempting to read: ${EXCEL_FILE}`);
        if (!fs.existsSync(EXCEL_FILE)) {
            console.error(`File NOT FOUND: ${path.resolve(EXCEL_FILE)}`);
            return res.status(404).json({ error: 'Excel file not found' });
        }

        const workbook = xlsx.readFile(EXCEL_FILE, { cellDates: true, dateNF: 'yyyy-mm-dd' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });

        console.log(`Raw rows found: ${rawData.length}`);

        if (rawData.length < 7) {
            console.error("Excel file has too few rows.");
            return res.json([]);
        }

        const headers = rawData[6];
        const dataRows = rawData.slice(7).filter(row => row.length > 0 && row[1]);
        console.log(`Valid data rows: ${dataRows.length}`);

        const { data: dbRows, error } = await supabase.from('item_updates').select('*');
        if (error) throw new Error(error.message);

        const updates = {};
        dbRows.forEach(row => { updates[row.line_no] = row; });

        const mergedData = dataRows.map(row => {
            const item = {};
            headers.forEach((h, i) => { item[h] = row[i]; });
            const lineNo = item['Bom Line No']?.toString();
            const update = updates[lineNo] || {};

            let defaultStatus = 'Pending for PR';
            if (item['Estimate Delivery Date']) {
                defaultStatus = 'Pending with ETA';
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
        res.status(500).json({ error: 'Server Error', details: err.message });
    }
});

app.post('/api/update', async (req, res) => {
    try {
        const { lineNo, status, attention, remark } = req.body;
        const update = { line_no: lineNo };
        if (status !== undefined) update.status = status;
        if (attention !== undefined) update.attention = attention;
        if (remark !== undefined) update.remark = remark;

        const { error } = await supabase.from('item_updates').upsert(update, { onConflict: 'line_no' });
        if (error) throw new Error(error.message);
        res.json({ success: true });
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ error: 'Update Failed', details: err.message });
    }
});

app.post('/api/update-batch', async (req, res) => {
    try {
        const { lineNos, status, attention, remark } = req.body;
        if (!lineNos || !Array.isArray(lineNos)) {
            return res.status(400).json({ error: 'No lineNos provided' });
        }

        const rows = lineNos.map(lineNo => {
            const update = { line_no: lineNo.toString() };
            if (status !== undefined) update.status = status;
            if (attention !== undefined) update.attention = attention;
            if (remark !== undefined) update.remark = remark;
            return update;
        });

        const { error } = await supabase.from('item_updates').upsert(rows, { onConflict: 'line_no' });
        if (error) throw new Error(error.message);
        res.json({ success: true, count: lineNos.length });
    } catch (err) {
        console.error("Batch Error:", err);
        res.status(500).json({ error: 'Batch Update Failed', details: err.message });
    }
});

app.listen(PORT, () => console.log(`Server: ${PORT}`));
