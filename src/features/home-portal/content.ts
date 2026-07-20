import type { Locale } from '../../config/locales';

export type TimelineEntry = {
  period: string;
  title: string;
  story: string;
  meaning: string;
  tags: string[];
};

export type HomePortalCopy = {
  pastKicker: string;
  pastTitle: string;
  pastHint: string;
  futureKicker: string;
  futureTitle: string;
  futureHint: string;
  enter: string;
  close: string;
  meaning: string;
  pastLead: string;
  futureLead: string;
  role: string;
  roleSub: string;
  location: string;
  locationNote: string;
  work: string;
  pay: string;
  payNote: string;
  available: string;
  availableNote: string;
  travel: string;
  travelNote: string;
  email: string;
  emailNote: string;
  dossier: string;
  dossierNote: string;
  innerKicker: string;
  quote: string[];
  reflection: string;
  push: string;
  projects: string;
  writing: string;
  about: string;
  continueLabel: string;
  reducedArchivesLabel: string;
};

const timelineByLocale: Record<Locale, TimelineEntry[]> = {
  zh: [
    { period: '1991—2009 / 0—18岁', title: '局外人', story: '父母常年在外，寄居亲戚家，在贵族中学成绩垫底。心里装着班里最安静的那个女生，却从不敢开口；天生的疏离感使他无法融入任何圈子。', meaning: '长期处于群体边缘，让我学会独立观察环境，也更早注意到那些没有被说出口的情绪。', tags: ['独立观察', '情绪感知', '环境适应'] },
    { period: '2009 / 18岁', title: '离开熟悉的世界', story: '因特殊血统被海外神秘学院特招。在心上人被同学横刀夺爱的同一天，跟着一位穿深红色裙子的学姐登上飞往陌生国度的航班。', meaning: '变化不会等人准备好。面对突如其来的机会，我第一次离开熟悉的环境，在未知中重新建立自己的位置。', tags: ['快速适应', '跨环境协作', '接受未知'] },
    { period: '2009—2011 / 18—20岁', title: '力量的代价', story: '与体内自称“弟弟”的神秘存在签订契约。每动用一次力量就折损四分之一寿命，先后猎杀多位古王，代价是越来越不像“人”。', meaning: '能力从来不是免费的。解决高风险问题时，必须理解力量的边界、判断代价，并为决定承担后果。', tags: ['风险判断', '极端执行', '代价意识'] },
    { period: '2011—2012 / 20—21岁', title: '为被遗忘的人出发', story: '被推举为学生领袖。为找回一位被全世界遗忘的师兄，独自走向北欧神话中的神明，用残存的生命换取那一战的可能性。', meaning: '领导不是站在所有人前面发号施令，而是在其他人已经放弃时，仍愿意为一个可能性承担责任。', tags: ['责任承担', '团队领导', '危机决策'] },
    { period: '2012及以后', title: '主动走向真相', story: '在失去生命中最重要的女孩之后，终于不再逃避，主动奔赴极北之地的遗址寻找出身真相，完成从被动到主动的最后一跃。', meaning: '成长不是终于拥有所有答案，而是不再等待别人告诉自己该去哪里，开始主动接近问题和真相。', tags: ['主动选择', '长期行动', '自我驱动'] },
  ],
  en: [
    { period: '1991—2009 / AGE 0—18', title: 'The Outsider', story: 'With his parents always away, he lived with relatives, ranked last at an elite school, and never spoke to the quiet girl he cared about. A natural distance kept him outside every circle.', meaning: 'Life at the edge taught me to observe independently and notice what people leave unsaid.', tags: ['Observation', 'Empathy', 'Adaptation'] },
    { period: '2009 / AGE 18', title: 'Leaving the Known World', story: 'Recruited by a mysterious overseas academy for an unusual bloodline, he boarded a flight into the unknown with a senior in a crimson dress.', meaning: 'Change rarely waits for readiness. I learned to leave familiar ground and rebuild my place inside uncertainty.', tags: ['Adaptation', 'Collaboration', 'Uncertainty'] },
    { period: '2009—2011 / AGE 18—20', title: 'The Cost of Power', story: 'He made a pact with an entity calling itself his younger brother. Each use of its power cost a quarter of his life; every victory made him a little less human.', meaning: 'Capability is never free. High-risk work requires boundaries, trade-offs, and ownership of consequences.', tags: ['Risk judgment', 'Execution', 'Trade-offs'] },
    { period: '2011—2012 / AGE 20—21', title: 'For the Forgotten', story: 'Chosen as a student leader, he walked alone toward a god of northern myth to recover a senior the entire world had forgotten.', meaning: 'Leadership begins when everyone else has stopped believing and someone still accepts responsibility for a possibility.', tags: ['Ownership', 'Leadership', 'Crisis decisions'] },
    { period: '2012 AND AFTER', title: 'Walking Toward the Truth', story: 'After losing the most important girl in his life, he stopped running and headed north to uncover the truth of his origin.', meaning: 'Growth is not having every answer. It is choosing to move toward the question without waiting for permission.', tags: ['Agency', 'Long-term action', 'Self-direction'] },
  ],
};

const copyByLocale: Record<Locale, HomePortalCopy> = {
  zh: {
    pastKicker: 'PERSONAL ARCHIVE / 01', pastTitle: '成长档案', pastHint: '点击进入人格档案',
    futureKicker: 'NEXT MISSION / 02', futureTitle: '求职规划', futureHint: '点击查看职业方向',
    enter: '推门而入', close: '返回双门入口', meaning: '现实映射',
    pastLead: '从一个无法融入人群的少年，到主动走向世界尽头的人。',
    futureLead: '我正在寻找的不是一个安全的位置，而是一件值得亲自抵达现场的事。',
    role: '特殊行动专员', roleSub: '卡塞尔学院执行部外勤编制', location: '卡塞尔 / 全球外勤', locationNote: '驻地服从任务调配', work: '全职', pay: '税前 8–15K / 月 + 任务津贴', payNote: '以任务结算，具体根据行动等级与风险系数面议。这份工作不是冲着钱去的。', available: '随时', availableNote: '但有些旧账要先清一清。', travel: '接受全球外勤', travelNote: '经常一出差，就是直接飞往战场。', email: 'lumingfei@cassel.edu', emailNote: '学院的，但不常看。', dossier: '档案尚未寻回', dossierNote: '我的过去写在别人的档案里，等我自己翻到了再补。',
    innerKicker: 'THE CHOICE IS MINE', quote: ['来杯好茶摇一摇'], reflection: '摇一摇', push: '我不再等别人把门打开。我自己推。', projects: '进入项目归档', writing: '阅读行动记录', about: '查看现实档案', continueLabel: '继续浏览', reducedArchivesLabel: '打开人物档案',
  },
  en: {
    pastKicker: 'PERSONAL ARCHIVE / 01', pastTitle: 'Growth Archive', pastHint: 'Open the personal archive',
    futureKicker: 'NEXT MISSION / 02', futureTitle: 'Career Plan', futureHint: 'View professional direction',
    enter: 'Enter Now', close: 'Return to the two doors', meaning: 'Real-world meaning',
    pastLead: 'From a boy who belonged nowhere to someone willing to walk toward the end of the world.',
    futureLead: 'I am not looking for a safe position, but for work worth reaching in person.',
    role: 'Special Operations Officer', roleSub: 'Cassell College Executive Department — Field Unit', location: 'Cassell / Global deployment', locationNote: 'Deployment assigned by mission', work: 'Full time', pay: '8–15K / month + mission allowance', payNote: 'Settled by mission level and risk coefficient. This was never only about the money.', available: 'Immediately', availableNote: 'There are only a few old debts to settle first.', travel: 'Global field deployment', travelNote: 'A business trip often means flying directly into a battlefield.', email: 'lumingfei@cassel.edu', emailNote: 'Academy-issued. Rarely checked.', dossier: 'Dossier not recovered', dossierNote: 'My past is written in other people’s files. I will add it when I find it myself.',
    innerKicker: 'THE CHOICE IS MINE', quote: ['My whole life has been', 'learning that when there is no choice,', 'I can still make one.'], reflection: 'I used to believe I was only being pushed—left behind by my parents, selected by the academy, forced to kneel by fate. Later I found that every dead end leaves a narrow opening.', push: 'I no longer wait for someone else to open the door. I push it myself.', projects: 'Enter project archive', writing: 'Read mission logs', about: 'View real-world profile', continueLabel: 'Continue browsing', reducedArchivesLabel: 'Open personal archives',
  },
};

export function getHomePortalContent(lang: Locale) {
  return {
    copy: copyByLocale[lang],
    timeline: timelineByLocale[lang],
  };
}
