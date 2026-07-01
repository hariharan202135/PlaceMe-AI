import Category from '../models/Category';
import Question from '../models/Question';
import MockTest from '../models/MockTest';

export const seedDatabase = async () => {
  try {
    const codingProblemCount = await Question.countDocuments({ type: 'Coding' });
    const hasGeneralAptMock = await MockTest.findOne({ companyTag: 'General Aptitude' });
    
    if (!hasGeneralAptMock || codingProblemCount < 900) {
      console.log('🧹 Old or incomplete seed detected. Clearing collections for full fresh seed of MCQs & 900 Coding Problems...');
      await Category.deleteMany({});
      await Question.deleteMany({});
      await MockTest.deleteMany({});
    } else {
      console.log('📚 Database already seeded with placement prep & 900 coding problems. Skipping initial seeding.');
      return;
    }

    console.log('🌱 Database is empty. Starting seeding standard prep data...');

    // 1. Create Core Categories
    const apt = await Category.create({ name: 'Quantitative Aptitude', slug: 'aptitude', description: 'Mathematical and numerical analysis tests' });
    const logi = await Category.create({ name: 'Logical Reasoning', slug: 'logical', description: 'Logical puzzles, diagrams and deductions' });
    const verb = await Category.create({ name: 'Verbal Ability', slug: 'verbal', description: 'English grammar, vocabulary and reading comprehension' });
    const codeCat = await Category.create({ name: 'Coding & Algorithms', slug: 'coding', description: 'Data structures, coding problems, and syntax evaluation' });

    console.log('✅ Created Categories.');

    // 2. Define Questions List (topics, companies, type, content)
    const questionsData = [
      // 1. Number System
      {
        category: 'aptitude',
        topic: 'Number System',
        difficulty: 'Easy',
        type: 'MCQ',
        questionText: 'What is the unit digit of the expression 17^17 + 27^27?',
        options: ['4', '6', '8', '0'],
        correctOption: 0,
        explanation: 'Unit digit of 17^17: cyclicity of 7 is 4. 17/4 leaves remainder 1. 7^1 = 7. Unit digit of 27^27: remainder 27/4 = 3. 7^3 = 343 (unit digit 3). 7 + 3 = 10, unit digit is 0.',
        companyTags: ['TCS', 'Infosys', 'Accenture']
      },
      {
        category: 'aptitude',
        topic: 'Number System',
        difficulty: 'Medium',
        type: 'MCQ',
        questionText: 'Find the greatest number that will divide 148, 246 and 623 leaving remainders 4, 6 and 11 respectively.',
        options: ['12', '18', '24', '16'],
        correctOption: 1,
        explanation: 'Numbers to divide: 148-4=144, 246-6=240, 623-11=612. HCF of 144, 240, and 612 is 18.',
        companyTags: ['Wipro', 'Cognizant', 'Capgemini']
      },

      // 2. Percentages
      {
        category: 'aptitude',
        topic: 'Percentages',
        difficulty: 'Easy',
        type: 'MCQ',
        questionText: 'If 20% of a number is 120, then what is 120% of that number?',
        options: ['720', '360', '480', '600'],
        correctOption: 0,
        explanation: 'Let the number be x. 20% of x = 120 => 0.2x = 120 => x = 600. Now, 120% of 600 = 1.2 * 600 = 720.',
        companyTags: ['TCS', 'Infosys', 'HCL']
      },
      {
        category: 'aptitude',
        topic: 'Percentages',
        difficulty: 'Medium',
        type: 'MCQ',
        questionText: 'Due to a 25% reduction in the price of sugar, a man can buy 5 kg more sugar for ₹600. Find the original price per kg.',
        options: ['₹30', '₹40', '₹50', '₹36'],
        correctOption: 1,
        explanation: '25% of ₹600 = ₹150. For ₹150, he gets 5 kg sugar => reduced price = ₹30/kg. Since reduction is 25%, original price x * 0.75 = 30 => x = ₹40/kg.',
        companyTags: ['Wipro', 'Accenture', 'Tech Mahindra']
      },

      // 3. Profit and Loss
      {
        category: 'aptitude',
        topic: 'Profit and Loss',
        difficulty: 'Medium',
        type: 'MCQ',
        questionText: 'A dishonest shopkeeper sells goods at cost price but uses a weight of 900 grams for a kg. What is his profit percentage?',
        options: ['10%', '11.11%', '9.09%', '12.5%'],
        correctOption: 1,
        explanation: 'Profit percentage = (Error / True Value - Error) * 100 = (100g / 900g) * 100 = 100/9 = 11.11%.',
        companyTags: ['TCS', 'Infosys', 'Cognizant']
      },
      {
        category: 'aptitude',
        topic: 'Profit and Loss',
        difficulty: 'Easy',
        type: 'MCQ',
        questionText: 'A dealer buys an article for ₹80. He wants to gain 20% after giving a discount of 10% to the customer. What should be the marked price?',
        options: ['₹100', '₹106.67', '₹96', '₹108'],
        correctOption: 1,
        explanation: 'Selling price needed = 80 * 1.2 = ₹96. Mark price after 10% discount = 96 / 0.9 = ₹106.67.',
        companyTags: ['Wipro', 'Capgemini', 'HCL']
      },

      // 4. Ratio and Proportion
      {
        category: 'aptitude',
        topic: 'Ratio and Proportion',
        difficulty: 'Easy',
        type: 'MCQ',
        questionText: 'If A:B = 2:3 and B:C = 4:5, find the ratio A:B:C.',
        options: ['2:12:15', '8:12:15', '8:12:10', '2:4:5'],
        correctOption: 1,
        explanation: 'Multiply A:B by 4 and B:C by 3 to equate B. A:B = 8:12, B:C = 12:15. Hence A:B:C = 8:12:15.',
        companyTags: ['TCS', 'Accenture', 'Tech Mahindra']
      },

      // 5. Average
      {
        category: 'aptitude',
        topic: 'Average',
        difficulty: 'Easy',
        type: 'MCQ',
        questionText: 'The average weight of 8 persons increases by 2.5 kg when a new person comes in place of one of them weighing 65 kg. What is the weight of the new person?',
        options: ['70 kg', '75 kg', '85 kg', '80 kg'],
        correctOption: 2,
        explanation: 'Total increase in weight = 8 * 2.5 = 20 kg. Weight of new person = weight of replaced person + increase = 65 + 20 = 85 kg.',
        companyTags: ['Wipro', 'Infosys', 'HCL']
      },

      // 6. Time and Work
      {
        category: 'aptitude',
        topic: 'Time and Work',
        difficulty: 'Easy',
        type: 'MCQ',
        questionText: 'A can do a piece of work in 10 days, and B can do the same work in 15 days. How long will they take to complete the work working together?',
        options: ['5 days', '6 days', '8 days', '9 days'],
        correctOption: 1,
        explanation: 'A\'s 1 day work = 1/10. B\'s 1 day work = 1/15. Together 1 day work = 1/10 + 1/15 = 5/30 = 1/6. Hence, they take 6 days.',
        companyTags: ['TCS', 'Wipro', 'Cognizant']
      },

      // 7. Time Speed Distance
      {
        category: 'aptitude',
        topic: 'Time Speed Distance',
        difficulty: 'Medium',
        type: 'MCQ',
        questionText: 'A train 150m long passes a telegraph post in 12 seconds. How long will it take to cross a bridge of length 250m?',
        options: ['20 sec', '24 sec', '32 sec', '40 sec'],
        correctOption: 2,
        explanation: 'Speed of train = 150 / 12 = 12.5 m/s. Total distance to cross bridge = 150 + 250 = 400m. Time = 400 / 12.5 = 32 seconds.',
        companyTags: ['TCS', 'Accenture', 'Capgemini']
      },

      // 8. Probability
      {
        category: 'aptitude',
        topic: 'Probability',
        difficulty: 'Medium',
        type: 'MCQ',
        questionText: 'Two dice are thrown simultaneously. What is the probability that the sum of the numbers on the two faces is a prime number?',
        options: ['5/12', '1/2', '7/18', '11/36'],
        correctOption: 0,
        explanation: 'Total outcomes = 36. Prime sums possible: 2 (1 outcome), 3 (2 outcomes), 5 (4 outcomes), 7 (6 outcomes), 11 (2 outcomes). Total prime outcomes = 1 + 2 + 4 + 6 + 2 = 15. Probability = 15/36 = 5/12.',
        companyTags: ['Infosys', 'TCS', 'Tech Mahindra']
      },

      // 9. Permutation and Combination
      {
        category: 'aptitude',
        topic: 'Permutation and Combination',
        difficulty: 'Hard',
        type: 'MCQ',
        questionText: 'In how many different ways can the letters of the word "LEADING" be arranged in such a way that the vowels always come together?',
        options: ['720', '360', '5040', '120'],
        correctOption: 0,
        explanation: 'Word LEADING has vowels E, A, I (3 vowels) and consonants L, D, N, G (4 consonants). Treat vowels as 1 letter: total units = 4 + 1 = 5. Arrange units: 5! = 120. Arrange vowels among themselves: 3! = 6. Total = 120 * 6 = 720.',
        companyTags: ['TCS', 'Wipro', 'Capgemini']
      },

      // 10. Simple Interest
      {
        category: 'aptitude',
        topic: 'Simple Interest',
        difficulty: 'Easy',
        type: 'MCQ',
        questionText: 'A sum of money at simple interest doubles itself in 8 years. In how many years will it become four times of itself?',
        options: ['16 years', '24 years', '32 years', '20 years'],
        correctOption: 1,
        explanation: 'Doubles itself in 8 years => Interest = Principal. R = 100/8 = 12.5%. For 4 times, Interest = 3 * Principal. Time = (3 * 100) / 12.5 = 24 years.',
        companyTags: ['Infosys', 'Accenture', 'HCL']
      },

      // 11. Compound Interest
      {
        category: 'aptitude',
        topic: 'Compound Interest',
        difficulty: 'Medium',
        type: 'MCQ',
        questionText: 'If the difference between CI and SI on a certain sum of money for 2 years at 5% per annum is ₹15, find the sum.',
        options: ['₹6000', '₹5000', '₹4500', '₹7500'],
        correctOption: 0,
        explanation: 'Difference D = P * (R/100)^2 => 15 = P * (5/100)^2 => 15 = P * (1/400) => P = 15 * 400 = ₹6000.',
        companyTags: ['TCS', 'Wipro', 'Cognizant']
      },

      // 12. Pipes and Cisterns
      {
        category: 'aptitude',
        topic: 'Pipes and Cisterns',
        difficulty: 'Easy',
        type: 'MCQ',
        questionText: 'Pipe A can fill a tank in 12 hours and Pipe B can empty it in 18 hours. If both pipes are opened together, how long will it take to fill the tank?',
        options: ['30 hours', '36 hours', '24 hours', '48 hours'],
        correctOption: 1,
        explanation: 'A\'s rate = 1/12. B\'s rate = -1/18. Net rate = 1/12 - 1/18 = (3-2)/36 = 1/36. Thus, it takes 36 hours.',
        companyTags: ['Wipro', 'Capgemini', 'Tech Mahindra']
      },

      // 13. Data Interpretation
      {
        category: 'aptitude',
        topic: 'Data Interpretation',
        difficulty: 'Medium',
        type: 'MCQ',
        questionText: 'If the production of cars in 2024 is 120,000 and increases by 15% in 2025, what is the production in 2025?',
        options: ['135,000', '138,000', '142,000', '136,000'],
        correctOption: 1,
        explanation: 'Increase = 120,000 * 0.15 = 18,000. Total in 2025 = 120,000 + 18,000 = 138,000.',
        companyTags: ['TCS', 'Infosys', 'Accenture']
      },

      // 14. Logical Reasoning
      {
        category: 'logical',
        topic: 'Logical Reasoning',
        difficulty: 'Easy',
        type: 'MCQ',
        questionText: 'Pointing to a photograph, a man said, "I have no brother or sister but that man\'s father is my father\'s son." Whose photograph was it?',
        options: ['His nephew\'s', 'His son\'s', 'His father\'s', 'His own'],
        correctOption: 1,
        explanation: 'Since the man has no brother or sister, "my father\'s son" is the man himself. Therefore, the father of the person in the photograph is the man himself, meaning it is his son\'s photograph.',
        companyTags: ['Infosys', 'Capgemini', 'HCL']
      },
      {
        category: 'logical',
        topic: 'Logical Reasoning',
        difficulty: 'Medium',
        type: 'MCQ',
        questionText: 'Statements: All pencils are brick. All bricks are bottles. Conclusions: I. All pencils are bottles. II. Some bottles are pencils. Choose option:',
        options: ['Only conclusion I follows', 'Only conclusion II follows', 'Neither I nor II follows', 'Both I and II follow'],
        correctOption: 3,
        explanation: 'All pencils are brick and all bricks are bottles => All pencils are bottles. Since all pencils are bottles, some bottles are definitely pencils. Hence, both conclusions follow.',
        companyTags: ['TCS', 'Accenture', 'Cognizant']
      },

      // 15. Verbal Ability
      {
        category: 'verbal',
        topic: 'Verbal Ability',
        difficulty: 'Easy',
        type: 'MCQ',
        questionText: 'Identify the grammatically correct sentence:',
        options: [
          'He and myself went to the library.',
          'He and I went to the library.',
          'Him and I went to the library.',
          'Him and myself went to the library.'
        ],
        correctOption: 1,
        explanation: 'Use the subject pronoun "I" rather than "myself" or "him" when acting as the subject of the sentence.',
        companyTags: ['TCS', 'Wipro', 'Tech Mahindra']
      },
      {
        category: 'verbal',
        topic: 'Verbal Ability',
        difficulty: 'Medium',
        type: 'MCQ',
        questionText: 'Choose the antonym for the word "ABUNDANT":',
        options: ['Scarce', 'Plentiful', 'Generous', 'Common'],
        correctOption: 0,
        explanation: 'Abundant means existing or available in large quantities. Scarce means insufficient for the demand.',
        companyTags: ['Accenture', 'Infosys', 'Capgemini']
      },

      // Company Technical Placement Questions (DBMS, OOPs, Coding Logic)
      {
        category: 'verbal',
        topic: 'Verbal Ability',
        difficulty: 'Medium',
        type: 'MCQ',
        questionText: 'What is a primary key in a relational database?',
        options: [
          'A key that allows duplicate and null values',
          'A unique identifier for each record in a table that cannot be null',
          'A key used to encrypt the database',
          'A secondary key linking to another table'
        ],
        correctOption: 1,
        explanation: 'A primary key uniquely identifies each record in a relational database table. By definition, it must be unique and cannot contain null values.',
        companyTags: ['TCS', 'Wipro', 'Infosys', 'Accenture', 'Cognizant', 'Capgemini', 'HCL', 'Tech Mahindra']
      },
      {
        category: 'verbal',
        topic: 'Verbal Ability',
        difficulty: 'Medium',
        type: 'MCQ',
        questionText: 'Which OOP concept refers to wrapping data and methods into a single unit?',
        options: ['Inheritance', 'Polymorphism', 'Abstraction', 'Encapsulation'],
        correctOption: 3,
        explanation: 'Encapsulation is the OOP mechanism of binding data (variables) and code (methods) together as a single unit, hiding implementation details.',
        companyTags: ['TCS', 'Wipro', 'Infosys', 'Accenture', 'Cognizant', 'Capgemini', 'HCL', 'Tech Mahindra']
      }
    ];

    // Insert Questions
    const createdQuestions: any[] = [];
    for (const q of questionsData) {
      // Map category slug to mongoose id
      let catId = apt._id;
      if (q.category === 'logical') catId = logi._id;
      if (q.category === 'verbal') catId = verb._id;
      if (q.category === 'coding') catId = codeCat._id;

      const createdQ = await Question.create({
        category: catId,
        topic: q.topic,
        difficulty: q.difficulty,
        type: q.type,
        questionText: q.questionText,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        companyTags: q.companyTags
      });
      createdQuestions.push(createdQ);
    }

    console.log(`✅ Created ${createdQuestions.length} MCQ questions.`);

    // 3. Create 900 Coding Problems
    console.log('🌱 Generating 900 Coding Challenges across 9 domains...');
    
    const domains = [
      'General Coding',
      'TCS Coding',
      'Wipro Coding',
      'Infosys Coding',
      'Cognizant Coding',
      'Accenture Coding',
      'Capgemini Coding',
      'HCL Coding',
      'Tech Mahindra Coding'
    ];

    const baseProblems = [
      {
        name: 'Reverse String',
        topic: 'String Manipulation',
        desc: 'Write a program that reads a string and returns its reverse.',
        inputFormat: 'A single line containing the string.',
        outputFormat: 'The reversed string.',
        constraints: 'Length of string <= 100.',
        exampleInput: 'hello',
        exampleOutput: 'olleh',
        explanation: 'Reverse the input string by reading characters from end to beginning.',
        testCases: [
          { input: 'hello', output: 'olleh', isHidden: false },
          { input: 'world', output: 'dlrow', isHidden: true }
        ]
      },
      {
        name: 'Fibonacci Series',
        topic: 'Dynamic Programming',
        desc: 'Write a program that returns the N-th Fibonacci number. Assume F(0) = 0 and F(1) = 1.',
        inputFormat: 'An integer N.',
        outputFormat: 'The N-th Fibonacci number.',
        constraints: '0 <= N <= 30.',
        exampleInput: '5',
        exampleOutput: '5',
        explanation: 'Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8... The 5th number (0-indexed) is 5.',
        testCases: [
          { input: '5', output: '5', isHidden: false },
          { input: '8', output: '21', isHidden: true }
        ]
      },
      {
        name: 'Palindrome Check',
        topic: 'String Manipulation',
        desc: 'Write a program to verify if a given string is a palindrome (reads same forwards and backwards). Print true or false.',
        inputFormat: 'A string S.',
        outputFormat: 'true or false.',
        constraints: 'Length of string <= 100.',
        exampleInput: 'radar',
        exampleOutput: 'true',
        explanation: 'The string "radar" reads same backwards, so it is a palindrome.',
        testCases: [
          { input: 'radar', output: 'true', isHidden: false },
          { input: 'hello', output: 'false', isHidden: true }
        ]
      },
      {
        name: 'Factorial Calculator',
        topic: 'Recursion',
        desc: 'Write a program that calculates the factorial of a positive integer N.',
        inputFormat: 'An integer N.',
        outputFormat: 'The factorial of N.',
        constraints: '1 <= N <= 10.',
        exampleInput: '5',
        exampleOutput: '120',
        explanation: 'Factorial of 5 is 5 * 4 * 3 * 2 * 1 = 120.',
        testCases: [
          { input: '5', output: '120', isHidden: false },
          { input: '6', output: '720', isHidden: true }
        ]
      },
      {
        name: 'Prime Number Verification',
        topic: 'Basic Mathematics',
        desc: 'Write a program to check whether a given integer is a prime number. Print true or false.',
        inputFormat: 'An integer N.',
        outputFormat: 'true or false.',
        constraints: '2 <= N <= 10000.',
        exampleInput: '7',
        exampleOutput: 'true',
        explanation: '7 has no factors other than 1 and itself, so it is prime.',
        testCases: [
          { input: '7', output: 'true', isHidden: false },
          { input: '12', output: 'false', isHidden: true }
        ]
      },
      {
        name: 'Sum of Array Elements',
        topic: 'Array Operations',
        desc: 'Write a program that reads a list of space-separated integers and returns their sum.',
        inputFormat: 'Space-separated integers.',
        outputFormat: 'The sum of all elements.',
        constraints: 'Number of elements <= 100.',
        exampleInput: '1 2 3 4 5',
        exampleOutput: '15',
        explanation: '1 + 2 + 3 + 4 + 5 = 15.',
        testCases: [
          { input: '1 2 3 4 5', output: '15', isHidden: false },
          { input: '10 20 30', output: '60', isHidden: true }
        ]
      },
      {
        name: 'Find Maximum Element',
        topic: 'Array Operations',
        desc: 'Write a program that reads a list of space-separated integers and returns the maximum element.',
        inputFormat: 'Space-separated integers.',
        outputFormat: 'The largest element value.',
        constraints: 'Number of elements <= 100.',
        exampleInput: '5 8 2 10 3',
        exampleOutput: '10',
        explanation: 'The largest number in the list is 10.',
        testCases: [
          { input: '5 8 2 10 3', output: '10', isHidden: false },
          { input: '-1 -5 -2', output: '-1', isHidden: true }
        ]
      },
      {
        name: 'FizzBuzz Algorithm',
        topic: 'Basic Logic',
        desc: 'Write a program that prints "Fizz" if a number is divisible by 3, "Buzz" if divisible by 5, and "FizzBuzz" if divisible by both. Otherwise print the number itself.',
        inputFormat: 'An integer N.',
        outputFormat: 'Fizz, Buzz, FizzBuzz or the number.',
        constraints: '1 <= N <= 100.',
        exampleInput: '15',
        exampleOutput: 'FizzBuzz',
        explanation: '15 is divisible by both 3 and 5, so print FizzBuzz.',
        testCases: [
          { input: '15', output: 'FizzBuzz', isHidden: false },
          { input: '9', output: 'Fizz', isHidden: true }
        ]
      },
      {
        name: 'Matrix Transpose',
        topic: 'Matrix Operations',
        desc: 'Write a program that transposes a 2x2 matrix. Input is 4 space-separated integers representing row-major matrix. Output is 4 space-separated integers representing the transposed matrix.',
        inputFormat: '4 space-separated integers.',
        outputFormat: '4 space-separated integers.',
        constraints: 'All integers <= 1000.',
        exampleInput: '1 2 3 4',
        exampleOutput: '1 3 2 4',
        explanation: 'Original: [[1, 2], [3, 4]] -> Transposed: [[1, 3], [2, 4]] -> 1 3 2 4.',
        testCases: [
          { input: '1 2 3 4', output: '1 3 2 4', isHidden: false },
          { input: '5 6 7 8', output: '5 7 6 8', isHidden: true }
        ]
      },
      {
        name: 'Binary Search Implementation',
        topic: 'Search Algorithms',
        desc: 'Implement a binary search. The input has space-separated elements followed by a "|" and the target value. Output the 0-based index if found, else -1.',
        inputFormat: 'Sorted array elements separated by spaces, followed by "|" and the target element.',
        outputFormat: 'Index or -1.',
        constraints: 'Array size <= 100.',
        exampleInput: '1 2 3 4 5 | 3',
        exampleOutput: '2',
        explanation: '3 is at index 2 (0-indexed).',
        testCases: [
          { input: '1 2 3 4 5 | 3', output: '2', isHidden: false },
          { input: '10 20 30 | 40', output: '-1', isHidden: true }
        ]
      },
      {
        name: 'Bubble Sort Routine',
        topic: 'Sorting Algorithms',
        desc: 'Write a program that reads a list of space-separated integers and prints them sorted in ascending order.',
        inputFormat: 'Space-separated integers.',
        outputFormat: 'Sorted space-separated integers.',
        constraints: 'Array size <= 100.',
        exampleInput: '4 3 2 1',
        exampleOutput: '1 2 3 4',
        explanation: 'Bubble sort sorts the elements in ascending order.',
        testCases: [
          { input: '4 3 2 1', output: '1 2 3 4', isHidden: false },
          { input: '10 5 8', output: '5 8 10', isHidden: true }
        ]
      },
      {
        name: 'Anagram Verification',
        topic: 'String Manipulation',
        desc: 'Verify if two words separated by space are anagrams (contain same characters in different order). Print true or false.',
        inputFormat: 'Two space-separated words.',
        outputFormat: 'true or false.',
        constraints: 'Word lengths <= 50.',
        exampleInput: 'silent listen',
        exampleOutput: 'true',
        explanation: 'Both contain same letters, so they are anagrams.',
        testCases: [
          { input: 'silent listen', output: 'true', isHidden: false },
          { input: 'hello world', output: 'false', isHidden: true }
        ]
      },
      {
        name: 'Count Vowels Check',
        topic: 'String Manipulation',
        desc: 'Write a program to count the number of vowels (a, e, i, o, u) in a string.',
        inputFormat: 'A string S.',
        outputFormat: 'The count of vowels.',
        constraints: 'Length <= 100.',
        exampleInput: 'hello',
        exampleOutput: '2',
        explanation: 'e and o are vowels.',
        testCases: [
          { input: 'hello', output: '2', isHidden: false },
          { input: 'placement', output: '3', isHidden: true }
        ]
      },
      {
        name: 'Decimal to Binary',
        topic: 'Basic Mathematics',
        desc: 'Convert a base-10 positive integer N to its base-2 binary representation string.',
        inputFormat: 'An integer N.',
        outputFormat: 'The binary string representation.',
        constraints: '0 <= N <= 1000.',
        exampleInput: '10',
        exampleOutput: '1010',
        explanation: '10 in binary is 1010.',
        testCases: [
          { input: '10', output: '1010', isHidden: false },
          { input: '156', output: '10011100', isHidden: true }
        ]
      },
      {
        name: 'GCD Calculator',
        topic: 'Basic Logic',
        desc: 'Calculate the Greatest Common Divisor (GCD) of two positive integers separated by space.',
        inputFormat: 'Two space-separated integers.',
        outputFormat: 'The GCD value.',
        constraints: 'Both values <= 100000.',
        exampleInput: '12 18',
        exampleOutput: '6',
        explanation: 'Common factors are 1, 2, 3, 6. The largest is 6.',
        testCases: [
          { input: '12 18', output: '6', isHidden: false },
          { input: '25 15', output: '5', isHidden: true }
        ]
      },
      {
        name: 'LCM Calculator',
        topic: 'Basic Logic',
        desc: 'Calculate the Least Common Multiple (LCM) of two positive integers separated by space.',
        inputFormat: 'Two space-separated integers.',
        outputFormat: 'The LCM value.',
        constraints: 'Both values <= 10000.',
        exampleInput: '12 18',
        exampleOutput: '36',
        explanation: 'LCM of 12 and 18 is 36.',
        testCases: [
          { input: '12 18', output: '36', isHidden: false },
          { input: '5 7', output: '35', isHidden: true }
        ]
      },
      {
        name: 'Leap Year Check',
        topic: 'Basic Logic',
        desc: 'Check if a given year is a leap year. Print true or false.',
        inputFormat: 'A year Y.',
        outputFormat: 'true or false.',
        constraints: '1 <= Y <= 3000.',
        exampleInput: '2020',
        exampleOutput: 'true',
        explanation: '2020 is divisible by 4, so it is a leap year.',
        testCases: [
          { input: '2020', output: 'true', isHidden: false },
          { input: '2021', output: 'false', isHidden: true }
        ]
      },
      {
        name: 'Second Largest Element',
        topic: 'Array Operations',
        desc: 'Read a space-separated list of integers and find the second largest distinct element.',
        inputFormat: 'Space-separated integers.',
        outputFormat: 'The second largest value.',
        constraints: 'At least 2 elements.',
        exampleInput: '10 20 5 15',
        exampleOutput: '15',
        explanation: 'Largest is 20, second largest is 15.',
        testCases: [
          { input: '10 20 5 15', output: '15', isHidden: false },
          { input: '1 2', output: '1', isHidden: true }
        ]
      },
      {
        name: 'Remove Duplicates List',
        topic: 'Array Operations',
        desc: 'Read a space-separated list of integers and return them with all duplicate values removed in original order.',
        inputFormat: 'Space-separated integers.',
        outputFormat: 'Space-separated integers with duplicates removed.',
        constraints: 'List size <= 100.',
        exampleInput: '1 2 2 3 3 4',
        exampleOutput: '1 2 3 4',
        explanation: 'Duplicates of 2 and 3 are stripped.',
        testCases: [
          { input: '1 2 2 3 3 4', output: '1 2 3 4', isHidden: false },
          { input: '5 5 5', output: '5', isHidden: true }
        ]
      },
      {
        name: 'Power of Two Check',
        topic: 'Basic Mathematics',
        desc: 'Determine whether a given integer is a power of 2. Print true or false.',
        inputFormat: 'An integer N.',
        outputFormat: 'true or false.',
        constraints: '1 <= N <= 100000.',
        exampleInput: '16',
        exampleOutput: 'true',
        explanation: '16 is 2^4, so true.',
        testCases: [
          { input: '16', output: 'true', isHidden: false },
          { input: '18', output: 'false', isHidden: true }
        ]
      }
    ];

    const codingQuestionsPayload: any[] = [];

    for (const domain of domains) {
      const companyClean = domain.replace(' Coding', '');
      for (let setIdx = 1; setIdx <= 5; setIdx++) {
        let diff: 'Easy' | 'Medium' | 'Hard' = 'Easy';
        if (setIdx === 3 || setIdx === 4) diff = 'Medium';
        if (setIdx === 5) diff = 'Hard';

        for (let qIdx = 0; qIdx < 20; qIdx++) {
          const base = baseProblems[qIdx];
          
          const questionText = `### Problem Description
${base.desc}

### Input Format
${base.inputFormat}

### Output Format
${base.outputFormat}

### Constraints
${base.constraints}

### Example
**Input:**
\`${base.exampleInput}\`

**Output:**
\`${base.exampleOutput}\``;

          codingQuestionsPayload.push({
            category: codeCat._id,
            topic: `${base.name} - Set ${setIdx} (Challenge ${qIdx + 1})`,
            difficulty: diff,
            type: 'Coding',
            questionText,
            options: [],
            correctOption: 0,
            explanation: base.explanation,
            companyTags: [companyClean],
            codingDomain: domain,
            codingSetIndex: setIdx,
            codingTestCases: base.testCases
          });
        }
      }
    }

    await Question.insertMany(codingQuestionsPayload);
    console.log('✅ Created 900 Coding Problems (9 domains × 5 sets × 20 questions).');

    // 4. Create Mock Tests (TCS, Wipro, General Aptitude and other companies - 5 tests each!)
    const aptitudeMcqs = createdQuestions.slice(0, 20).map((q: any) => q._id);
    const tcsQuestions = createdQuestions.filter((q: any) => q.companyTags && q.companyTags.includes('TCS')).map((q: any) => q._id);
    const wiproQuestions = createdQuestions.filter((q: any) => q.companyTags && q.companyTags.includes('Wipro')).map((q: any) => q._id);

    const getQuestionsForCompany = (compName: string) => {
      let filtered = createdQuestions.filter((q: any) => q.companyTags && q.companyTags.includes(compName)).map((q: any) => q._id);
      if (filtered.length < 5) {
        const extra = createdQuestions.slice(0, 8).map((q: any) => q._id);
        filtered = Array.from(new Set([...filtered, ...extra]));
      }
      return filtered.slice(0, 15);
    };

    const createFiveMockTests = async (
      baseTitle: string,
      tag: string,
      questionsList: any[],
      duration: number,
      catId: any
    ) => {
      for (let i = 1; i <= 5; i++) {
        await MockTest.create({
          title: `${baseTitle} - Mock Test ${i}`,
          description: `Simulated placement examination ${i} for ${tag}. Evaluates key subject competencies.`,
          duration,
          category: catId,
          questions: questionsList,
          totalMarks: questionsList.length * 10,
          passingMarks: Math.ceil(questionsList.length * 10 * 0.6),
          companyTag: tag,
          isPremium: i > 1
        });
      }
    };

    // Seed General Aptitude tests
    await createFiveMockTests('General Aptitude Comprehensive', 'General Aptitude', aptitudeMcqs, 20, apt._id);

    // Seed TCS tests
    await createFiveMockTests('TCS NQT Comprehensive Prep', 'TCS', tcsQuestions, 30, apt._id);

    // Seed Wipro tests
    await createFiveMockTests('Wipro Elite NTH Practice', 'Wipro', wiproQuestions, 20, apt._id);

    // Seed remaining company based tests
    const otherCompanies = ['Infosys', 'Accenture', 'Cognizant', 'Capgemini', 'HCL', 'Tech Mahindra'];
    for (const company of otherCompanies) {
      const companyQuestions = getQuestionsForCompany(company);
      await createFiveMockTests(`${company} Placement Prep`, company, companyQuestions, 25, apt._id);
    }

    console.log('✅ Created 5 Mock Tests for General Aptitude, TCS, Wipro, and all companies.');
    console.log('🎉 Database seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};
