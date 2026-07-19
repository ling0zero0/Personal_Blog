export type Locale = 'zh' | 'en';

export const locales: Locale[] = ['zh', 'en'];

export const ui = {
  zh: {
    skip: '跳到正文', nav: ['首页', '项目', '文章', '关于'], navPaths: ['', 'projects', 'journal', 'about'],
    command: 'AI 导航', soundOn: '关闭环境声', soundOff: '开启环境声', menu: '打开菜单', close: '关闭',
    footer: '以代码、文字与实验构建。', status: '可参与新项目', locale: 'EN',
  },
  en: {
    skip: 'Skip to content', nav: ['Home', 'Projects', 'Journal', 'About'], navPaths: ['', 'projects', 'journal', 'about'],
    command: 'AI navigator', soundOn: 'Mute ambience', soundOff: 'Enable ambience', menu: 'Open menu', close: 'Close',
    footer: 'Built through code, words, and experiments.', status: 'Available for selected work', locale: '中',
  },
} as const;

export const profile = {
  zh: {
    name: '沈野', role: '创意开发者 / AI 产品设计师', statement: '在代码、叙事与机器智能的交界处，构建有感知的数字体验。',
    intro: '我关注复杂技术如何变得可见、可用，也值得被记住。工作横跨生成式界面、实时图形与智能产品原型。',
    location: '上海 / 远程', email: 'hello@shenye.space',
    skills: ['创意开发', '交互设计', '生成式 AI', '实时图形', '产品原型', '技术叙事'],
  },
  en: {
    name: 'Shen Ye', role: 'Creative Developer / AI Product Designer', statement: 'Building perceptive digital experiences where code, narrative, and machine intelligence meet.',
    intro: 'I explore how complex technology can become visible, useful, and memorable through generative interfaces, real-time graphics, and intelligent product prototypes.',
    location: 'Shanghai / Remote', email: 'hello@shenye.space',
    skills: ['Creative development', 'Interaction design', 'Generative AI', 'Real-time graphics', 'Product prototyping', 'Technical narrative'],
  },
};

export const experience = {
  zh: [
    { period: '2024 - 至今', title: '独立创意技术顾问', note: '为 AI 团队与文化机构打造产品原型、交互系统和数字展览。' },
    { period: '2021 - 2024', title: '生成体验负责人 · Field Lab', note: '带领小型跨职能团队，将机器学习研究转化为可用的公众体验。' },
    { period: '2018 - 2021', title: '交互开发者 · North Studio', note: '为品牌、艺术家与公共空间开发实时视觉和网络作品。' },
  ],
  en: [
    { period: '2024 - Now', title: 'Independent Creative Technologist', note: 'Prototyping products, interaction systems, and digital exhibitions for AI teams and cultural institutions.' },
    { period: '2021 - 2024', title: 'Generative Experience Lead · Field Lab', note: 'Led a compact cross-functional team translating machine learning research into public-facing experiences.' },
    { period: '2018 - 2021', title: 'Interactive Developer · North Studio', note: 'Built real-time visual and web work for brands, artists, and public spaces.' },
  ],
};
