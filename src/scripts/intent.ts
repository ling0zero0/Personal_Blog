export type IntentResult = { type: 'navigate' | 'filter' | 'scene' | 'unknown'; message: string; target?: string; value?: string };

export function resolveIntent(input: string, lang: 'zh' | 'en'): IntentResult {
  const query = input.trim().toLowerCase();
  const base = `/${lang}`;
  const has = (...terms: string[]) => terms.some((term) => query.includes(term));
  if (has('项目', '作品', 'project', 'work')) return { type: 'navigate', target: `${base}/projects`, message: lang === 'zh' ? '正在打开项目档案。' : 'Opening the project archive.' };
  if (has('关于', '介绍', '你是谁', 'about', 'yourself', 'who are you')) return { type: 'navigate', target: `${base}/about`, message: lang === 'zh' ? '带你去了解我的经历与方法。' : 'Taking you to my background and approach.' };
  if (has('文章', '写作', 'journal', 'article', 'writing')) {
    const ai = has('ai', '人工智能', '模型');
    return { type: ai ? 'filter' : 'navigate', target: `${base}/journal${ai ? '?tag=AI' : ''}`, value: ai ? 'AI' : undefined, message: lang === 'zh' ? '正在查找相关文章。' : 'Finding relevant writing.' };
  }
  if (has('英文', 'english')) return { type: 'navigate', target: '/en/', message: lang === 'zh' ? '切换到英文空间。' : 'Switching to English.' };
  if (has('中文', 'chinese')) return { type: 'navigate', target: '/zh/', message: lang === 'zh' ? '已经是中文界面。' : 'Switching to Chinese.' };
  if (has('安静', '慢', 'quiet', 'calm', 'slower')) return { type: 'scene', value: 'calm', message: lang === 'zh' ? '场景已进入低频呼吸。' : 'The scene is now breathing more slowly.' };
  if (has('聚焦', 'focus')) return { type: 'scene', value: 'focus', message: lang === 'zh' ? '正在聚焦数据核心。' : 'Focusing the data core.' };
  if (has('分解', '散开', 'explode', 'scatter')) return { type: 'scene', value: 'scatter', message: lang === 'zh' ? '正在分解当前结构。' : 'Decomposing the current structure.' };
  return { type: 'unknown', message: lang === 'zh' ? '我还不理解这条命令。可以试试“看项目”“找 AI 文章”或“让场景安静一点”。' : 'I do not understand that yet. Try “show projects,” “find AI articles,” or “make the scene quieter.”' };
}
