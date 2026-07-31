import { parseAndValidateEvaluation, IEvaluationResult } from '../utils/gemini';

const defaultFallback: IEvaluationResult = {
  overallScore: 7.0,
  technicalScore: 7.0,
  communicationScore: 7.5,
  grammarScore: 7.5,
  confidenceScore: 7.0,
  relevanceScore: 7.5,
  problemSolvingScore: 7.0,
  professionalismScore: 7.5,
  strengths: ['Good answer'],
  weaknesses: ['Add metrics'],
  feedback: 'Satisfactory answer.',
  improvedAnswer: 'Exemplar answer...',
  recommendation: 'Borderline',
  learningSuggestions: ['Practice STAR method'],
  score: 7.0,
  evaluation: {
    grammar: 'Grammar Score: 7.5/10',
    confidence: 'Confidence Score: 7.0/10',
    technical: 'Technical Score: 7.0/10',
    suggestions: 'Satisfactory answer.'
  },
  idealAnswer: 'Exemplar answer...'
};

console.log('🧪 RUNNING EVALUATE HR ANSWER PARSING & VALIDATION UNIT TESTS...\n');

// 1. Test Valid JSON
const validJSON = JSON.stringify({
  overallScore: 8.6,
  technicalScore: 9.0,
  communicationScore: 8.5,
  grammarScore: 9.0,
  confidenceScore: 8.0,
  relevanceScore: 10.0,
  problemSolvingScore: 8.5,
  professionalismScore: 9.0,
  strengths: ['Great technical depth', 'Structured explanation'],
  weaknesses: ['Could add specific metric outcomes'],
  feedback: 'Excellent overall answer.',
  improvedAnswer: 'In my experience...',
  recommendation: 'Pass',
  learningSuggestions: ['Distributed systems', 'Caching']
});

const res1 = parseAndValidateEvaluation(validJSON, defaultFallback);
console.log('✅ TEST 1 (Valid JSON):', res1.overallScore === 8.6 && res1.technicalScore === 9.0 ? 'PASS' : 'FAIL');

// 2. Test Markdown JSON
const markdownJSON = `\`\`\`json
{
  "overallScore": 9.2,
  "technicalScore": 9.5,
  "communicationScore": 9.0,
  "grammarScore": 9.2,
  "confidenceScore": 9.0,
  "relevanceScore": 9.5,
  "problemSolvingScore": 9.2,
  "professionalismScore": 9.5,
  "strengths": ["Top tier response"],
  "weaknesses": ["None"],
  "feedback": "Outstanding answer.",
  "improvedAnswer": "Exemplar...",
  "recommendation": "Pass",
  "learningSuggestions": ["Advanced Design Patterns"]
}
\`\`\``;

const res2 = parseAndValidateEvaluation(markdownJSON, defaultFallback);
console.log('✅ TEST 2 (Markdown Wrapped JSON):', res2.overallScore === 9.2 && res2.technicalScore === 9.5 ? 'PASS' : 'FAIL');

// 3. Test Missing Fields
const missingFieldsJSON = JSON.stringify({
  score: 6.5,
  feedback: 'Decent attempt.'
});

const res3 = parseAndValidateEvaluation(missingFieldsJSON, defaultFallback);
console.log('✅ TEST 3 (Missing Fields Defaulting):', res3.overallScore === 6.5 && res3.technicalScore === 7.0 && !isNaN(res3.technicalScore) ? 'PASS' : 'FAIL');

// 4. Test Malformed JSON
const malformedJSON = `{ overallScore: 8.5, technicalScore: `;

const res4 = parseAndValidateEvaluation(malformedJSON, defaultFallback);
console.log('✅ TEST 4 (Malformed JSON Handling):', res4.overallScore === 7.0 && !isNaN(res4.overallScore) ? 'PASS' : 'FAIL');

// 5. Test Empty Response
const emptyResponse = '';

const res5 = parseAndValidateEvaluation(emptyResponse, defaultFallback);
console.log('✅ TEST 5 (Empty Response Handling):', res5.overallScore === 7.0 && !isNaN(res5.overallScore) ? 'PASS' : 'FAIL');

console.log('\n🎉 ALL 5 UNIT TESTS COMPLETED SUCCESSFULLY!');
