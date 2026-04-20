/** 浏览器端岗位匹配与寄语（与 Node 版逻辑对齐） */

export function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

function scoreJob(textNorm, job) {
  let score = 0;
  for (const kw of job.keywords || []) {
    const k = normalize(kw);
    if (!k) continue;
    if (textNorm.includes(k)) score += 3;
  }
  const title = normalize(job.title);
  if (title && textNorm.includes(title.slice(0, 4))) score += 1;
  if ((!job.keywords || job.keywords.length === 0) && textNorm.length >= 4) {
    const jdN = normalize(job.jd || "");
    const probe = textNorm.slice(0, Math.min(8, textNorm.length));
    if (jdN.includes(probe)) score += 2;
  }
  return score;
}

export function matchJobsWithList(jobs, school, major, limit = 3) {
  const textNorm = normalize(`${school} ${major}`);
  const ranked = jobs
    .map((j) => ({ job: j, score: scoreJob(textNorm, j) }))
    .sort((a, b) => b.score - a.score);

  const picks = [];
  for (const row of ranked) {
    if (picks.length >= limit) break;
    picks.push({
      id: row.job.id,
      title: row.job.title,
      city: row.job.city,
      jd: row.job.jd,
      score: row.score,
    });
  }
  if (picks.length === 0 || picks.every((p) => p.score === 0)) {
    return jobs.slice(0, limit).map((j) => ({
      id: j.id,
      title: j.title,
      city: j.city,
      jd: j.jd,
      score: 0,
    }));
  }
  return picks;
}

function simpleHash(str) {
  let h = 2166136261;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickVariant(arr, seed) {
  if (!arr.length) return "";
  return arr[seed % arr.length];
}

function shortenSchoolLabel(school) {
  const s = String(school || "").trim();
  if (!s) return "";
  if (s.length <= 10) return s;
  return s.slice(0, 9) + "…";
}

export function buildPersonalizedWish({ name, school, major, shirtSize, matches }) {
  const n = String(name || "").trim() || "同学";
  const schoolLabel = shortenSchoolLabel(school);
  const majorText = String(major || "").trim();
  const sizeLabel = String(shirtSize || "").trim() || "所选";
  const top = (matches && matches[0]) || null;
  const topTitle = top ? String(top.title) : "";
  const topCity = top ? String(top.city) : "";
  const trackId = top ? String(top.id) : "generic";

  const seed = simpleHash(`${n}|${school}|${major}|${sizeLabel}|${trackId}`);

  const schoolClauses = schoolLabel
    ? [
        `来自「${schoolLabel}」的你，带着学校的气质与问题清单来到现场，这本身就是很好的准备。`,
        `「${schoolLabel}」的背景，会是你观察行业时独特的视角；今天不妨把课堂里的好奇，问得更具体一点。`,
        `从「${schoolLabel}」走到这里，你已经把“走出去”落实了一步；接下来把今天听到的变成下一步计划，就很棒。`,
      ]
    : [
        "无论你来自哪所学校，今天都欢迎你把真实的问题抛出来：好问题往往比标准答案更有价值。",
        "现场信息密度不低，建议你只抓三条对你最重要的收获，回去慢慢消化。",
      ];

  const majorClauses = majorText
    ? [
        `你的「${majorText}」专业背景，和 SLB 在${topTitle || "相关岗位"}里看重的问题拆解、数据判断与执行闭环是能对上的，今天可以重点验证这一点。`,
        `把「${majorText}」里学到的分析框架，带到今天的岗位交流中：你会更容易听懂 SLB 团队在真实业务里如何定义问题与衡量结果。`,
        `以「${majorText}」为起点，今天建议你重点问“岗位前 6 个月要交付什么”，这会帮你判断自己和 SLB 岗位的匹配度。`,
      ]
    : ["专业背景只是拼图的一块，今天多留意团队如何协作、如何做决策，同样重要。"];

  const sizeClauses = [
    `你已登记领取 ${sizeLabel} 码服装。后面建议把更多精力放在和 SLB 同事交流岗位能力模型、成长路径与业务场景上。`,
    `${sizeLabel} 码登记完成。今天的目标可以很清晰：围绕你关心的 SLB 岗位，拿到 2-3 条可执行的下一步行动。`,
    `服装尺码 ${sizeLabel} 已记录。期待你在今天的 Open Day 不只“了解岗位”，还能形成自己的职业判断。`,
  ];

  const trackClauses = {
    "field-intern": [
      `你与「${topTitle || "现场与工程方向"}」的匹配点，在于把专业知识落到真实工况。建议你今天重点了解 SLB 现场岗位的安全标准与问题处理节奏。`,
      "现场与能源岗位通常强调纪律、协同和复盘能力；如果你享受一线解决问题，这条路径会很有成长空间。",
    ],
    "data-intern": [
      `在「${topTitle || "数据方向"}」上，你可以重点看“业务问题如何被翻译成数据问题”，这正是 SLB 数字化岗位的核心价值。`,
      "若你希望走数据与技术结合路线，今天建议多问指标体系、上线节奏和跨团队协作方式，这些决定真实工作体验。",
    ],
    "rd-chem-intern": [
      `你在「${topTitle || "研发方向"}」上的优势，常来自专业基础与实验严谨性；今天可重点了解 SLB 如何做“验证-迭代-规模化”。`,
      "研发岗位的长期成长，离不开对质量、安全与业务价值的平衡；这也是今天交流时值得重点观察的能力要求。",
    ],
    "supply-chain-trainee": [
      "供应链岗位连接计划、采购、交付与现场执行。今天建议你围绕“成本、时效、风险”去问，最能看出岗位核心能力。",
      `「${topTitle || "供应链方向"}」通常很看重全局视角与跨团队推进力，这也是你可重点展示与补齐的方向。`,
    ],
    "hr-talent-intern": [
      "雇主品牌与人才相关岗位，核心是把组织需求和候选人体验连接起来；今天你可以从活动细节里观察这件事如何落地。",
      `若你关注「${topTitle || "雇主品牌方向"}」，建议重点问“评估标准”和“关键协作方”，这能帮助你更快理解岗位全貌。`,
    ],
    generic: [
      "今天不必急着下结论，先围绕岗位要求、团队协作和成长路径收集信息，再做判断会更稳。",
      "把 Open Day 当成一次高密度职业访谈：你问得越具体，越能判断自己与 SLB 岗位是否匹配。",
    ],
  };

  const closings = [
    `${n}，祝你今天在现场收获清晰方向，也期待你把这份投入延续到后续学习与投递中。`,
    `${n}，期待你在 Open Day 找到与专业优势对应的 SLB 岗位，并把今天的交流转化为下一步行动计划。`,
    `${n}，愿你在${topCity ? `「${topCity}」机会` : "未来机会"}探索中持续进阶，也期待未来在 SLB 的项目现场看到你的成长。`,
    `${n}，感谢你来到现场。期待你在职业道路上长期保持好奇、执行力和专业判断。`,
  ];

  const schoolLine = pickVariant(schoolClauses, seed);
  const majorLine = pickVariant(majorClauses, seed + 7);
  const sizeLine = pickVariant(sizeClauses, seed + 13);
  const trackLine = pickVariant(trackClauses[trackId] || trackClauses.generic, seed + 19);
  const closing = pickVariant(closings, seed + 29);

  return [schoolLine, majorLine, sizeLine, trackLine, closing].join("\n\n");
}
