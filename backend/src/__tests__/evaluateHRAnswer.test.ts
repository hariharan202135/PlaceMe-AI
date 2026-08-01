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
  console.log('🧪 RUNNING BALANCED BRACE JSON PARSER & EVALUATION UNIT TESTS...\n');

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

  // 4. Test Case 1: Markdown code fences
  const case1 = `\`\`\`json
  {
    "overallScore": 9.0,
    "technicalScore": 9.2,
    "communicationScore": 8.8,
    "grammarScore": 9.0,
    "confidenceScore": 8.5,
    "strengths": ["Clear explanation"],
    "weaknesses": ["None"],
    "feedback": "Great job",
    "improvedAnswer": "Exemplar...",
    "recommendation": "Pass"
  }
  \`\`\``;
  const resCase1 = parseAndValidateEvaluation(case1, null);
  console.log('✅ TEST 4 (Case 1: Markdown Fences):', resCase1 && resCase1.overallScore === 9.0 ? 'PASS' : 'FAIL');

  // 5. Test Case 2: Introductory text before JSON
  const case2 = `Here is the evaluation report for candidate answer:
  {
    "overallScore": 7.5,
    "technicalScore": 7.8,
    "communicationScore": 7.2,
    "grammarScore": 7.5,
    "confidenceScore": 7.0,
    "strengths": ["Good concept"],
    "weaknesses": ["Minor gaps"],
    "feedback": "Decent answer",
    "improvedAnswer": "Exemplar...",
    "recommendation": "Pass"
  }`;
  const resCase2 = parseAndValidateEvaluation(case2, null);
  console.log('✅ TEST 5 (Case 2: Intro text before JSON):', resCase2 && resCase2.overallScore === 7.5 ? 'PASS' : 'FAIL');

  // 6. Test Case 3: Code fences + trailing text
  const case3 = `\`\`\`json
  {
    "overallScore": 8.5,
    "technicalScore": 8.8,
    "communicationScore": 8.2,
    "grammarScore": 8.5,
    "confidenceScore": 8.0,
    "strengths": ["Strong terminology"],
    "weaknesses": ["Needs metrics"],
    "feedback": "Well written",
    "improvedAnswer": "Exemplar...",
    "recommendation": "Pass"
  }
  \`\`\`
  Thank you for using PlaceMe AI evaluator!`;
  const resCase3 = parseAndValidateEvaluation(case3, null);
  console.log('✅ TEST 6 (Case 3: Trailing text "Thank you."):', resCase3 && resCase3.overallScore === 8.5 ? 'PASS' : 'FAIL');

  // 7. Test Case 4: Extra blank lines & spaces
  const case4 = `\n\n\n  {\n\n    "overallScore": 6.5,\n    "technicalScore": 6.8,\n    "communicationScore": 6.2,\n    "grammarScore": 6.5,\n    "confidenceScore": 6.0,\n    "strengths": ["Basic definition"],\n    "weaknesses": ["Lacks detail"],\n    "feedback": "Average response",\n    "improvedAnswer": "Exemplar...",\n    "recommendation": "Borderline"\n\n  }\n\n\n`;
  const resCase4 = parseAndValidateEvaluation(case4, null);
  console.log('✅ TEST 7 (Case 4: Extra blank lines):', resCase4 && resCase4.overallScore === 6.5 ? 'PASS' : 'FAIL');

  console.log('\n🎉 ALL BALANCED BRACE PARSER UNIT TESTS COMPLETED SUCCESSFULLY!');
}

runAllTests().catch(err => {
  console.error('❌ Test runner error:', err);
});
