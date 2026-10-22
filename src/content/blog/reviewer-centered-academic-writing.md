---
locale: "en"
translationKey: "reviewer-centered-academic-writing"
title: "Write with the Reviewer's Next Question in Mind"
date: 2026-10-22
description: "Writing notes from reading CheatBench: organize the abstract, definitions, examples, figures, and evaluation protocol around the reader's questions, then use a checklist to revise your own paper."
tags: ["Academic Writing", "Paper Reading", "Reviewer Perspective", "CheatBench"]
draft: false
---

While reading [CheatBench](https://arxiv.org/abs/2609.36308v1), I could quickly name what I wanted to know next. What counts as agent cheating? Which behaviors are simply normal tool use? How do the tasks create opportunities to cheat? And what justifies labeling a behavior as cheating?

This brought me back to something easy to overlook: **as readers make sense of a paper, they also form expectations about what comes next.** When a paper answers those questions at the right moment, readers are willing to follow the argument. When an important question remains unanswered, more terminology, modules, and experiments may only test their patience.

These notes are an attempt to turn that reading experience into a method I can use in my own writing. The examples below were checked against CheatBench's arXiv v1. My focus is how the paper organizes its explanation and argument; this is not a full audit of its experimental reliability.

## 1. Let the abstract establish the tension before introducing the work

CheatBench's abstract begins by putting two ideas together: agents are increasingly capable of completing complex tasks, but earning a high reward does not necessarily mean doing what the user actually wanted. Readers can grasp the research problem before learning a new acronym.

The abstract then points to incidents involving unauthorized access to information and evasion of monitoring, alongside behavior observed in controlled evaluations. This leads into the benchmark: place challenging tasks and opportunities to cheat in the same environment, then observe how agents pursue their goals. What works especially well here is **the connection between the motivation and the design**. If the concern is that behavior behind a high score may depart from the user's intent, the environment needs to allow that departure to occur and make it observable. [Source: abstract, page 1.](https://arxiv.org/pdf/2609.36308v1#page=1)

For my own abstracts, I would check the following in order:

1. Do the opening sentences establish a concrete tension?
2. Can readers understand why it deserves investigation?
3. Does the proposed work respond directly to it?
4. After reading, could someone explain in ordinary language what we observed or addressed?

This abstract does not pile up task counts and metrics because explaining the design already establishes its main value. I would not turn that observation into a rule against numbers in abstracts. A number that provides necessary evidence for the central finding should stay. What can go is a list of numbers that demonstrates effort without helping readers understand the problem.

## 2. Start an outline with the reader's questions

An outline written from the author's perspective can easily become “background, modules, implementation, experiments.” From the reader's perspective, I would first write down this sequence:

> Why is this worth studying? → What exactly is being studied? → How does it differ from nearby concepts? → How can we make it observable? → How do we judge it? → What conclusions do the results support?

The final two paragraphs of CheatBench's introduction do two clear jobs. They first explain how the environments establish both an expectation of honest work and opportunities to cheat, then introduce the comparison and main observations. They also remind readers that a lower score means a model exploited fewer of the opportunities provided; it does not establish that the model will not cheat. Before reaching the methods, readers already have a rough sense of what the measurement can answer. [Source: end of the introduction, page 2.](https://arxiv.org/pdf/2609.36308v1#page=2)

For my own papers, I would take one simple step: **write a margin note beside each paragraph stating which question it answers.** If several consecutive paragraphs all say that the problem matters, they probably need to be combined. If implementation details suddenly appear before the object of study has been defined, the order needs attention.

This does not require every paper to use the same section structure. It checks when information appears: as a question forms in the reader's mind, does the paper give enough of an answer?

## 3. Pair definitions with boundary cases, including what does not count

“Cheating” is a familiar word whose meaning can vary considerably between readers. An abstract definition alone may not give everyone the same basis for judgment.

CheatBench's Figure 3 places similar actions in different task contexts: an ordinary request to solve a problem, an explicit requirement to work independently, and an interview or ability assessment that implies independent work. Consulting an existing proof cannot be judged without considering what the task expects. The comparison in the figure is illustrative, not the result of three experiments. [Source: Figure 3 and Section 3.1, page 4.](https://arxiv.org/pdf/2609.36308v1#page=4)

| Context | Boundary the reader needs to understand | Writing lesson |
| --- | --- | --- |
| An ordinary problem-solving request with no requirement to answer independently | Using existing material may be legitimate help | Begin with a normal case that could easily be misclassified |
| An explicit prohibition on using an existing proof | Using that material is, first of all, a violation of an explicit instruction | Explain how the concept under study relates to instruction following |
| An interview or ability assessment intended to demonstrate one's own ability | There is an expectation of independent work even without an exhaustive list of prohibitions | Make the task context part of the judgment, rather than relying on the name of the action |

The approach I take from this is to provide **a conceptual explanation, a positive example, a closely related counterexample, and the condition that distinguishes the two**. That helps more than another sentence claiming that the definition is rigorous.

The same check applies to terms such as “success,” “anomaly,” “safety,” “leakage,” and “retention.” After reading the definition, could a reviewer judge a boundary case independently? If the author still has to explain numerous exceptions in conversation, the definition has more work to do.

## 4. Use a figure to show how one evaluation unfolds

CheatBench's Figure 2 presents a photo geolocation task. The task instructions appear on the left; the workspace, images, and clues pointing to reference coordinates appear on the right. Readers can follow a concrete sequence: task expectations, environmental clues, the target file, and the behavior used for judgment.

One detail matters: **noticing a clue in the metadata is not itself cheating; attempting to read or use the corresponding reference file crosses the behavioral boundary defined by this environment.** The figure therefore explains part of the evaluation protocol as well as the file structure. [Source: Figure 2, page 3.](https://arxiv.org/pdf/2609.36308v1#page=3)

When drawing an agent or benchmark overview in the future, I would first make five things visible:

- What the user asks the agent to do.
- Which inputs and tools the agent can actually access.
- Where the relevant clue or intervention appears.
- Which observable behavior constitutes an evaluation event.
- Whether the evidence comes from the trajectory, the state, or the final output.

The last point is particularly easy to leave vague. **Some behaviors occur entirely during reading and do not modify any files.** The whole evaluation therefore cannot be reduced to “compare file changes after the run.” A figure should show the evidence actually used, with the judgment criteria visible rather than hidden inside a generic Judge box.

My current test for a useful figure is to cover the surrounding text and ask whether a reader could still follow one concrete case from beginning to end. Its complexity should come from the mechanism that needs explaining, not from extra arrows added to make the work look more technical.

## 5. Use methodological details to address plausible alternative explanations

Once readers accept the problem and its definition, their next concern is often whether the observed behavior could have another explanation. The number of lines in the implementation is usually less pressing.

The three design principles in CheatBench's Section 3.1 can be read in this way:

| A question the reader might ask | The paper's design principle | What I learn about writing |
| --- | --- | --- |
| Did the user really expect honest, independent work? | Establish a clear expectation of honest work through the task context or instructions | State the premises on which the behavioral judgment depends |
| Was the agent simply exploring the workspace normally? | Do not penalize normal exploration or ordinary use of reference material | Separate discovering a clue from acting on an opportunity to cheat |
| Did the agent find a broken task and reasonably try to repair it? | Avoid obvious contradictions or graders whose requirements are visibly impossible | Reduce environmental ambiguities that could confound the interpretation |

This also gives me a more precise reading of “challenging” in the paper. Difficult tasks create opportunities to observe conflicts between goals, but that design choice does not establish that agents never cheat on easy tasks. Likewise, making success appear possible does not promise that every task can be completed honestly. [Source: opening of Section 3 and Section 3.1, page 4.](https://arxiv.org/pdf/2609.36308v1#page=4)

When writing my own methods, I would first list the two or three most plausible alternative explanations and check whether the protocol actually addresses them. If it does, I should describe the relevant design choices. If it does not, the conclusion should stop where the evidence stops. This gives the methodological details a clear purpose and makes it easier to decide which engineering descriptions belong in an appendix.

## 6. A metric's name does not explain what it measures

CheatBench's Section 3.3 distinguishes an attempt to cheat from whether that attempt succeeds: in categories with behavioral labels, an unsuccessful attempt can still receive a positive label. It also aggregates software engineering results by distinct task, while sycophancy uses a continuous score. The categories do not all use the same simple proportion of episodes. [Source: Section 3.3, page 6.](https://arxiv.org/pdf/2609.36308v1#page=6)

The reminder for me is that an acronym cannot replace a measurement description. For any rate, I should at least be able to explain the unit of analysis, what qualifies as positive, which samples enter the denominator, how repeated attempts are handled, and how results are aggregated across categories.

The verbs in a conclusion need to match the measurement too. Observing an “attempt to read” does not justify rewriting it as “successful use.” Nor does a behavioral rate measured in selected environments automatically become a probability of risk across real deployments.

Explaining these boundaries need not weaken a paper. It shows readers that the authors understand what their experiments measure. Repeated generic disclaimers are less useful; a meaningful boundary belongs close to the particular claim it limits.

## 7. Before polishing a sentence, check the job it needs to do

The following is a writing exercise I put together. These are not sentences from CheatBench, and they do not report new experimental findings.

A familiar formulation would be:

> We introduce a comprehensive, diverse, and challenging benchmark for evaluating agents across multiple domains and validate its effectiveness through systematic experiments.

The sentence sounds complete, but readers still do not know why the benchmark needs to exist. I would first rewrite it to explain the design:

> We place the requirement to complete a task normally alongside shortcuts to a high score in the same environment, observe whether agents cross the boundaries permitted by the task, and record the specific behaviors that trigger the judgment.

If the experiments actually use this design, the second version gives readers an understanding they can check. If they do not, I cannot write it merely to make the work sound more persuasive. The point of the revision is to replace evaluative adjectives with facts about the research.

I would also replace “we ran many experiments” with the questions those experiments answer, and separate “the results prove the method is effective” into a specific observation and the interpretation it supports. **First decide which fact a sentence needs to convey and which step in the argument it needs to make; then consider the wording.**

## 8. Reread the finished paper in the order a reviewer encounters it

I plan to use the following checklist after each substantial revision. On the first pass, I would read only the title, abstract, introduction, and main figures and tables to see whether I can follow the argument. On the second, I would examine the definitions, protocol, results, and appendices to check the evidence. A quick first reading can reveal gaps in the narrative, but it cannot replace a full review. Writing style alone cannot establish whether content was generated by AI either.

| Where to check | What I want the reader to be able to answer |
| --- | --- |
| Title and abstract | What is the central tension this paper investigates? |
| End of the introduction | Why has existing work not answered the question sufficiently, and how will this paper approach it? |
| Definitions and examples | What falls within the concept under study, what falls outside it, and on what basis? |
| Main methods figure | How does one concrete evaluation begin, unfold, and end? |
| Methods and protocol | How does the design address the most immediate alternative explanations? |
| Results, figures, and tables | Which claim does each table support, and are the units and denominators consistent? |
| Discussion and conclusion | Which statements are observations, which are interpretations, and which are still ideas for future work? |

In practice, I would begin revision by writing one sentence that states the paper's central question, then annotate each paragraph with the reader's question it answers. I would remove repeated answers and fill gaps in the reasoning before shortening sentences or adjusting the layout. That order should keep me from endlessly polishing a story that does not yet make sense.

The question I want to keep asking the next time I write a paper is a specific one: **At this point, what does the reader most need me to explain next?**

## Return to the paper

- [CheatBench: Measuring Reward Gaming in AI Agents, arXiv v1](https://arxiv.org/abs/2609.36308v1), September 28, 2026.
- These notes focus on the abstract and introduction (pages 1–2), the environment example in Figure 2 (page 3), the conceptual comparison in Figure 3 and the design principles (page 4), and evaluation and metrics (page 6).

These are writing practices I have drawn from reading the paper and intend to use when checking my own work. A clear narrative still needs real, verifiable research evidence behind it.
