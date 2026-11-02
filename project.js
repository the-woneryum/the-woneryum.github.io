const USER = "the-woneryum";
const API_ROOT = "https://api.github.com";
document.getElementById("year").textContent = new Date().getFullYear();
const params = new URLSearchParams(location.search);
const repoName = params.get("repo");
const state = document.getElementById("detailState");
const detail = document.getElementById("projectDetail");
const apiHeaders = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };

async function getJSON(url) {
  const response = await fetch(url, { headers: apiHeaders });
  if (!response.ok) throw new Error(response.status === 404 ? "Repository not found or not public." : `GitHub API error (${response.status}).`);
  return response.json();
}
function put(id, text) { document.getElementById(id).textContent = text; }
function niceDate(value) {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)) : "Unknown";
}
async function loadProject() {
  if (!repoName || repoName.includes("/") || repoName.includes("..")) {
    state.textContent = "No valid repository was selected. Return to the portfolio and choose a project.";
    return;
  }
  try {
    const repo = await getJSON(`${API_ROOT}/repos/${encodeURIComponent(USER)}/${encodeURIComponent(repoName)}`);
    put("repoName", repo.full_name);
    put("repoDescription", repo.description || "This repository does not have a public description yet.");
    put("repoMeta", `★ ${repo.stargazers_count} stars · ${repo.forks_count} forks · ${repo.open_issues_count} open issues · ${repo.visibility}`);
    put("repoLanguage", `Primary language: ${repo.language || "Not specified"}`);
    put("repoLicense", `License: ${repo.license?.spdx_id || "Not specified"}`);
    put("repoUpdated", `Last updated: ${niceDate(repo.updated_at)}`);
    put("repoClone", `Clone: git clone ${repo.clone_url}`);
    document.getElementById("repoSource").href = repo.html_url;
    document.getElementById("repoIssues").href = `${repo.html_url}/issues`;
    state.hidden = true; detail.hidden = false;
    try {
      const readme = await getJSON(`${API_ROOT}/repos/${encodeURIComponent(USER)}/${encodeURIComponent(repoName)}/readme`);
      const markdown = atob(readme.content.replace(/\s/g, ""));
      const bytes = Uint8Array.from(markdown, c => c.charCodeAt(0));
      const decoded = new TextDecoder("utf-8").decode(bytes);
      const html = window.marked ? marked.parse(decoded) : `<pre>${decoded.replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]))}</pre>`;
      document.getElementById("readmeContent").innerHTML = window.DOMPurify ? DOMPurify.sanitize(html) : html;
    } catch {
      document.getElementById("readmeContent").innerHTML = "<h2>README</h2><p>This repository has no readable public README file. Visit the source repository for details.</p>";
    }
  } catch (error) {
    state.textContent = error.message;
  }
}
loadProject();
