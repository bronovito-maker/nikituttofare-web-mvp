// download-issues.js
const fs = require('node:fs');

// CONFIGURAZIONE: Inserisci i tuoi dati qui
const ORGANIZATION = 'bronovito-maker'; // Preso dai tuoi snippet precedenti
const PROJECT_KEY = 'bronovito-maker_nikituttofare-web-mvp'; // Sostituisci con il tuo Project Key (lo trovi in basso a destra nella dashboard di Sonar o nell'URL)
const SONAR_TOKEN = 'INSERISCI_TUO_TOKEN_QUI'; // Opzionale se il progetto è pubblico, obbligatorio se privato

console.log('Scarico gli errori da SonarCloud...');

const url = `https://sonarcloud.io/api/issues/search?componentKeys=${PROJECT_KEY}&statuses=OPEN,REOPENED,CONFIRMED&ps=500`;

const headers = {};
if (SONAR_TOKEN !== 'INSERISCI_TUO_TOKEN_QUI') {
    headers['Authorization'] = 'Bearer ' + SONAR_TOKEN;
}

try {
    const response = await fetch(url, { headers });
    const data = await response.json();

    if (data.errors) {
        console.error('Errore API:', data.errors);
        process.exit(1);
    }

    const cleanIssues = data.issues.map(issue => ({
        severity: issue.severity,
        component: issue.component,
        line: issue.line,
        message: issue.message,
        type: issue.type,
        rule: issue.rule
    }));

    fs.writeFileSync('sonar-report.json', JSON.stringify(cleanIssues, null, 2));
    console.log(`✅ Fatto! Salvati ${cleanIssues.length} errori in 'sonar-report.json'.`);
    console.log('Ora carica questo file nella chat con Antigravity/Gemini.');

} catch (error) {
    console.error('Errore durante il download:', error);
    process.exit(1);
}