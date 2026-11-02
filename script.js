const GITHUB_USER = "the-woneryum";
const API = "https://api.github.com";
const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };

document.getElementById("year").textContent = new Date().getFullYear();

const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealObserver.unobserve(entry.target); }
    }), { threshold: 0.12 })
  : null;
document.querySelectorAll(".reveal").forEach(el => revealObserver ? revealObserver.observe(el) : el.classList.add("is-visible"));

const progress = document.getElementById("scrollProgress");
let ticking = false;
window.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
    ticking = false;
  });
}, { passive: true });

async function github(path) {
  const response = await fetch(`${API}${path}`, { headers });
  if (!response.ok) {
    if (response.status === 403) throw new Error("GitHub API request limit reached. Please try again later.");
    if (response.status === 404) throw new Error("GitHub profile or repository was not found.");
    throw new Error(`GitHub API error (${response.status}).`);
  }
  return response.json();
}
function safeText(value, fallback = "No description provided yet.") {
  return (value || fallback).toString();
}
function formatDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}
function setStat(name, value) {
  const target = document.querySelector(`[data-stat="${name}"]`);
  if (!target) return;
  const end = Number(value) || 0;
  const duration = 850, startAt = performance.now();
  function frame(now) {
    const t = Math.min((now - startAt) / duration, 1);
    target.textContent = Math.round(end * (1 - Math.pow(1 - t, 3))).toLocaleString();
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
function languageColor(language) {
  const palette = { Python:"#3572A5", JavaScript:"#f1e05a", TypeScript:"#3178c6", Dart:"#00B4AB", HTML:"#e34c26", CSS:"#563d7c", PHP:"#4F5D95", Shell:"#89e051", Java:"#b07219", Go:"#00ADD8", Rust:"#dea584" };
  return palette[language] || "#d6a928";
}
function createRepoCard(repo, index) {
  const card = document.createElement("article");
  card.className = "project-card";
  const top = document.createElement("div"); top.className = "project-top";
  const category = document.createElement("span"); category.textContent = `REPOSITORY / ${String(index + 1).padStart(2, "0")}`;
  const icon = document.createElement("span"); icon.className = "project-symbol"; icon.textContent = "⌘";
  top.append(category, icon);
  const title = document.createElement("h3"); title.textContent = repo.name;
  const desc = document.createElement("p"); desc.textContent = safeText(repo.description);
  const tags = document.createElement("div"); tags.className = "tags";
  if (repo.language) {
    const language = document.createElement("span"); language.textContent = repo.language;
    language.style.borderLeft = `2px solid ${languageColor(repo.language)}`; tags.append(language);
  }
  (repo.topics || []).slice(0, 3).forEach(topic => {
    const tag = document.createElement("span"); tag.textContent = topic; tags.append(tag);
  });
  const meta = document.createElement("div"); meta.className = "project-meta";
  meta.textContent = `★ ${repo.stargazers_count}  ⑂ ${repo.forks_count}   UPDATED ${formatDate(repo.updated_at)}`;
  const link = document.createElement("a");
  link.href = `project.html?repo=${encodeURIComponent(repo.name)}`;
  link.textContent = "PROJECT DETAILS ↗";
  card.append(top, title, desc, tags, meta, link);
  return card;
}
async function loadGitHub() {
  const profileStatus = document.getElementById("profileStatus");
  const repoStatus = document.getElementById("repoStatus");
  const grid = document.getElementById("projectGrid");
  try {
    const [profile, repos] = await Promise.all([
      github(`/users/${GITHUB_USER}`),
      github(`/users/${GITHUB_USER}/repos?type=owner&sort=updated&direction=desc&per_page=100`)
    ]);
    const owned = repos.filter(repo => !repo.fork);
    const stars = owned.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    setStat("repos", profile.public_repos);
    setStat("followers", profile.followers);
    setStat("following", profile.following);
    setStat("stars", stars);
    profileStatus.textContent = `Live data from GitHub · profile updated ${formatDate(profile.updated_at)}.`;
    grid.replaceChildren();
    const featured = repos.filter(repo => !repo.fork && !repo.archived).slice(0, 6);
    if (!featured.length) {
      const empty = document.createElement("div"); empty.className = "loading-card"; empty.textContent = "No public repositories found yet."; grid.append(empty);
    } else featured.forEach((repo, i) => grid.append(createRepoCard(repo, i)));
    repoStatus.textContent = `Showing ${featured.length} of ${profile.public_repos} public repositories, sorted by recently updated.`;
  } catch (error) {
    profileStatus.textContent = error.message;
    repoStatus.textContent = "Repository cards could not be loaded. You can still browse the GitHub profile directly.";
    const fallback = document.createElement("a");
    fallback.className = "loading-card"; fallback.href = `https://github.com/${GITHUB_USER}?tab=repositories`;
    fallback.textContent = "Open public repositories on GitHub ↗"; fallback.target = "_blank"; fallback.rel = "noopener noreferrer";
    grid.replaceChildren(fallback);
  }
}
loadGitHub();
