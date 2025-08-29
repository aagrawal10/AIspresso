// Environment Variables Test Script
// Run this with: node test-env-vars.js

console.log('=== Environment Variables Test ===\n');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Test Reddit environment variables
console.log('🔍 Reddit Environment Variables:');
console.log('NEXT_PUBLIC_REDDIT_CLIENT_ID:', process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID ? '✅ Present' : '❌ Missing');
console.log('NEXT_PUBLIC_REDDIT_CLIENT_SECRET:', process.env.NEXT_PUBLIC_REDDIT_CLIENT_SECRET ? '✅ Present' : '❌ Missing');
console.log('NEXT_PUBLIC_REDDIT_USERNAME:', process.env.NEXT_PUBLIC_REDDIT_USERNAME ? '✅ Present' : '❌ Missing');
console.log('NEXT_PUBLIC_REDDIT_PASSWORD:', process.env.NEXT_PUBLIC_REDDIT_PASSWORD ? '✅ Present' : '❌ Missing');

// Test Twitter environment variables
console.log('\n🐦 Twitter Environment Variables:');
console.log('NEXT_PUBLIC_TWITTER_BEARER_TOKEN:', process.env.NEXT_PUBLIC_TWITTER_BEARER_TOKEN ? '✅ Present' : '❌ Missing');
console.log('NEXT_PUBLIC_TWITTER_LIST_IDS:', process.env.NEXT_PUBLIC_TWITTER_LIST_IDS ? '✅ Present' : '❌ Missing');

// Test credential completeness
console.log('\n🧪 Credential Check:');

const redditCredentials = {
    clientId: process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID,
    clientSecret: process.env.NEXT_PUBLIC_REDDIT_CLIENT_SECRET,
    username: process.env.NEXT_PUBLIC_REDDIT_USERNAME,
    password: process.env.NEXT_PUBLIC_REDDIT_PASSWORD,
};

const twitterCredentials = {
    bearerToken: process.env.NEXT_PUBLIC_TWITTER_BEARER_TOKEN,
    listIds: process.env.NEXT_PUBLIC_TWITTER_LIST_IDS,
};

const redditComplete = Object.values(redditCredentials).every(val => val);
const twitterComplete = twitterCredentials.bearerToken && twitterCredentials.listIds;

console.log('Reddit credentials complete:', redditComplete ? '✅ Yes' : '❌ No');
console.log('Twitter credentials complete:', twitterComplete ? '✅ Yes' : '❌ No');

if (!redditComplete) {
    console.log('Missing Reddit credentials:', 
        Object.entries(redditCredentials)
            .filter(([key, val]) => !val)
            .map(([key]) => key)
            .join(', ')
    );
}

if (!twitterComplete) {
    const missing = [];
    if (!twitterCredentials.bearerToken) missing.push('bearerToken');
    if (!twitterCredentials.listIds) missing.push('listIds');
    console.log('Missing Twitter credentials:', missing.join(', '));
}

console.log('\n=== Next Steps ===');
if (redditComplete && twitterComplete) {
    console.log('✅ All credentials are present!');
    console.log('1. Start dev server: npm run dev');
    console.log('2. Visit http://localhost:3000/test-env for browser testing');
    console.log('3. Check your main dashboard to see if feeds work');
} else {
    console.log('❌ Some credentials are missing.');
    console.log('1. Check your .env.local file');
    console.log('2. Make sure all variables have the NEXT_PUBLIC_ prefix');
    console.log('3. Restart dev server after making changes');
}

console.log('\n=== Test Complete ===');