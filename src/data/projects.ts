import type { Locale } from './site';

export type Project = {
  slug: string; year: string; index: string; color: string; tags: string[];
  title: Record<Locale, string>; summary: Record<Locale, string>; description: Record<Locale, string>;
  role: Record<Locale, string>; outcome: Record<Locale, string>; href: string;
};

export const projects: Project[] = [
  {
    slug: 'latent-atlas', year: '2026', index: '01', color: '#ff4d24', tags: ['AI', 'WebGL', 'Research'],
    title: { zh: '潜空间图谱', en: 'Latent Atlas' },
    summary: { zh: '一座可以行走的机器记忆档案馆。', en: 'A walkable archive of machine memory.' },
    description: { zh: '将四万段城市声音编码为空间坐标，通过实时语义检索重组为不断变化的地形。访客既可以漫游，也可以用自然语言改变观察尺度。', en: 'Forty thousand urban recordings become spatial coordinates, continuously reorganized through semantic retrieval. Visitors roam freely or change the viewing scale with natural language.' },
    role: { zh: '创意方向、交互原型、实时图形', en: 'Creative direction, interaction prototype, real-time graphics' },
    outcome: { zh: '2026 数字文化季主展，现场 18,000 位访客', en: 'Flagship installation at Digital Culture Season 2026, 18,000 visitors' },
    href: 'https://example.com/latent-atlas',
  },
  {
    slug: 'second-weather', year: '2025', index: '02', color: '#16a085', tags: ['Data', 'Installation', 'Sound'],
    title: { zh: '第二种天气', en: 'Second Weather' },
    summary: { zh: '让城市数据拥有气候与呼吸。', en: 'Giving urban data its own climate and breath.' },
    description: { zh: '实时公共数据驱动光、雾与声音。作品不复刻天气，而是让基础设施的压力、节奏和空白形成另一套感知系统。', en: 'Live public data drives light, haze, and sound. Instead of reproducing weather, the work gives infrastructural stress, rhythm, and absence their own sensory system.' },
    role: { zh: '概念、数据系统、声音交互', en: 'Concept, data system, sonic interaction' },
    outcome: { zh: '三城巡展，获亚洲设计年度提名', en: 'Touring installation across three cities, Asia Design Award nominee' },
    href: 'https://example.com/second-weather',
  },
  {
    slug: 'quiet-machine', year: '2024', index: '03', color: '#e6b422', tags: ['AI', 'Product', 'Interface'],
    title: { zh: '安静的机器', en: 'Quiet Machine' },
    summary: { zh: '一个不抢走注意力的个人智能界面。', en: 'A personal intelligence interface that does not demand attention.' },
    description: { zh: '探索低打扰 AI 的产品原型。系统根据工作语境提供小而及时的介入，并把不确定性明确呈现给使用者。', en: 'A product prototype for low-interruption AI. It offers small, timely interventions based on work context while making uncertainty legible to the user.' },
    role: { zh: '产品策略、体验设计、前端工程', en: 'Product strategy, experience design, front-end engineering' },
    outcome: { zh: '完成 12 周封闭测试，日活留存 72%', en: '12-week closed beta with 72% daily retention' },
    href: 'https://example.com/quiet-machine',
  },
];
