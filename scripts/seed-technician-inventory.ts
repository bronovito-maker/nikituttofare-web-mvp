import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Service role for seeding

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables! Check .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_TENANT_ID = 'demo_technician_tenant';

const inventoryItems = [
    {
        tenant_id: TEST_TENANT_ID,
        name: 'Tasselli Fischer DUOPOWER 6x30',
        sku: '538240',
        category: 'Minuteiria',
        quantity_at_hand: 100,
        unit_of_measure: 'pz',
        unit_cost: 0.15
    },
    {
        tenant_id: TEST_TENANT_ID,
        name: 'Silicone Sigillante Acetico Bianco 280ml',
        sku: '12345678',
        category: 'Chimica',
        quantity_at_hand: 24,
        unit_of_measure: 'pz',
        unit_cost: 4.50
    },
    {
        tenant_id: TEST_TENANT_ID,
        name: 'Rubinetto Miscelatore Lavabo Cromo',
        sku: '99887766',
        category: 'Idraulica',
        quantity_at_hand: 5,
        unit_of_measure: 'pz',
        unit_cost: 45.00
    },
    {
        tenant_id: TEST_TENANT_ID,
        name: 'Cavo Elettrico FS17 3G1.5 100m',
        sku: '11223344',
        category: 'Elettricità',
        quantity_at_hand: 2,
        unit_of_measure: 'pz',
        unit_cost: 65.00
    }
];

async function seed() {
    console.log('🚀 Starting Inventory Seeding...');

    // Cleanup old seed for consistency
    const { error: deleteError } = await supabase
        .from('inventory_items')
        .delete()
        .eq('tenant_id', TEST_TENANT_ID);

    if (deleteError) {
        console.error('❌ Error cleaning up old seed data:', deleteError);
    }

    const { data, error } = await supabase
        .from('inventory_items')
        .insert(inventoryItems)
        .select();

    if (error) {
        console.error('❌ Seeding failed:', error);
        return;
    }

    console.log(`✅ Successfully seeded ${data.length} inventory items.`);
}

seed();
