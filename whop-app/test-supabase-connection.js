// Test Supabase Connection
// Run this with: node test-supabase-connection.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://grhuhmrwwuvxbvvkvlle.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyaHVobXJ3d3V2eGJ2dmt2bGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTM4MDcsImV4cCI6MjA3OTQ2OTgwN30.2yOB2_D-tabUaLc4W1-gUPR79EjtYT7_bUPkNoobxA4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test 1: Check users table
    console.log('1️⃣ Testing users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Users table error:', usersError.message);
    } else {
      console.log('✅ Users table accessible!');
      console.log(`   Found ${users.length} users`);
    }

    // Test 2: Check payments table
    console.log('\n2️⃣ Testing payments table...');
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(5);
    
    if (paymentsError) {
      console.log('❌ Payments table error:', paymentsError.message);
    } else {
      console.log('✅ Payments table accessible!');
      console.log(`   Found ${payments.length} payments`);
    }

    // Test 3: Check user_purchases table
    console.log('\n3️⃣ Testing user_purchases table...');
    const { data: purchases, error: purchasesError } = await supabase
      .from('user_purchases')
      .select('*')
      .limit(5);
    
    if (purchasesError) {
      console.log('❌ User purchases table error:', purchasesError.message);
    } else {
      console.log('✅ User purchases table accessible!');
      console.log(`   Found ${purchases.length} purchases`);
    }

    // Test 4: Check game_scores table
    console.log('\n4️⃣ Testing game_scores table...');
    const { data: scores, error: scoresError } = await supabase
      .from('game_scores')
      .select('*')
      .limit(5);
    
    if (scoresError) {
      console.log('❌ Game scores table error:', scoresError.message);
      console.log('   (This is OK if you haven\'t created this table yet)');
    } else {
      console.log('✅ Game scores table accessible!');
      console.log(`   Found ${scores.length} scores`);
    }

    console.log('\n✅ Connection test complete!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testConnection();
