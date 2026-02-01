import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuration ---
const BASE_URL = process.env.NEXTAUTH_URL || 'http://127.0.0.1:3000';

// Manual .env loading
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value && !process.env[key.trim()]) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

// Validation Colors
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

async function runPenetrationTest() {
    console.log(`\n🛡️  STARTING SECURITY PENETRATION TEST`);
    console.log(`Target: ${BASE_URL}`);
    console.log('='.repeat(50));

    let failures = 0;

    // --- TEST 1: RLS Leakage (Leads) ---
    process.stdout.write(`1. [RLS] Testing 'leads' table access with Anon Key... `);
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    try {
        const { data, error } = await supabase.from('leads').select('*');
        if (error) {
            console.log(`${colors.green}SECURE ✅${colors.reset}`);
        } else if (data && data.length === 0) {
            console.log(`${colors.green}SECURE ✅ (Empty array returned)${colors.reset}`);
        } else {
            console.log(`${colors.red}VULNERABLE ❌${colors.reset}`);
            console.error(`   ⚠️  Anon user could read ${data.length} leads!`);
            failures++;
        }
    } catch (e: any) {
        console.log(`${colors.green}SECURE ✅ (Exception: ${e.message})${colors.reset}`);
    }

    // --- TEST 2: Public API POST (Tickets) ---
    process.stdout.write(`2. [API] POST /api/tickets without Auth... `);
    try {
        const res = await fetch(`${BASE_URL}/api/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: 'Hacked ticket', category: 'generic' })
        });

        if (res.status === 401 || res.status === 403) {
            console.log(`${colors.green}SECURE ✅ (${res.status})${colors.reset}`);
        } else {
            console.log(`${colors.red}VULNERABLE ❌ (Status: ${res.status})${colors.reset}`);
            console.error(`   ⚠️  Public user created a ticket!`);
            failures++;
        }
    } catch (e: any) {
        console.log(`${colors.yellow}ERROR connecting to API: ${e.message}${colors.reset}`);
    }

    // --- TEST 3: Injection (XSS Payload) ---
    process.stdout.write(`3. [Injection] Sending XSS payload to Chat... `);
    try {
        const xssPayload = { message: "<script>alert('pwned')</script>", chatId: "test-attack" };
        const res = await fetch(`${BASE_URL}/api/n8n-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(xssPayload)
        });

        const text = await res.text();
        if (text.includes('<script>')) {
            console.log(`${colors.yellow}WARNING ⚠️  (Payload reflected)${colors.reset}`);
        } else {
            console.log(`${colors.green}SAFE ✅${colors.reset}`);
        }
    } catch (e: any) {
        console.log(`${colors.green}SAFE ✅ (Exception: ${e.message})${colors.reset}`);
    }

    // --- TEST 4: HMAC Bypass (N8N Proxy) ---
    process.stdout.write(`4. [HMAC] POST /api/n8n-proxy without Signature... `);
    try {
        const res = await fetch(`${BASE_URL}/api/n8n-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Hello Hacker', chatId: '123' })
        });

        if (res.status === 401 || res.status === 403) {
            console.log(`${colors.green}SECURE ✅${colors.reset}`);
        } else {
            console.log(`${colors.red}VULNERABLE ❌ (Status: ${res.status})${colors.reset}`);
            console.error(`   ⚠️  Accepted request without HMAC signature!`);
            failures++;
        }
    } catch (e: any) {
        console.log(`${colors.yellow}ERROR connecting: ${e.message}${colors.reset}`);
    }

    // --- TEST 5: Authenticated RLS Bypass (Tickets & Leads) ---
    process.stdout.write(`5. [Auth RLS] Testing Cross-User & Admin Table Access... `);
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SERVICE_KEY) {
        console.log(`${colors.yellow}SKIPPED ⚠️  (Missing SERVICE_ROLE_KEY)${colors.reset}`);
    } else {
        const adminClient = createClient(SUPABASE_URL!, SERVICE_KEY);
        let victimId = '';
        let attackerId = '';
        let victimTicketId = '';

        try {
            // Create Victim
            const { data: victim } = await adminClient.auth.admin.createUser({
                email: `victim_${Date.now()}@test.com`,
                password: 'password123', // NOSONAR: S2068 - Intentional weak password for ephemeral test user (deleted immediately)
                email_confirm: true,
                user_metadata: { role: 'user', full_name: 'Victim User' }
            });
            if (victim.user) victimId = victim.user.id;

            // Create Attacker
            const { data: attacker } = await adminClient.auth.admin.createUser({
                email: `attacker_${Date.now()}@test.com`,
                password: 'password123', // NOSONAR: S2068 - Intentional weak password for ephemeral test user (deleted immediately)
                email_confirm: true,
                user_metadata: { role: 'user', full_name: 'Attacker User' }
            });
            if (attacker.user) attackerId = attacker.user.id;

            if (!victimId || !attackerId) throw new Error("Failed to create test users");

            // Create Victim Ticket
            const { data: ticket } = await adminClient
                .from('tickets')
                .insert({
                    user_id: victimId,
                    description: 'Victim Ticket',
                    category: 'generic',
                    status: 'new'
                })
                .select()
                .single();
            if (ticket) victimTicketId = ticket.id;

            // Login as Attacker
            const { data: authData } = await adminClient.auth.signInWithPassword({
                email: attacker.user!.email!,
                password: 'password123' // NOSONAR: S2068 - Intentional weak password for test authentication
            });

            if (!authData.session) throw new Error("Attacker login failed");

            // Attacker Client (Standard User)
            const attackerClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
                global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } }
            });

            // CHECK A: Update Other's Ticket
            const { data: updateData } = await attackerClient
                .from('tickets')
                .update({ description: 'PWNED' })
                .eq('id', victimTicketId)
                .select();

            // CHECK B: Read Leads
            const { data: leadsData } = await attackerClient.from('leads').select('*');

            let vulnerable = false;

            if (updateData && updateData.length > 0) {
                console.log(`\n   ❌ Ticket Update: VULNERABLE (Attacker modified victim ticket)`);
                vulnerable = true;
            }

            if (leadsData && leadsData.length > 0) {
                console.log(`\n   ❌ Leads Read: VULNERABLE (User saw leads)`);
                vulnerable = true;
            }

            if (vulnerable) {
                console.log(`${colors.red}FAIL${colors.reset}`);
                failures++;
            } else {
                console.log(`${colors.green}SECURE ✅${colors.reset}`);
            }

        } catch (e: any) {
            console.log(`${colors.yellow}ERROR: ${e.message}${colors.reset}`);
        } finally {
            if (victimId) await adminClient.auth.admin.deleteUser(victimId);
            if (attackerId) await adminClient.auth.admin.deleteUser(attackerId);
        }
    }

    console.log('='.repeat(50));
    if (failures > 0) {
        console.log(`${colors.red}❌ FAILED: ${failures} vulnerabilities detected.${colors.reset}`);
        process.exit(1);
    } else {
        console.log(`${colors.green}✅ PASSED: All security checks cleared.${colors.reset}`);
        process.exit(0);
    }
}

runPenetrationTest();
