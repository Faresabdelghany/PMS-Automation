const https = require('https');
const token = '7960456391:AAHV4iPrBc_H9x-f3hBBc4a8yt5tX2MMGiY';
const chatId = '-1003815755547';

const intros = [
  `🧠 Product Analyst: Here is how I work and what I own.

Responsibilities:
- Translate Fares's goals into clear product specs (PRDs)
- Do market, user, and competitive research before anything is built
- Define what success looks like for every feature
- Hand Dev clean, actionable task lists — no ambiguity

How I work:
I run SpecKit to structure requirements. Every task that goes to Dev comes from me. If there is no spec, nothing moves. I am the single source of truth on what gets built and why.`,

  `🛠️ Dev: Here is how I work and what I own.

Responsibilities:
- Implement all features and fixes on the PMS codebase
- Write clean, production-ready code (Next.js, Supabase, TypeScript)
- Follow the tasks.md handed off by Product Analyst
- Report completion and flag blockers immediately

How I work:
I run in full-auto mode via Codex. I read the spec, implement, test locally, and write a report. I do not ship untested code. Once done, Testing Agent takes over before anything reaches Code Reviewer.`,

  `🧪 Testing Agent: Here is how I work and what I own.

Responsibilities:
- Test every feature before it reaches Code Reviewer
- Write and run Playwright end-to-end tests
- Catch bugs, edge cases, and regressions
- Document all findings in a test report

How I work:
I run Claude Code with full permissions + Playwright CLI. I get the feature branch from Dev, run tests, document what passes and what fails. If something breaks, it goes back to Dev with a clear bug report. Nothing reaches review without my sign-off.`,

  `🔍 Code Reviewer: Here is how I work and what I own.

Responsibilities:
- Review all code after Testing Agent clears it
- Check for code quality, security issues, performance, and maintainability
- Approve or reject with specific, actionable feedback
- Final gate before Ziko presents to Fares

How I work:
I run Claude Code with /review. I go line by line — logic, architecture, edge cases, security. If I find issues, code goes back to Dev. I only sign off when the code is genuinely solid. My approval means it is ready to ship.`,

  `🎨 Designer: Here is how I work and what I own.

Responsibilities:
- Own all UI/UX decisions for PMS and client work
- Design components, layouts, and full page flows
- Maintain brand consistency across the product
- Work directly with Dev to ensure pixel-perfect implementation

How I work:
I collaborate with Product Analyst on specs, then translate requirements into design decisions. I work with Tech Lead on constraints and feasibility. I deliver design specs, component guidelines, and visual direction. Quality over speed — every screen has to feel right.`,

  `📣 Marketing: Here is how I work and what I own.

Responsibilities:
- Own positioning, messaging, and go-to-market strategy
- Write copy for landing pages, emails, and ads
- Plan and execute growth campaigns
- Track what works and iterate fast

How I work:
I work off Product Analyst briefs for new features. I handle the full funnel — awareness to conversion. Cold emails, SEO content, paid ads, launch strategies. I measure results and report back. The goal is always the same: more customers, more revenue.`
];

function send(i) {
  if (i >= intros.length) { console.log('done'); return; }
  const body = { chat_id: chatId, text: intros[i] };
  const data = JSON.stringify(body);
  const req = https.request({ hostname: 'api.telegram.org', path: '/bot' + token + '/sendMessage', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, res => {
    let resp = '';
    res.on('data', d => resp += d);
    res.on('end', () => { 
      const parsed = JSON.parse(resp);
      console.log(i, parsed.ok, parsed.description || (parsed.result && parsed.result.message_id) || '');
      setTimeout(() => send(i + 1), 1000); 
    });
  });
  req.write(data);
  req.end();
}
send(0);
