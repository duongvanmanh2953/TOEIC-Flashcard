const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting DB fix...');
  
  // Fix Vocabulary
  const vocabs = await prisma.vocabulary.findMany();
  let jaCount = 0;
  let koCount = 0;
  let enCount = 0;
  
  for (const v of vocabs) {
    const word = v.word;
    let lang = 'en';
    
    // Check for Japanese characters (Hiragana, Katakana, CJK)
    if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(word)) {
      lang = 'ja';
      jaCount++;
    } 
    // Check for Korean characters (Hangul)
    else if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(word)) {
      lang = 'ko';
      koCount++;
    }
    else {
      enCount++;
    }
    
    if (v.languageId !== lang) {
      await prisma.vocabulary.update({
        where: { id: v.id },
        data: { languageId: lang }
      });
    }
  }
  
  console.log(`Updated Vocabs: JP=${jaCount}, KR=${koCount}, EN=${enCount}`);
  
  // Fix CommunityDeck
  const decks = await prisma.communityDeck.findMany({
    include: {
      words: {
        include: { vocabulary: true }
      }
    }
  });
  
  let dCount = 0;
  for (const deck of decks) {
    if (deck.words.length > 0) {
      const firstWordLang = deck.words[0].vocabulary.languageId;
      if (firstWordLang && deck.languageId !== firstWordLang) {
        await prisma.communityDeck.update({
          where: { id: deck.id },
          data: { languageId: firstWordLang }
        });
        dCount++;
      }
    }
  }
  console.log(`Updated Decks: ${dCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
