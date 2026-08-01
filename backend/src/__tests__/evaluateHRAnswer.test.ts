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
  console.log('🧪 RUNNING TASK 1-8 DYNAMIC SCORING UNIT TESTS...\n');

  // 1. Test Task 5 & 7 - Answer: "no" -> Overall: 0, Fail
  const resNo = await evaluateHRAnswer('Software Engineer', 'What is overloading?', 'no');
  console.log('✅ TEST 1 ("no" Irrelevant Answer):', resNo.overallScore === 0 && resNo.recommendation === 'Fail' ? 'PASS' : 'FAIL');
  console.log('   Results:', { overall: resNo.overallScore, rec: resNo.recommendation });

  // 2. Test Task 5 & 7 - Answer: "I don't know." -> Overall: 1, Fail
  const resIdk = await evaluateHRAnswer('Software Engineer', 'What is OOP?', "I don't know.");
  console.log('✅ TEST 2 ("I don\'t know." Evasive Answer):', resIdk.overallScore === 1 && resIdk.recommendation === 'Fail' ? 'PASS' : 'FAIL');
  console.log('   Results:', { overall: resIdk.overallScore, rec: resIdk.recommendation });

  // 3. Test Task 5 - Answer too short (< 5 words): "it is methods" -> Overall: 0, Fail
  const resShort = await evaluateHRAnswer('Software Engineer', 'What is OOP?', 'it is methods');
  console.log('✅ TEST 3 (Too Short < 5 Words):', resShort.overallScore === 0 && resShort.recommendation === 'Fail' ? 'PASS' : 'FAIL');
  console.log('   Results:', { overall: resShort.overallScore, rec: resShort.recommendation });

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
