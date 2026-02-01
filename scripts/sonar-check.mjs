#!/usr/bin/env node

/**
 * SonarQube Issue Fetcher & Reporter
 * 
 * This script fetches the latest issues from SonarCloud and generates a report.
 * It can be run as part of CI/CD or manually to check code quality.
 * 
 * Usage: node scripts/sonar-check.mjs
 * 
 * Required ENV: SONAR_TOKEN (SonarCloud token)
 */

const SONAR_ORG = 'bronovito-maker';
const PROJECT_KEY = 'bronovito-maker_nikituttofare-web-mvp';
const SONAR_API = 'https://sonarcloud.io/api';

// Colors for terminal output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

async function fetchWithAuth(endpoint, params = {}) {
    const token = process.env.SONAR_TOKEN;
    if (!token) {
        console.error(`${colors.red}❌ SONAR_TOKEN environment variable is required${colors.reset}`);
        process.exit(1);
    }

    const url = new URL(`${SONAR_API}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`SonarCloud API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

async function getIssues() {
    return fetchWithAuth('/issues/search', {
        componentKeys: PROJECT_KEY,
        statuses: 'OPEN,CONFIRMED,REOPENED',
        ps: '100'
    });
}

async function getHotspots() {
    return fetchWithAuth('/hotspots/search', {
        projectKey: PROJECT_KEY,
        status: 'TO_REVIEW'
    });
}

async function getMeasures() {
    return fetchWithAuth('/measures/component', {
        component: PROJECT_KEY,
        metricKeys: 'bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density,ncloc,reliability_rating,security_rating,sqale_rating'
    });
}

async function getQualityGateStatus() {
    return fetchWithAuth('/qualitygates/project_status', {
        projectKey: PROJECT_KEY
    });
}

function getRatingLetter(rating) {
    const ratings = { '1.0': 'A', '2.0': 'B', '3.0': 'C', '4.0': 'D', '5.0': 'E' };
    return ratings[rating] || rating;
}

function getSeverityColor(severity) {
    switch (severity?.toUpperCase()) {
        case 'BLOCKER':
        case 'CRITICAL':
            return colors.red;
        case 'MAJOR':
            return colors.yellow;
        case 'MINOR':
            return colors.cyan;
        default:
            return colors.reset;
    }
}

async function main() {
    console.log(`\n${colors.bold}${colors.blue}🔍 SonarCloud Quality Report${colors.reset}`);
    console.log(`${colors.cyan}Project: ${PROJECT_KEY}${colors.reset}`);
    console.log('='.repeat(60));

    try {
        // 1. Quality Gate Status
        console.log(`\n${colors.bold}📊 Quality Gate Status${colors.reset}`);
        const qgStatus = await getQualityGateStatus();
        const status = qgStatus.projectStatus?.status;
        const statusColor = status === 'OK' ? colors.green : colors.red;
        console.log(`   Status: ${statusColor}${status}${colors.reset}`);

        if (qgStatus.projectStatus?.conditions) {
            qgStatus.projectStatus.conditions.forEach(cond => {
                if (cond.status !== 'OK') {
                    console.log(`   ${colors.yellow}⚠ ${cond.metricKey}: ${cond.actualValue} (threshold: ${cond.errorThreshold})${colors.reset}`);
                }
            });
        }

        // 2. Measures
        console.log(`\n${colors.bold}📈 Project Measures${colors.reset}`);
        const measures = await getMeasures();
        const metricsMap = {};
        measures.component?.measures?.forEach(m => {
            metricsMap[m.metric] = m.value;
        });

        console.log(`   Lines of Code:      ${metricsMap.ncloc || 'N/A'}`);
        console.log(`   Bugs:               ${metricsMap.bugs || '0'} (Rating: ${getRatingLetter(metricsMap.reliability_rating)})`);
        console.log(`   Vulnerabilities:    ${metricsMap.vulnerabilities || '0'} (Rating: ${getRatingLetter(metricsMap.security_rating)})`);
        console.log(`   Code Smells:        ${metricsMap.code_smells || '0'} (Rating: ${getRatingLetter(metricsMap.sqale_rating)})`);
        console.log(`   Duplication:        ${metricsMap.duplicated_lines_density || '0'}%`);
        console.log(`   Coverage:           ${metricsMap.coverage || 'N/A'}%`);

        // 3. Issues Summary
        console.log(`\n${colors.bold}🐛 Open Issues${colors.reset}`);
        const issues = await getIssues();
        const total = issues.paging?.total || 0;
        console.log(`   Total: ${total} issues`);

        // Group by severity
        const bySeverity = {};
        issues.issues?.forEach(issue => {
            const sev = issue.severity || 'UNKNOWN';
            bySeverity[sev] = (bySeverity[sev] || 0) + 1;
        });

        Object.entries(bySeverity)
            .sort((a, b) => {
                const order = ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'INFO'];
                return order.indexOf(a[0]) - order.indexOf(b[0]);
            })
            .forEach(([sev, count]) => {
                console.log(`   ${getSeverityColor(sev)}${sev}: ${count}${colors.reset}`);
            });

        // 4. Security Hotspots
        console.log(`\n${colors.bold}🔥 Security Hotspots${colors.reset}`);
        const hotspots = await getHotspots();
        const hotspotCount = hotspots.paging?.total || 0;
        console.log(`   To Review: ${hotspotCount}`);

        // 5. Top 10 Issues
        if (issues.issues?.length > 0) {
            console.log(`\n${colors.bold}📝 Top Issues (by severity)${colors.reset}`);
            const sortedIssues = [...issues.issues].sort((a, b) => {
                const order = ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'INFO'];
                return order.indexOf(a.severity) - order.indexOf(b.severity);
            }).slice(0, 10);

            sortedIssues.forEach((issue, i) => {
                const file = issue.component?.split(':').pop() || 'unknown';
                const line = issue.line || '?';
                console.log(`   ${i + 1}. ${getSeverityColor(issue.severity)}[${issue.severity}]${colors.reset} ${file}:${line}`);
                console.log(`      ${colors.cyan}${issue.message}${colors.reset}`);
            });
        }

        console.log('\n' + '='.repeat(60));

        // Exit code based on quality gate
        if (status === 'OK') {
            console.log(`${colors.green}✅ Quality Gate PASSED${colors.reset}\n`);
            process.exit(0);
        } else {
            console.log(`${colors.red}❌ Quality Gate FAILED${colors.reset}\n`);
            process.exit(1);
        }

    } catch (error) {
        console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

main();
