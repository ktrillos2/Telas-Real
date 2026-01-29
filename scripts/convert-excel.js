const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'calculadora.xlsx');
const outPath = path.join(process.cwd(), 'calculadora.csv');

if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const csv = XLSX.utils.sheet_to_csv(worksheet);

fs.writeFileSync(outPath, csv);
console.log('Converted to CSV:', outPath);
