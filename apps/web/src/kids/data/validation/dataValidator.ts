/**
 * dataValidator.ts
 * Automatic Validation Engine for Kids Question System, Vocabulary, Phrases, and Games
 * Catches missing Vietnamese translations, mismatched correct answers, duplicate IDs,
 * and faulty configs before any item is rendered to the child.
 */

import { KidQuestion } from '../questions/questionsData';
import { VocabularyItem } from '../vocabulary/vocabularyData';
import { KidPhrase } from '../phrases/phrasesData';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate single question thoroughly
 */
export function validateQuestion(q: KidQuestion): ValidationResult {
  const errors: string[] = [];

  if (!q.id || typeof q.id !== 'string') {
    errors.push('Question is missing a valid id.');
  }

  if (!q.question || !q.question.trim()) {
    errors.push(`Question [${q.id || 'unknown'}] is missing English text.`);
  }

  if (!q.questionVi || !q.questionVi.trim()) {
    errors.push(`Question [${q.id || 'unknown'}] is missing Vietnamese translation (questionVi).`);
  }

  if (!Array.isArray(q.answers) || q.answers.length < 2) {
    errors.push(`Question [${q.id || 'unknown'}] must have at least 2 answer options.`);
  } else {
    let correctCount = 0;
    q.answers.forEach((ans, idx) => {
      if (!ans.id) errors.push(`Answer option #${idx + 1} is missing an id in question [${q.id}].`);
      if (!ans.text || !ans.text.trim()) errors.push(`Answer [${ans.id}] is missing English text in question [${q.id}].`);
      if (!ans.textVi || !ans.textVi.trim()) errors.push(`Answer [${ans.id}] is missing Vietnamese text (textVi) in question [${q.id}].`);
      if (ans.correct) correctCount++;
    });

    if (correctCount === 0) {
      errors.push(`Question [${q.id}] has NO correct answer!`);
    } else if (correctCount > 1) {
      errors.push(`Question [${q.id}] has multiple correct answers (${correctCount}), expected exactly 1.`);
    }

    if (q.correctAnswerId) {
      const matching = q.answers.find((a) => a.id === q.correctAnswerId);
      if (!matching) {
        errors.push(`Question [${q.id}] correctAnswerId "${q.correctAnswerId}" does not exist in answers.`);
      } else if (!matching.correct) {
        errors.push(`Question [${q.id}] correctAnswerId "${q.correctAnswerId}" is not marked correct=true.`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate array of questions and return only safe, certified valid questions
 */
export function validateAndFilterQuestions(questions: KidQuestion[]): KidQuestion[] {
  const validQuestions: KidQuestion[] = [];
  const seenIds = new Set<string>();

  questions.forEach((q) => {
    if (seenIds.has(q.id)) {
      console.warn(`[DATA VALIDATOR] Duplicate question ID detected: "${q.id}". Skipping duplicate.`);
      return;
    }
    seenIds.add(q.id);

    const res = validateQuestion(q);
    if (res.isValid) {
      validQuestions.push(q);
    } else {
      console.warn(`[DATA VALIDATOR] Question "${q.id}" failed validation and will NOT be rendered:`, res.errors);
    }
  });

  return validQuestions;
}

/**
 * Validate vocabulary item
 */
export function validateVocabularyItem(item: VocabularyItem): ValidationResult {
  const errors: string[] = [];
  if (!item.id) errors.push('Vocabulary item missing id');
  if (!item.word || !item.word.trim()) errors.push(`Vocab [${item.id}] missing word`);
  if (!item.viMeaning || !item.viMeaning.trim()) errors.push(`Vocab [${item.id}] missing Vietnamese meaning`);
  if (!item.sentence || !item.sentence.trim()) errors.push(`Vocab [${item.id}] missing example sentence`);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate phrase item
 */
export function validatePhraseItem(phrase: KidPhrase): ValidationResult {
  const errors: string[] = [];
  if (!phrase.id) errors.push('Phrase missing id');
  if (!phrase.english || !phrase.english.trim()) errors.push(`Phrase [${phrase.id}] missing English text`);
  if (!phrase.vietnamese || !phrase.vietnamese.trim()) errors.push(`Phrase [${phrase.id}] missing Vietnamese translation`);

  return {
    isValid: errors.length === 0,
    errors,
  };
}
