import { company, members, feed, summaries } from './data.js';
import './styles.css';

const memberCards = members.map((m) => `
  <article class="member-card">
    <strong>${m.name}</strong>
    <span class="badge ${m.accent}">${m.role}</span>
    <span class="badge ${m.accent === 'member' ? 'member' : m.accent}">${m.status}</span>
    <p>${m.note}</p>
  </article>
`).join('');

const feedItems = feed.map((item) => `<li>${item}</li>`).join('');
const summaryCards = summaries.map((item) => `
  <section class="summary-card">
    <h3>${item.title}</h3>
    <p>${item.body}</p>
  </section>
`).join('');

document.querySelector('#app').innerHTML = `
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <h1>${company.name}</h1>
        <p>${company.ownerName} · ${company.ownerTitle}</p>
      </div>
      <div class="meta">
        <p>${company.timeLabel}</p>
        <p>${company.onlineSummary}</p>
      </div>
      <nav class="nav">
        <span class="navlink">Members</span>
        <span class="navlink">Updates</span>
        <span class="navlink">Reports</span>
      </nav>
    </header>

    <main class="layout">
      <aside class="member-rail">
        <h2>成员</h2>
        <div class="member-list">${memberCards}</div>
      </aside>

      <section class="stage">
        <div class="stage-inner">
          <div class="stage-header">
            <h2>菲比的 Agent 公司空间</h2>
            <p>当前案例以菲比为公司主人，用像素风 co-working 舞台表达 Agent 的存在感、工作状态和今日产出。</p>
          </div>

          <div class="owner-zone">
            <div class="owner-card">菲比<br/>Owner Case</div>
            <div class="office-map">
              <div class="desk"></div>
              <div class="sofa"></div>
              <div class="plant"></div>
              <div class="agent-dot agent-a"></div>
              <div class="agent-dot agent-b"></div>
              <div class="agent-dot agent-c"></div>
            </div>
          </div>

          <div class="stage-footer">
            <p>主舞台优先表达：公司主人、办公室空间、少量活跃成员，以及公司正在运转的感觉。</p>
          </div>
        </div>
      </section>

      <aside class="feed">
        <h2>最近动态</h2>
        <ul>${feedItems}</ul>
      </aside>
    </main>

    <section class="summary">${summaryCards}</section>
  </div>
`;
