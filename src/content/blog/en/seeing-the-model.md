---
title: Seeing What the Model Is Thinking
description: From progress bars to explainable spaces, redesigning the wait between people and generative systems.
pubDate: 2026-06-12
tags: [AI, Interaction]
lang: en
translationKey: seeing-the-model
featured: true
---

Generative systems have brought waiting back into interface design. This is not a wait that can be estimated precisely. It is a period shaped by inference, revision, and uncertainty.

## The progress bar has expired

Progress bars assume a task can be divided and its remaining time estimated. Generation does not entirely fit that premise. A steadily advancing number disguises uncertainty with a false promise.

Instead of showing “how much is left,” an interface can reveal **which level of the problem the system is handling**. State can be organized at three scales: intent, material, and composition.

```ts
type GenerativeState = {
  intent: 'reading' | 'planning' | 'revising';
  confidence: number;
  canInterrupt: boolean;
};
```

## From state to space

When states have spatial relationships, change becomes legible without a verbose log. Convergence can look like gathering, branching can reveal candidate paths, and a slow pulse can indicate work that needs no intervention.

## Preserve the right to interrupt

Every generative process should allow people to pause, redirect, and return. Explainability is not only a record of what happened; it also makes available actions clear.

A good waiting interface does not pretend to be certain. It turns uncertainty into material that can be sensed and handled.
