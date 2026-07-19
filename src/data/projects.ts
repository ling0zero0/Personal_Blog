import type { ImageMetadata } from 'astro';
import type { Locale } from './site';
import wShaPoster from '../assets/images/projects/w-sha/poster.webp';
import wShaGallery02 from '../assets/images/projects/w-sha/gallery-02.webp';
import wShaGallery03 from '../assets/images/projects/w-sha/gallery-03.webp';
import wShaGallery04 from '../assets/images/projects/w-sha/gallery-04.webp';
import wShaGallery05 from '../assets/images/projects/w-sha/gallery-05.webp';
import wShaGallery06 from '../assets/images/projects/w-sha/gallery-06.webp';
import wShaGallery07 from '../assets/images/projects/w-sha/gallery-07.webp';

export type ProjectImage = {
  src: ImageMetadata;
  alt: Record<Locale, string>;
};

export type Project = {
  slug: string; year: string; index: string; color: string; tags: string[];
  title: Record<Locale, string>; summary: Record<Locale, string>; description: Record<Locale, string>;
  role: Record<Locale, string>; outcome: Record<Locale, string>; href: string;
  linkLabel?: Record<Locale, string>;
  poster?: ProjectImage;
  gallery?: ProjectImage[];
};

export const projects: Project[] = [
  {
    slug: 'w-sha', year: '2026', index: '01', color: '#d82020', tags: ['Game', 'Full-stack', 'LAN'],
    title: { zh: 'W_SHA 局域网狼人杀', en: 'W_SHA LAN Werewolf' },
    summary: {
      zh: '让 Windows 主机成为公共屏幕、玩家用手机扫码即玩的局域网狼人杀。',
      en: 'A LAN Werewolf game with a Windows host screen and instant phone-based play.',
    },
    description: {
      zh: '一套面向线下聚会的局域网狼人杀辅助系统。Windows 电脑负责创建房间、配置角色和控制流程，玩家连接同一 Wi-Fi 后通过手机浏览器扫码加入；系统覆盖身份分配、夜间行动、白天发言、投票结算、断线重连与本地状态恢复，全程无需手机 App 或云服务器。',
      en: 'A LAN-based Werewolf system for in-person gatherings. A Windows computer creates the room, configures roles, and runs the shared game screen while players join from phone browsers on the same Wi-Fi. It handles role assignment, night actions, discussion, voting, reconnects, and local recovery without a mobile app or cloud service.',
    },
    role: {
      zh: '产品设计、全栈开发、游戏状态机、实时通信与 Windows 分发',
      en: 'Product design, full-stack development, game state machine, real-time networking, and Windows distribution',
    },
    outcome: {
      zh: '完成可分发 MVP，支持 7 类角色、完整对局流程、断线恢复、自动化测试及 Windows 安装版与便携版打包。',
      en: 'Delivered a distributable MVP with seven roles, a complete game loop, reconnect recovery, automated tests, and Windows installer and portable builds.',
    },
    href: 'https://github.com/ling0zero0/w_sha',
    linkLabel: { zh: '查看 GitHub 仓库', en: 'View GitHub repository' },
    poster: {
      src: wShaPoster,
      alt: { zh: 'W_SHA 局域网狼人杀产品总览海报', en: 'W_SHA LAN Werewolf product overview poster' },
    },
    gallery: [
      {
        src: wShaPoster,
        alt: { zh: 'W_SHA 局域网狼人杀产品总览海报', en: 'W_SHA LAN Werewolf product overview poster' },
      },
      {
        src: wShaGallery02,
        alt: { zh: '朋友围坐并通过电脑与手机进行局域网狼人杀', en: 'Friends playing LAN Werewolf together with a computer and phones' },
      },
      {
        src: wShaGallery03,
        alt: { zh: '局域网直连、手机浏览器加入、角色系统与断线恢复功能', en: 'LAN connection, browser-based joining, role system, and reconnect recovery' },
      },
      {
        src: wShaGallery04,
        alt: { zh: '狼人、预言家、女巫、守卫、猎人和白痴角色阵营', en: 'Werewolf, Seer, Witch, Guard, Hunter, and Idiot role lineup' },
      },
      {
        src: wShaGallery05,
        alt: { zh: '房主开房、玩家扫码加入并开始推理的三步流程', en: 'Three-step flow for hosting, scanning to join, and starting the game' },
      },
      {
        src: wShaGallery06,
        alt: { zh: '玩家通过手机浏览器扫描二维码加入游戏', en: 'Players scanning a QR code to join from a phone browser' },
      },
      {
        src: wShaGallery07,
        alt: { zh: '多名玩家展示各自的秘密身份并进行推理', en: 'Players holding secret roles during a Werewolf deduction game' },
      },
    ],
  },
  {
    slug: 'latent-atlas', year: '2026', index: '02', color: '#ff4d24', tags: ['AI', 'WebGL', 'Research'],
    title: { zh: '潜空间图谱', en: 'Latent Atlas' },
    summary: { zh: '一座可以行走的机器记忆档案馆。', en: 'A walkable archive of machine memory.' },
    description: { zh: '将四万段城市声音编码为空间坐标，通过实时语义检索重组为不断变化的地形。访客既可以漫游，也可以用自然语言改变观察尺度。', en: 'Forty thousand urban recordings become spatial coordinates, continuously reorganized through semantic retrieval. Visitors roam freely or change the viewing scale with natural language.' },
    role: { zh: '创意方向、交互原型、实时图形', en: 'Creative direction, interaction prototype, real-time graphics' },
    outcome: { zh: '2026 数字文化季主展，现场 18,000 位访客', en: 'Flagship installation at Digital Culture Season 2026, 18,000 visitors' },
    href: 'https://example.com/latent-atlas',
  },
  {
    slug: 'second-weather', year: '2025', index: '03', color: '#16a085', tags: ['Data', 'Installation', 'Sound'],
    title: { zh: '第二种天气', en: 'Second Weather' },
    summary: { zh: '让城市数据拥有气候与呼吸。', en: 'Giving urban data its own climate and breath.' },
    description: { zh: '实时公共数据驱动光、雾与声音。作品不复刻天气，而是让基础设施的压力、节奏和空白形成另一套感知系统。', en: 'Live public data drives light, haze, and sound. Instead of reproducing weather, the work gives infrastructural stress, rhythm, and absence their own sensory system.' },
    role: { zh: '概念、数据系统、声音交互', en: 'Concept, data system, sonic interaction' },
    outcome: { zh: '三城巡展，获亚洲设计年度提名', en: 'Touring installation across three cities, Asia Design Award nominee' },
    href: 'https://example.com/second-weather',
  },
  {
    slug: 'quiet-machine', year: '2024', index: '04', color: '#e6b422', tags: ['AI', 'Product', 'Interface'],
    title: { zh: '安静的机器', en: 'Quiet Machine' },
    summary: { zh: '一个不抢走注意力的个人智能界面。', en: 'A personal intelligence interface that does not demand attention.' },
    description: { zh: '探索低打扰 AI 的产品原型。系统根据工作语境提供小而及时的介入，并把不确定性明确呈现给使用者。', en: 'A product prototype for low-interruption AI. It offers small, timely interventions based on work context while making uncertainty legible to the user.' },
    role: { zh: '产品策略、体验设计、前端工程', en: 'Product strategy, experience design, front-end engineering' },
    outcome: { zh: '完成 12 周封闭测试，日活留存 72%', en: '12-week closed beta with 72% daily retention' },
    href: 'https://example.com/quiet-machine',
  },
];
