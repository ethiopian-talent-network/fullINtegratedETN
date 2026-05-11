interface TalentProfile {
  name: string;
  skills: string[];
  experience: string;
  education: string;
  about: string;
  location: string;
}

interface JobDetails {
  title: string;
  description: string;
  requirements: string;
  company: string;
  location: string;
  experience: string;
  salary?: string;
  budget?: string;
}

interface GenerateContentRequest {
  talentProfile: TalentProfile;
  jobDetails: JobDetails;
  type: 'cover_letter' | 'proposal';
  tone?: 'professional' | 'friendly' | 'confident';
  length?: 'short' | 'medium' | 'long';
  language?: 'english' | 'amharic';
}

interface GenerateContentResponse {
  content: string;
  suggestions?: string[];
}

export const generateCoverLetter = async (request: GenerateContentRequest): Promise<GenerateContentResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const { talentProfile, jobDetails, tone = 'professional', language = 'english' } = request;
  
  if (language === 'amharic') {
    // Create proper Amharic content without mixing English
    const jobTitle = jobDetails.title === 'Frontend Developer' ? 'የፊት ገጽ ዲቨሎፐር' : 
                     jobDetails.title === 'Backend Developer' ? 'የኋላ ገጽ ዲቨሎፐር' : 
                     jobDetails.title === 'Full Stack Developer' ? 'ሙሉ ስታክ ዲቨሎፐር' : 
                     jobDetails.title === 'Graphic Designer' ? 'ግራፊክ ዲዛይነር' : 
                     jobDetails.title === 'test developer with postman' ? 'የሙከራ ዲቨሎፐር' :
                     'የሶፍትዌር ዲቨሎፐር';
    
    const companyName = jobDetails.company === 'undefined' ? 'ድርጅትዎ' : jobDetails.company;
    
    const skills = talentProfile.skills.map(skill => {
      if (skill === 'JavaScript') return 'ጃቫስክሪፕት';
      if (skill === 'React') return 'ሪአክት';
      if (skill === 'Node.js') return 'ኖድ.ጄኤስ';
      if (skill === 'Python') return 'ፓይቶን';
      if (skill === 'PHP') return 'ፒኤችፒ';
      if (skill === 'CSS') return 'ሲኤስኤስ';
      if (skill === 'HTML') return 'ኤችቲኤምኤል';
      if (skill === 'Photoshop' || skill === 'photo Shop') return 'ፎቶሾፕ';
      if (skill === 'Illustrator') return 'ኢሉስትሬተር';
      if (skill === 'Figma') return 'ፊግማ';
      if (skill === 'Adobe Photoshop') return 'አዶቤ ፎቶሾፕ';
      if (skill === 'Graphic Design') return 'ግራፊክ ዲዛይን';
      if (skill === 'UI/UX Design') return 'የተጠቃሚ ገጽታ ዲዛይን';
      return skill;
    });
    
    // Translate experience field properly
    const translateExperience = (exp: string) => {
      if (exp.includes('Graphic Designer')) {
        return 'ግራፊክ ዲዛይነር - የተለያዩ ድርጅቶች፣ ኢትዮጵያ (2023 - አሁን)';
      }
      if (exp === 'Entry-level') return 'መጀመሪያ ደረጃ';
      if (exp === 'Mid-level') return 'መካከለኛ ደረጃ';
      if (exp === 'Senior-level') return 'ከፍተኛ ደረጃ';
      if (exp.includes('Developer')) return 'የሶፍትዌር ዲቨሎፐር ልምድ';
      if (exp.includes('Designer')) return 'የዲዛይን ልምድ';
      return exp;
    };
    
    const experienceLevel = translateExperience(talentProfile.experience);
    
    const content = `የተከበሩ የስራ አስተዳዳሪ፣

የ${jobTitle} ስራ ቦታ በ${companyName} ውስጥ ላለው የስራ እድል ጥያቄ ለማቅረብ እጽፋለሁ። በ${experienceLevel} ልምድ እና በ${skills.slice(0, 3).join('፣ ')} ክህሎቶቼ ለዚህ ስራ ተስማሚ እንደሆንኩ አምናለሁ።

${tone === 'friendly' ? 'ለዚህ የስራ እድል ከፍተኛ ፍላጎት አለኝ እና ክህሎቶቼን ለድርጅትዎ ለማዋል ዝግጁ ነኝ።' : 
  tone === 'confident' ? 'የተረጋገጠ ልምድ እና ቴክኒካል ክህሎቶቼ ለዚህ ስራ ተስማሚ እንደሆንኩ እርግጠኛ ነኝ።' : 
  'የሙያ ልምዴ ለዚህ ስራ መስፈርቶች ተስማሚ ነው።'}

የሚያመጣቸው ዋና ዋና ክህሎቶች፦
• ${skills[0] || 'ጠንካራ ቴክኒካል ክህሎቶች'}
• ${skills[1] || 'ችግር መፍታት ችሎታ'}
• ${skills[2] || 'የቡድን ስራ'}

ለዚህ የስራ እድል በተለይ ፍላጎት ያለኝ የ${experienceLevel} ልምዴን መጠቀም እና ለ${companyName} ስኬት አስተዋጽኦ ማድረግ ስለምችል ነው። ስለ ልምዴ እና ፍላጎቴ ለመወያየት እድል እንደሚሰጡኝ ተስፋ አደርጋለሁ።

ጥያቄዬን ስላጤኑልኝ አመሰግናለሁ። ምላሽዎን በጉጉት እጠብቃለሁ።

ከሰላምታ ጋር፣
${talentProfile.name}`;

    return {
      content,
      suggestions: [
        'የፕሮጀክት ምሳሌዎችን ያክሉ',
        'የስኬት ውጤቶችዎን ያስተዋውቁ',
        'የድርጅት ባህል ማጣቀሻ ያክሉ'
      ]
    };
  }
  
  const content = `Dear Hiring Manager,

I am writing to express my strong interest in the ${jobDetails.title} position at ${jobDetails.company}. With my background in ${talentProfile.experience} and expertise in ${talentProfile.skills.slice(0, 3).join(', ')}, I am confident I would be a valuable addition to your team.

${tone === 'friendly' ? 'I\'m excited about the opportunity to bring my passion and skills to your organization.' : 
  tone === 'confident' ? 'My proven track record and technical expertise make me an ideal candidate for this role.' : 
  'My professional experience aligns well with the requirements outlined in your job posting.'}

Key qualifications I bring include:
• ${talentProfile.skills[0] || 'Strong technical skills'}
• ${talentProfile.skills[1] || 'Problem-solving abilities'}
• ${talentProfile.skills[2] || 'Team collaboration'}

I am particularly drawn to this opportunity because it allows me to leverage my ${talentProfile.experience} experience while contributing to ${jobDetails.company}'s continued success. I would welcome the chance to discuss how my background and enthusiasm can benefit your team.

Thank you for considering my application. I look forward to hearing from you soon.

Best regards,
${talentProfile.name}`;

  return {
    content,
    suggestions: [
      'Consider adding specific project examples',
      'Mention relevant achievements or metrics',
      'Customize the closing based on company culture'
    ]
  };
};

export const generateProposal = async (request: GenerateContentRequest): Promise<GenerateContentResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const { talentProfile, jobDetails, language = 'english' } = request;
  
  if (language === 'amharic') {
    // Create proper Amharic content without mixing English
    const jobTitle = jobDetails.title === 'Frontend Developer' ? 'የፊት ገጽ ዲቨሎፐር' : 
                     jobDetails.title === 'Backend Developer' ? 'የኋላ ገጽ ዲቨሎፐር' : 
                     jobDetails.title === 'Full Stack Developer' ? 'ሙሉ ስታክ ዲቨሎፐር' : 
                     jobDetails.title === 'Graphic Designer' ? 'ግራፊክ ዲዛይነር' : 
                     jobDetails.title === 'test developer with postman' ? 'የሙከራ ዲቨሎፐር' :
                     'የሶፍትዌር ዲቨሎፐር';
    
    const companyName = jobDetails.company === 'undefined' ? 'ድርጅትዎ' : jobDetails.company;
    
    const skills = talentProfile.skills.map(skill => {
      if (skill === 'JavaScript') return 'ጃቫስክሪፕት';
      if (skill === 'React') return 'ሪአክት';
      if (skill === 'Node.js') return 'ኖድ.ጄኤስ';
      if (skill === 'Python') return 'ፓይቶን';
      if (skill === 'PHP') return 'ፒኤችፒ';
      if (skill === 'CSS') return 'ሲኤስኤስ';
      if (skill === 'HTML') return 'ኤችቲኤምኤል';
      if (skill === 'Photoshop' || skill === 'photo Shop') return 'ፎቶሾፕ';
      if (skill === 'Illustrator') return 'ኢሉስትሬተር';
      if (skill === 'Figma') return 'ፊግማ';
      if (skill === 'Adobe Photoshop') return 'አዶቤ ፎቶሾፕ';
      if (skill === 'Graphic Design') return 'ግራፊክ ዲዛይን';
      if (skill === 'UI/UX Design') return 'የተጠቃሚ ገጽታ ዲዛይን';
      return skill;
    });
    
    // Translate experience field properly
    const translateExperience = (exp: string) => {
      if (exp.includes('Graphic Designer')) {
        return 'ግራፊክ ዲዛይነር - የተለያዩ ድርጅቶች፣ ኢትዮጵያ (2023 - አሁን)';
      }
      if (exp === 'Entry-level') return 'መጀመሪያ ደረጃ';
      if (exp === 'Mid-level') return 'መካከለኛ ደረጃ';
      if (exp === 'Senior-level') return 'ከፍተኛ ደረጃ';
      if (exp.includes('Developer')) return 'የሶፍትዌር ዲቨሎፐር ልምድ';
      if (exp.includes('Designer')) return 'የዲዛይን ልምድ';
      return exp;
    };
    
    const experienceLevel = translateExperience(talentProfile.experience);
    
    const content = `የፕሮጀክት ሀሳብ፦ ${jobTitle}

የተከበሩ የ${companyName} ቡድን፣

የዚህን ${jobTitle} ፕሮጀክት መስፈርቶችን በጥንቃቄ ሰምርሜ እና ዝርዝር መፍትሄ ለማቅረብ ዝግጁ ነኝ።

## የፕሮጀክቱን መረዳት
በፕሮጀክቱ መስፈርት መሰረት አስፈላጊ ውጤቶችን መስጠት እንደሚፈልጉ ተረድቻለሁ። የእኔ ${experienceLevel} ልምድ በ${skills.slice(0, 2).join(' እና ')} ለዚህ ፕሮጀክት ተስማሚ ያደርገኛል።

## የሚቀርበው አቀራረብ
1. **መጀመሪያ ትንተና** - የፕሮጀክት መስፈርቶችን እና ዓላማዎችን ዝርዝር መመርመር
2. **የእቅድ ደረጃ** - የፕሮጀክት የጊዜ ሰሌዳ እና የመገለጫ ክፍሎች እቅድ
3. **አስፈጻሚ** - በጥሩ አሰራር መመሪያዎች መጠቀም
4. **የጥራት አረጋገጥ** - ጥብቅ የመመርመር እና የመገምገም ሂደቶች
5. **መስጠት** - የመጨረሻ ውጤቶች በሰነድ መስጠት

## ለምን እኔን ይመርጡ
• **እውቀት** - በ${skills[0] || 'ተዛማጅ ቴክኖሎጂዎች'} የተመለከተ
• **ልምድ** - ${experienceLevel} ደረጃ ሙያተኛ
• **የጥራት ትኩረት** - ልዩ ውጤቶችን ለማስጠት ቁርጠኛ
• **መገናኛ** - መደበኛ ዝማኔዎች እና ግልጽ የፕሮጀክት መገለጫ ሪፖርት

## የጊዜ ሰሌዳ እና የሚሰጡ ውጤቶች
ፕሮጀክቱ በተዋቀረ አቀራረብ በግልጽ የመገለጫ ክፍሎች እና መደበኛ መገናኛዎች ይሰራል። ፕሮጀክቱ በጥንቃቄ በመስፈርቶችዎ መሰረት ይጠናል።

## የሚቀጥሉት እርምጃዎች
የዚህን ሀሳብ በዝርዝር ለመወያየት እና የሚኖሩትን ጥያቄዎች መልስ ለመስጠት እድሉን እወዳለሁ። ክህሎቶቼ እና ቁርጠኝነቴ ለፕሮጀክትዎ ስኬት እንደሚያስተዋጽኡ እርግጠኛ ነኝ።

ከእርስዎ ጋር ለመስራት እጠባበቃለሁ።

ከሰላምታ ጋር፣
${talentProfile.name}
${talentProfile.location}`;

    return {
      content,
      suggestions: [
        'የጊዜ ሰሌዳ ግምት አካትት',
        'የፖርትፎሊዮ ምሳሌዎችን አካትት',
        'የመገናኛ ምርጫዎችዎን አስተዋውቅ'
      ]
    };
  }
  
  const content = `Project Proposal: ${jobDetails.title}

Dear ${jobDetails.company} Team,

Thank you for considering me for your ${jobDetails.title} project. I have carefully reviewed your requirements and am excited to propose a comprehensive solution.

## Understanding Your Needs
Based on your project description, I understand you need ${jobDetails.requirements || 'a skilled professional to deliver quality results'}. My ${talentProfile.experience} experience in ${talentProfile.skills.slice(0, 2).join(' and ')} makes me well-suited for this project.

## Proposed Approach
1. **Initial Analysis**: Thorough review of project requirements and objectives
2. **Planning Phase**: Detailed project timeline and milestone planning
3. **Implementation**: Systematic execution using best practices
4. **Quality Assurance**: Rigorous testing and review processes
5. **Delivery**: Final deliverables with documentation

## Why Choose Me
• **Expertise**: Specialized in ${talentProfile.skills[0] || 'relevant technologies'}
• **Experience**: ${talentProfile.experience} level professional
• **Quality Focus**: Committed to delivering exceptional results
• **Communication**: Regular updates and transparent progress reporting

## Timeline & Deliverables
I propose a structured approach with clear milestones and regular check-ins. The project will be completed with attention to detail and adherence to your specifications.

## Next Steps
I would appreciate the opportunity to discuss this proposal in detail and answer any questions you may have. I'm confident that my skills and dedication will contribute to the success of your project.

Looking forward to working with you.

Best regards,
${talentProfile.name}
${talentProfile.location}`;

  return {
    content,
    suggestions: [
      'Add specific timeline estimates',
      'Include relevant portfolio examples',
      'Mention your availability and communication preferences'
    ]
  };
};

export const improveContent = async (
  originalContent: string, 
  improvementType: 'tone' | 'length' | 'clarity' | 'impact',
  targetTone?: string
): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple improvements based on type
  let improvedContent = originalContent;
  
  switch (improvementType) {
    case 'tone':
      if (targetTone === 'friendly') {
        improvedContent = originalContent.replace(/I am writing/g, "I'm excited to write");
        improvedContent = improvedContent.replace(/Thank you for considering/g, "I really appreciate you considering");
      } else if (targetTone === 'confident') {
        improvedContent = originalContent.replace(/I would be/g, "I will be");
        improvedContent = improvedContent.replace(/I believe/g, "I know");
      }
      break;
      
    case 'length':
      // Make it more concise by removing some filler words
      improvedContent = originalContent.replace(/very /g, '');
      improvedContent = improvedContent.replace(/really /g, '');
      break;
      
    case 'clarity':
      // Add bullet points and better structure
      improvedContent = originalContent.replace(/Key qualifications I bring include:/g, 
        "Key qualifications I bring include:\n\n");
      break;
      
    case 'impact':
      // Add more action words
      improvedContent = originalContent.replace(/I have experience/g, "I excel at");
      improvedContent = improvedContent.replace(/I can help/g, "I will drive results by");
      break;
  }
  
  return improvedContent;
};