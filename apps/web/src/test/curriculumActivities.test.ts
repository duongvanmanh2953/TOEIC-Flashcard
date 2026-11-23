import { describe, expect, it } from 'vitest';
import { getCurriculumQuestions, matchesCurriculumAnswer, MULTILINGUAL_CURRICULA } from '@vocabflow/shared';
import {
  getCurriculumQuestions as getApiQuestions,
  MULTILINGUAL_CURRICULA as apiCurriculum,
} from '../../../api/src/modules/learning-journey/curriculum-data';

describe('Curriculum activity grading', () => {
  it('normalizes whitespace and Unicode while distinguishing wrong answers', () => {
    expect(matchesCurriculumAnswer('   mon cafe\u0301 ', 'Mon café')).toBe(true);
    expect(matchesCurriculumAnswer('misaligned', 'aligned')).toBe(false);
    expect(matchesCurriculumAnswer(undefined, 'aligned')).toBe(false);
  });

  it('uses real questions and stable answer keys, including freetext activities', () => {
    const lesson = MULTILINGUAL_CURRICULA.ko[0].chapters[0].lessons[0];
    const questions = lesson.activities.flatMap(getCurriculumQuestions);
    expect(questions).toEqual(apiCurriculum.ko[0].chapters[0].lessons[0].activities.flatMap(getApiQuestions));
    expect(questions).toContainEqual(expect.objectContaining({ prompt: expect.stringContaining('Nước uống'), answer: '물' }));
    expect(questions.some((question) => !question.options)).toBe(true);
    expect(new Set(questions.map(({ key }) => key)).size).toBe(questions.length);
  });
});
