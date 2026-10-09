import { validateInput, sendMessageToAI, analyzeNews, getAIStatus } from '../ai-service.js';

async function testAIService() {
    console.log('🤖 Testing AI Service with Gemma 4 Integration:');
    console.log('─'.repeat(50));

    // 1. Check AI Status
    const status = getAIStatus();
    console.log('AI Status:', JSON.stringify(status, null, 2));

    // 2. Test Input Validation
    console.log('\nValidating input:');
    console.log('Empty input:', validateInput(''));
    console.log('Valid input:', validateInput('How does EVM work?'));

    // 3. Test Chatbot in English
    console.log('\nTesting Chatbot (English - "How does EVM work?"):');
    const enReply = await sendMessageToAI('How does EVM work?', 'You are an election assistant.', [], 'en');
    console.log('English Response:\n', enReply);

    // 4. Test Chatbot in Hindi
    console.log('\nTesting Chatbot (Hindi - "NOTA क्या है?"):');
    const hiReply = await sendMessageToAI('NOTA क्या है?', 'You are an election assistant.', [], 'hi');
    console.log('Hindi Response:\n', hiReply);

    // 5. Test Fake News Analysis (Factual claim)
    console.log('\nTesting Fake News (Factual news):');
    const factResult = await analyzeNews('The Election Commission of India announced phase-wise polling dates for the upcoming state assembly elections.');
    console.log('Factual Analysis Result:\n', JSON.stringify(factResult, null, 2));

    // 6. Test Fake News Analysis (Sensational claim)
    console.log('\nTesting Fake News (Sensational claim):');
    const fakeResult = await analyzeNews('SHOCKING LEAKED SECRET! EVMs hacked in conspiracy to rig upcoming elections, panic everywhere!');
    console.log('Sensational Analysis Result:\n', JSON.stringify(fakeResult, null, 2));

    console.log('\n' + '═'.repeat(50));
    console.log('🎉 AI Service verification successful!');
}

testAIService().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
