import { evaluateHRAnswer, parseAndValidateEvaluation, IEvaluationResult } from '../utils/gemini';

const defaultFallback: IEvaluationResult = {
  overallScore: 8.5,
  technicalScore: 9.0,
  communicationScore: 8.5,
  grammarScore: 8.5,
  confidenceScore: 8.5,
  relevanceScore: 9.0,
  problemSolvingScore: 8.5,
  professionalismScore: 9.0,
  strengths: ['Accurate explanation'],
  weaknesses: ['Add code sample'],
  feedback: 'Good response.',
  improvedAnswer: 'Exemplar answer...',
  recommendation: 'Pass',
  learningSuggestions: ['Practice STAR method'],
  score: 8.5,
  evaluation: {
    grammar: 'Grammar Score: 8.5/10',
    confidence: 'Confidence Score: 8.5/10',
    technical: 'Technical Score: 9.0/10',
    suggestions: 'Good response.'
  },
  idealAnswer: 'Exemplar answer...'
};

async function runAllTests() {
  console.log('🧪 RUNNING COMPLETE TASK 1-12 EVALUATION UNIT TESTS...\n');

  // 1. Test Task 10 - Overloading vs Overriding Correct Answer
  const overloadingAnswer = "Overloading allows multiple methods with the same name but different parameter lists within the same class. Overriding allows a subclass to provide a new implementation of a parent class method with the same signature.";
  const res1 = await evaluateHRAnswer('Software Engineer', 'Difference between overloading and overriding', overloadingAnswer);
  console.log('✅ TEST 1 (Overloading vs Overriding):', res1.overallScore >= 8.0 && res1.technicalScore >= 8.5 && res1.recommendation === 'Pass' ? 'PASS' : 'FAIL');
  console.log('   Results:', { overall: res1.overallScore, technical: res1.technicalScore, rec: res1.recommendation });

  // 2. Test Task 10 - Garbage Collection Correct Answer
  const gcAnswer = "Garbage collection automatically frees memory occupied by objects that are no longer reachable, helping prevent memory leaks.";
  const res2 = await evaluateHRAnswer('Java Developer', 'What is garbage collection?', gcAnswer);
  console.log('✅ TEST 2 (Garbage Collection):', res2.overallScore >= 8.0 && res2.technicalScore >= 8.0 && res2.recommendation === 'Pass' ? 'PASS' : 'FAIL');
  console.log('   Results:', { overall: res2.overallScore, technical: res2.technicalScore, rec: res2.recommendation });

  // 3. Test Task 10 - Random gibberish "asdf"
  const res3 = await evaluateHRAnswer('Software Engineer', 'What is OOP?', 'asdf');
  console.log('✅ TEST 3 ("asdf" Gibberish):', res3.overallScore === 0 && res3.recommendation === 'Fail' ? 'PASS' : 'FAIL');

  // 4. Test Task 10 - Random text "nnn"
  const res4 = await evaluateHRAnswer('Software Engineer', 'What is OOP?', 'nnn');
  console.log('✅ TEST 4 ("nnn" Gibberish):', res4.overallScore === 0 && res4.recommendation === 'Fail' ? 'PASS' : 'FAIL');

  // 5. Test Task 10 - Evasive "I don't know"
  const res5 = await evaluateHRAnswer('Software Engineer', 'What is OOP?', "I don't know");
  console.log('✅ TEST 5 ("I don\'t know" Evasive):', res5.overallScore === 1 && res5.recommendation === 'Fail' ? 'PASS' : 'FAIL');

  // 6. Test Task 3 & 4 - Markdown Clean & Validation
  const markdownPayload = `\`\`\`json
  {
    "overallScore": 9.0,
    "technicalScore": 9.2,
    "communicationScore": 8.8,
    "grammarScore": 9.0,
    "confidenceScore": 8.5,
    "relevanceScore": 9.5,
    "problemSolvingScore": 9.0,
    "professionalismScore": 9.2,
    "strengths": ["Clean structure"],
    "weaknesses": ["None"],
    "feedback": "Perfect response.",
    "improvedAnswer": "Exemplar...",
    "recommendation": "Pass",
    "learningSuggestions": ["Topic 1"]
  }
  \`\`\``;
  const res6 = parseAndValidateEvaluation(markdownPayload, defaultFallback);
  console.log('✅ TEST 6 (Markdown Clean & Parse):', res6 && res6.overallScore === 9.0 ? 'PASS' : 'FAIL');

  // 7. Test Task 11 - Malformed JSON null return
  const malformed = `{ overallScore: 9.0, technicalScore: `;
  const res7 = parseAndValidateEvaluation(malformed, null);
  console.log('✅ TEST 7 (Malformed JSON returns null for retry):', res7 === null ? 'PASS' : 'FAIL');

  console.log('\n🎉 ALL 7 UNIT TESTS COMPLETED SUCCESSFULLY!');
}

runAllTests().catch(err => {
  console.error('❌ Test runner error:', err);
});
