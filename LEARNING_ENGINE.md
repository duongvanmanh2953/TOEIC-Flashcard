# Spaced Repetition & Learning Science Engine

LexiMind AI replaces static intervals (Day 1 $\rightarrow$ Day 2 $\rightarrow$ Day 4) with an **Adaptive Spaced Repetition Engine** inspired by FSRS (Free Spaced Repetition Scheduler) and SuperMemo SM-2+ principles.

---

## 1. Memory State Variables

Each vocabulary word tracked for a user maintains three mathematical variables:

1. **Stability ($S$)**: Time interval in days before the probability of recall drops below 90%.
2. **Retrievability ($R$)**: The estimated current probability of successfully retrieving the word:
   $$R = e^{-\frac{\Delta t}{S}}$$
   where $\Delta t$ is the time elapsed since the last review.
3. **Difficulty ($D$)**: Inherent complexity of the word for the specific learner on a scale of $1.0$ to $10.0$.

---

## 2. Multi-Signal Evaluation

When an answer is submitted, the engine evaluates:
- **Accuracy**: Was the answer correct?
- **Response Latency**:
  - $< 2,500$ ms: Fluent, automated recall $\rightarrow$ Stability multiplier bonus.
  - $> 6,000$ ms: Hesitant recall $\rightarrow$ Minimal stability growth.
- **Confidence Rating**: User rating from $1$ (Guessing) to $5$ (Absolute certainty).
- **Hint Usage**: Deducts 25% from performance quality and caps stability growth to force earlier reinforcement.

---

## 3. Session Composition Engine

A smart study session is dynamically assembled according to pedagogical distribution:
- **40% Due Words**: Words with $R < 0.9$ or $nextReviewAt \le \text{NOW}()$.
- **30% Weak Words**: Words with $Mastery < 50\%$ or marked as hard.
- **20% New Words**: High-frequency words matching the learner's CEFR level.
- **10% Reinforcement**: Previously mastered words to prevent long-term decay.

---

## 4. Mastery Classification (0 - 100)

| Range | Status | Pedagogical Meaning |
| :--- | :--- | :--- |
| **0 – 20** | `NEW` | Word introduced, initial encoding |
| **21 – 40** | `LEARNING` | Active recall in early stages |
| **41 – 60** | `FAMILIAR` | Consistent recall with cues |
| **61 – 80** | `REVIEW` | Established memory, spaced review |
| **81 – 94** | `STRONG` | High stability, automated recall |
| **95 – 100** | `MASTERED` | Permanent retention with varied contexts |
