import { db } from "@/server/db";
import {
  GitHubAPIError,
  GitHubBranch,
  GitHubCommit,
  GitHubOrg,
  GitHubPullRequest,
  GitHubPullRequestFile,
  GitHubRepo,
  GitHubTreeFile,
  OpenPullRequest,
  ReviewComment,
} from "./types";

async function githubFetch(
  url: string,
  accessToken: string,
): Promise<Response> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    const resetEpoch = response.headers.get("x-ratelimit-reset");
    throw new GitHubAPIError(
      response.status,
      url,
      remaining ? parseInt(remaining, 10) : undefined,
      resetEpoch ? new Date(parseInt(resetEpoch, 10) * 1000) : undefined,
    );
  }

  return response;
}

export async function getGitHubAccessToken(
  userId: string,
): Promise<string | null> {
  const account = await db.account.findFirst({
    where: {
      userId,
      providerId: "github",
    },
    select: {
      accessToken: true,
      accessTokenExpiresAt: true,
    },
  });

  if (!account?.accessToken) return null;

  if (
    account.accessTokenExpiresAt &&
    account.accessTokenExpiresAt < new Date()
  ) {
    console.warn(`[getGitHubAccessToken] Token for user ${userId} has expired`);
    return null;
  }

  return account.accessToken;
}

async function fetchAllPages<T>(
  url: string,
  accessToken: string,
  perPage = 100,
  maxPages = 50,
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;

  while (page <= maxPages) {
    const separator = url.includes("?") ? "&" : "?";
    const response = await githubFetch(
      `${url}${separator}per_page=${perPage}&page=${page}`,
      accessToken,
    );

    const data = (await response.json()) as T[];
    results.push(...data);
    if (data.length < perPage) break;
    page++;
  }

  return results;
}

export async function fetchGitHubRepos(
  accessToken: string,
): Promise<GitHubRepo[]> {
  const userRepos = await fetchAllPages<GitHubRepo>(
    "https://api.github.com/user/repos?sort=updated&affiliation=owner,collaborator,organization_member",
    accessToken,
  );

  const orgs = await fetchAllPages<GitHubOrg>(
    "https://api.github.com/user/orgs",
    accessToken,
  );

  const orgRepoArrays = await Promise.all(
    orgs.map((org) =>
      fetchAllPages<GitHubRepo>(
        `https://api.github.com/orgs/${org.login}/repos?sort=updated`,
        accessToken,
      ),
    ),
  );

  const repoMap = new Map<number, GitHubRepo>();
  for (const repo of userRepos) {
    repoMap.set(repo.id, repo);
  }
  for (const orgRepos of orgRepoArrays) {
    for (const repo of orgRepos) {
      repoMap.set(repo.id, repo);
    }
  }

  return Array.from(repoMap.values()).sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

export async function fetchPullRequests(
  accessToken: string,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open",
): Promise<GitHubPullRequest[]> {
  const pulls = await fetchAllPages<GitHubPullRequest>(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&sort=updated&direction=desc`,
    accessToken,
  );

  return Promise.all(
    pulls.map((pr) => fetchPullRequest(accessToken, owner, repo, pr.number)),
  );
}

export async function fetchPullRequest(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<GitHubPullRequest> {
  const response = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    accessToken,
  );

  return (await response.json()) as GitHubPullRequest;
}

export async function fetchPullRequestByFullName(
  accessToken: string,
  repoFullName: string,
  prNumber: number,
): Promise<GitHubPullRequest> {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid repository full name: ${repoFullName}`);
  }

  return fetchPullRequest(accessToken, owner, repo, prNumber);
}

export async function fetchPullRequestFiles(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<GitHubPullRequestFile[]> {
  return fetchAllPages<GitHubPullRequestFile>(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
    accessToken,
  );
}

export async function fetchRepositoryFiles(
  accessToken: string,
  owner: string,
  repo: string,
  branch?: string,
): Promise<GitHubTreeFile[]> {
  const branchName =
    branch ?? (await fetchDefaultBranch(accessToken, owner, repo));
  const response = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branchName}?recursive=1`,
    accessToken,
  );

  const data = (await response.json()) as {
    tree: GitHubTreeFile[];
    truncated: boolean;
  };
  return data.tree.filter((t) => t.type === "blob");
}

export async function fetchCommits(
  accessToken: string,
  owner: string,
  repo: string,
  options: {
    perPage?: number;
    page?: number;
    sha?: string;
  } = {},
): Promise<GitHubCommit[]> {
  const { perPage = 30, page = 1, sha } = options;

  let url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${perPage}&page=${page}`;
  if (sha) {
    url += `&sha=${encodeURIComponent(sha)}`;
  }

  const response = await githubFetch(url, accessToken);
  return (await response.json()) as GitHubCommit[];
}

export async function fetchCommit(
  accessToken: string,
  owner: string,
  repo: string,
  sha: string,
): Promise<GitHubCommit> {
  const response = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
    accessToken,
  );
  return (await response.json()) as GitHubCommit;
}

export async function fetchBranches(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<GitHubBranch[]> {
  return fetchAllPages<GitHubBranch>(
    `https://api.github.com/repos/${owner}/${repo}/branches`,
    accessToken,
  );
}

export async function fetchDefaultBranch(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<string> {
  const response = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    accessToken,
  );
  const data = (await response.json()) as { default_branch: string };
  return data.default_branch;
}

export async function registerWebhook(
  accessToken: string,
  repoFullName: string,
  webhookUrl: string,
  secret: string,
): Promise<number> {
  const [owner, repo] = repoFullName.split("/");
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };

  const listRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/hooks?per_page=100`,
    { headers },
  );

  if (listRes.ok) {
    const hooks = (await listRes.json()) as Array<{
      id: number;
      active: boolean;
      config: { url?: string };
    }>;

    const existing = hooks.find((h) => h.config?.url === webhookUrl);
    if (existing) {
      if (!existing.active) {
        await fetch(
          `https://api.github.com/repos/${owner}/${repo}/hooks/${existing.id}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ active: true }),
          },
        );
      }

      return existing.id;
    }
  } else {
    const body = await listRes.text();
    console.warn(
      `[registerWebhook] list failed status=${listRes.status} body=${body}`,
    );
  }

  const createRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/hooks`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "web",
        active: true,
        events: ["pull_request"],
        config: {
          url: webhookUrl,
          content_type: "json",
          secret,
          insecure_ssl: "0",
        },
      }),
    },
  );

  if (createRes.ok) {
    const data = (await createRes.json()) as { id: number };
    return data.id;
  }

  const errorBody = await createRes.text();
  console.error(
    `[registerWebhook] create failed status=${createRes.status} body=${errorBody}`,
  );
  throw new Error(
    `GitHub API error ${createRes.status} registering webhook for ${repoFullName}`,
  );
}

export async function deleteWebhook(
  accessToken: string,
  repoFullName: string,
  webhookId: number,
): Promise<void> {
  const [owner, repo] = repoFullName.split("/");
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/hooks/${webhookId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(
      `GitHub API error ${response.status} deleting webhook ${webhookId} for ${repoFullName}`,
    );
  }
}

export async function postCommitStatus(
  accessToken: string,
  repoFullName: string,
  commitSha: string,
  state: "pending" | "success" | "failure" | "error",
  repositoryId: string,
  prNumber: number,
  description: string,
): Promise<void> {
  const [owner, repo] = repoFullName.split("/");
  const appBaseUrl = process.env.APP_BASE_URL ?? process.env.BETTER_AUTH_URL;
  if (!appBaseUrl) {
    throw new Error(
      "APP_BASE_URL (or BETTER_AUTH_URL) is required to post commit statuses",
    );
  }
  const targetUrl = `${appBaseUrl}/repo/${repositoryId}/pr/${prNumber}`;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/statuses/${commitSha}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        state,
        target_url: targetUrl,
        description,
        context: "devreview-ai/code-review",
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `GitHub API error ${response.status} posting commit status for ${repoFullName}@${commitSha}`,
    );
  }
}

export async function submitPullRequestReview(
  accessToken: string,
  repoFullName: string,
  pullNumber: number,
  commitSha: string,
  body: string,
  comments: ReviewComment[],
): Promise<number> {
  const [owner, repo] = repoFullName.split("/");
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        commit_id: commitSha,
        body,
        event: "COMMENT",
        comments: comments.map((c) => ({
          path: c.path,
          line: c.line,
          body: c.body,
        })),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `GitHub API error ${response.status} submitting PR review for ${repoFullName}#${pullNumber}`,
    );
  }

  const data = (await response.json()) as { id: number };
  return data.id;
}

export async function dismissGitHubReview(
  accessToken: string,
  repoFullName: string,
  pullNumber: number,
  reviewId: number,
  message: string,
): Promise<void> {
  const [owner, repo] = repoFullName.split("/");
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews/${reviewId}/dismissals`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        event: "DISMISS",
      }),
    },
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(
      `GitHub API error ${response.status} dismissing PR review ${reviewId} for ${repoFullName}#${pullNumber}`,
    );
  }
}

export async function listOpenPullRequests(
  accessToken: string,
  repoFullName: string,
): Promise<OpenPullRequest[]> {
  const [owner, repo] = repoFullName.split("/");
  const pulls = await fetchAllPages<OpenPullRequest & { draft: boolean }>(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=open`,
    accessToken,
  );
  return pulls.filter((pr) => !pr.draft);
}
