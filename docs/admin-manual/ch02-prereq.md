# Chapter 2: Prerequisites

*Part 1 · Deployment*

> Install Docker Desktop, prepare the directory structure, open up the network, fix the IP — tasks that must be done before deployment.

[← Chapter 1: Platform Overview and Architecture](ch01-overview.md) · [📖 Index](index.md) · [Chapter 3: Configuration Files and Environment Variables →](ch03-env.md)

---

## 2.0 Two Deployment Approaches

This manual can be executed **manually chapter by chapter**, or **handed to an AI Agent tool for automated execution**. When using an Agent, provide it with this directory (including this manual, `docker-compose.yml`, `.env.example`, `scripts/`) and paste the prompt below.

> **Deployment prompt to copy for the Agent:**
> You are a deployment engineer for an enterprise intranet AI platform. Based on the "Deployment" part of the Admin Manual, docker-compose.yml, and .env.example in this directory, fully deploy and verify the "AI AllInOne" platform on this machine. Communicate in Chinese throughout.
>
> Step 1 Collect parameters (ask me for each item; do not skip or guess):
> 1) the intranet IP for external services; 2) the Skill marketplace hostname (domain name; replace <market-hostname> in mcp-gateway/skills/skill-market/config.json and SKILL.md, and resolve it in hosts/DNS); 3) the identity source (if connecting to an AD domain controller, you need domain name / DC IP / LDAP base DN / bind DN / bind password / sAMAccountName); 4) the unified admin account password; 5) the LLM API Key; 6) as needed, ask about the alert webhook, HTTPS, and backup retention policy.
>
> Step 2 Generate a progress file, and update and report it each time an item is completed or a problem is resolved.
>
> Step 3 Strictly follow Chapters 1~13 of this manual in order, pay attention to the "⚠️ Key pitfalls" in each chapter, and prefer the scripts under scripts/ for automation.
>
> Step 4 On error, first check logs (docker logs, health endpoints, configuration) to locate the root cause and then fix it; do not blindly retry.
>
> Step 5 End-to-end verification: all containers Up, Keycloak SSO, send a real conversation through NewAPI/LiteLLM to verify PII redaction, identity source login, monitoring/logging/alerting, backup & restore — summarize each item with ✅/❌.

> 💡 If you are not using an Agent, the above can also serve as a "pre-deployment information checklist": before deploying, think through these four things — intranet IP, identity source, admin password, and model Key.

## 2.1 Install and Configure Docker Desktop

Docker Desktop uses the WSL2 backend by default after installation and usually needs no extra configuration. If you need to manually adjust resource limits, create a `.wslconfig` in your user directory:

```
# %UserProfile%\.wslconfig (e.g. C:\Users\your-username\.wslconfig)
[wsl2]
memory=24GB       # Docker maximum memory (minimum 16GB, recommended 24~32GB)
processors=8      # CPU core count (per physical cores)
swap=4GB
```

After saving, run `wsl --shutdown` in PowerShell and restart Docker Desktop for it to take effect.

> ✅ Verify: the Docker Desktop status bar shows "Engine running" (green).

## 2.2 Prepare the Directory Structure

```
# PowerShell
mkdir deepchat-updates
```

```
C:\ai-platform\windows\          # assumed deployment root directory
├─ docker-compose.yml           # core service orchestration
├─ .env.windows                 # environment variables (fill in API Key)
├─ litellm-config.yaml          # LiteLLM PII redaction configuration
├─ deepchat-updates\            # DeepChat installer hosting directory
├─ admin-portal\                # AI Admin Center implementation
├─ mcp-gateway\                 # Skill / MCP gateway
├─ monitoring\                  # Prometheus / Loki configuration
└─ scripts\                     # backup / restore / health check / init scripts
```

## 2.3 Create the Docker Shared Network

```
docker network create ai-platform
docker network ls | findstr ai-platform   # verify
```

> All core containers reach each other by container name over the `ai-platform` network (e.g., NewAPI reaches LiteLLM via `http://litellm:4000`, not through localhost).

## 2.4 Fix the Host Machine's Intranet IP (important)

When the host machine uses WiFi, its IP is dynamically assigned by DHCP and changes on reboot or lease expiry; when it changes, all the addresses employees use to access products break. It is recommended to set up **DHCP reservation (MAC binding)** on the router:

1. Find the WiFi adapter MAC: `ipconfig /all`, locate the physical address of "Wireless LAN adapter WLAN" (e.g. `60-A3-E3-41-8F-61`);

2. Log in to the router admin (e.g. `http://192.168.31.1`) → LAN settings / DHCP static IP assignment;

3. Add a rule: MAC → IP (e.g. `192.168.31.117`), save;

4. Reconnect WiFi to confirm the IP is fixed.

> ✅ DHCP reservation is more stable than setting a static IP in Windows (centrally managed by the router, no conflicts).

## 2.5 Open Up the Network (the step most likely to get stuck)

- **Can reach Docker image registries**: Docker Hub / quay.io / ghcr.io. If not reachable, first configure an image accelerator (e.g. DaoCloud).

- **Can reach GitHub**: clone repositories and pull public dependencies. If not reachable, use a proxy or download the source packages in advance.

- **The target machine is reachable from the intranet**: confirm the network segment to be exposed is reachable.

---

[← Chapter 1: Platform Overview and Architecture](ch01-overview.md) · [📖 Index](index.md) · [Chapter 3: Configuration Files and Environment Variables →](ch03-env.md)
