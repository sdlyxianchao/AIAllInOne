#!/usr/bin/env python3
"""
DSH Desktop Sync Script
=======================
Checks GitHub for new DSH Desktop releases, downloads installers,
deploys to update-server nginx, updates Ghost page and Admin Center.

Runs in: Gitea Actions container (with docker.sock + volume mounted)
Also works: manually on host machine

Environment variables:
  UPDATE_ROOT       - Persistent storage for downloaded files (default: /tmp/dsh-sync-output)
  SYNC_CONFIG       - Path to sync-config.json (default: sync-config.json)
  UPDATE_SERVER     - Update server container name (default: update-server)
  ADMIN_PORTAL      - Admin portal container name (default: admin-portal)
  DOCKER_SOCK       - Docker socket path (default: auto-detect)
"""

import json, os, sys, urllib.request, datetime, time, tarfile, io, socket, re, glob

# ── Config ──────────────────────────────────────────────────────────
BASE = os.environ.get('UPDATE_ROOT', '/tmp/dsh-sync-output')
CONFIG_PATH = os.environ.get('SYNC_CONFIG', 'sync-config.json')
UPDATE_SERVER = os.environ.get('UPDATE_SERVER', 'update-server')
ADMIN_PORTAL = os.environ.get('ADMIN_PORTAL', 'admin-portal')
DOCKER_SOCK = os.environ.get('DOCKER_SOCK', '')

# Auto-detect Docker socket
if not DOCKER_SOCK:
    if os.path.exists('/var/run/docker.sock'):
        DOCKER_SOCK = '/var/run/docker.sock'
    elif os.path.exists('//./pipe/docker_engine'):
        DOCKER_SOCK = '//./pipe/docker_engine'

STARTED_AT = datetime.datetime.now().isoformat()
LOG_LINES = []  # Collect all log lines for Admin Center


# ── Logging ─────────────────────────────────────────────────────────
def log(msg, level='info'):
    ts = datetime.datetime.now().strftime('%H:%M:%S')
    line = f'[{ts}] [{level.upper()}] {msg}'
    print(line, flush=True)
    LOG_LINES.append({'time': ts, 'level': level, 'msg': msg})


# ── Docker Socket HTTP ──────────────────────────────────────────────
class DockerSocket:
    """Minimal HTTP client over Docker Unix socket or Windows named pipe."""
    def __init__(self, timeout=60):
        self.timeout = timeout

    def call(self, method, path, body=b'', headers=None):
        """Send request and return (status_code, response_body)."""
        headers = headers or {}
        if isinstance(body, str):
            body = body.encode()
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        sock.settimeout(self.timeout)
        try:
            sock.connect(DOCKER_SOCK)
            req = f'{method} {path} HTTP/1.1\r\nHost: localhost\r\n'
            for k, v in headers.items():
                req += f'{k}: {v}\r\n'
            if method in ('GET', 'HEAD'):
                req += 'Connection: close\r\n\r\n'
                sock.sendall(req.encode())
            else:
                req += f'Content-Length: {len(body)}\r\nConnection: close\r\n\r\n'
                sock.sendall(req.encode() + body)
            # Read full response
            data = b''
            while True:
                try:
                    chunk = sock.recv(65536)
                    if not chunk:
                        break
                    data += chunk
                except socket.timeout:
                    break
            if not data:
                return 0, b''
            header_end = data.find(b'\r\n\r\n')
            header = data[:header_end].decode()
            status_code = int(header.split('\r\n')[0].split(' ')[1])
            resp_body = data[header_end + 4:]
            return status_code, resp_body
        finally:
            sock.close()


# ── Progress & History ──────────────────────────────────────────────
def write_progress(phase, status='running', detail='', **kw):
    path = os.path.join(BASE, 'dsh', 'sync-progress.json')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    elapsed = (datetime.datetime.now() - datetime.datetime.fromisoformat(STARTED_AT)).total_seconds()
    obj = {'phase': phase, 'status': status, 'detail': detail,
           'started_at': STARTED_AT, 'elapsed_s': round(elapsed, 1),
           'logs': LOG_LINES[-20:]}  # Keep last 20 log lines
    obj.update(kw)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    deploy_file_to_nginx(path, '/usr/share/nginx/html/dsh/sync-progress.json')


def add_history(status, detail, version=''):
    path = os.path.join(BASE, 'dsh', 'sync-history.json')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    hist = []
    if os.path.exists(path):
        try:
            with open(path, encoding='utf-8') as f:
                hist = json.load(f)
        except:
            pass
    hist.insert(0, {
        'time': datetime.datetime.now().isoformat(),
        'status': status, 'detail': detail,
        'version': version, 'date': datetime.date.today().isoformat()
    })
    hist = hist[:20]
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(hist, f, ensure_ascii=False, indent=2)
    deploy_file_to_nginx(path, '/usr/share/nginx/html/dsh/sync-history.json')


# ── Docker API helpers ──────────────────────────────────────────────
def deploy_file_to_nginx(local_path, nginx_dest):
    """Copy a single file to update-server container via Docker API.
    Uses curl (already installed in container) for reliable large file upload."""
    if not DOCKER_SOCK:
        log(f'No Docker socket, skip deploy {os.path.basename(local_path)}', 'warn')
        return False
    fname = os.path.basename(local_path)
    dest_dir = os.path.dirname(nginx_dest)
    tar_path = local_path + '.tar'
    try:
        # 1. Create tar archive
        with tarfile.open(tar_path, 'w') as tar:
            tar.add(local_path, arcname=fname)
        # 2. Upload via curl over Unix socket
        import subprocess
        result = subprocess.run([
            'curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
            '--unix-socket', DOCKER_SOCK,
            '-X', 'PUT',
            '-H', 'Content-Type: application/x-tar',
            '--data-binary', f'@{tar_path}',
            f'http://localhost/containers/{UPDATE_SERVER}/archive?path={dest_dir}'
        ], capture_output=True, text=True, timeout=300)
        code = int(result.stdout.strip()) if result.stdout.strip().isdigit() else 0
        if code == 200:
            log(f'Deployed {fname} → update-server:{nginx_dest}')
            return True
        else:
            log(f'Deploy failed {fname}: HTTP {code} {result.stderr[:100]}', 'error')
            return False
    except Exception as e:
        log(f'Deploy error {fname}: {e}', 'error')
        return False
    finally:
        if os.path.exists(tar_path):
            os.remove(tar_path)


def deploy_via_wget(url, nginx_dest, timeout_s=600):
    """Download file directly inside update-server container using wget.
    Returns True on success, False on failure."""
    if not DOCKER_SOCK:
        return False
    dest_dir = os.path.dirname(nginx_dest)
    fname = os.path.basename(nginx_dest)
    try:
        # 1. Create exec
        exec_body = json.dumps({
            'Cmd': ['sh', '-c', f'mkdir -p {dest_dir} && wget -q -O "{nginx_dest}" "{url}"'],
            'AttachStdout': True, 'AttachStderr': True
        }).encode()
        code, body = DockerSocket(timeout=60).call(
            'POST', f'/containers/{UPDATE_SERVER}/exec',
            body=exec_body, headers={'Content-Type': 'application/json'})
        if code != 201:
            log(f'wget exec create failed: HTTP {code}', 'error')
            return False
        # body 可能包含 chunked 编码或 multiplexed header，提取JSON部分
        body_text = body.decode('utf-8', errors='ignore')
        json_start = body_text.find('{')
        json_end = body_text.rfind('}')
        if json_start < 0 or json_end < 0:
            log(f'wget exec create: no JSON in response', 'error')
            return False
        exec_id = json.loads(body_text[json_start:json_end + 1]).get('Id')
        if not exec_id:
            log(f'wget exec create: no Id in response', 'error')
            return False

        # 2. Start exec (Detach=true)
        code2, _ = DockerSocket(timeout=30).call(
            'POST', f'/exec/{exec_id}/start',
            body=b'{"Detach":true,"Tty":false}',
            headers={'Content-Type': 'application/json'})
        if code2 != 200:
            log(f'wget exec start failed: HTTP {code2}', 'error')
            return False

        # 3. Poll exec inspect until done
        deadline = time.time() + timeout_s
        while time.time() < deadline:
            time.sleep(5)
            insp_code, insp_body = DockerSocket(timeout=30).call(
                'GET', f'/exec/{exec_id}/json')
            if insp_code == 200:
                insp_text = insp_body.decode('utf-8', errors='ignore')
                json_start = insp_text.find('{')
                json_end = insp_text.rfind('}')
                if json_start < 0 or json_end < 0:
                    continue
                insp = json.loads(insp_text[json_start:json_end + 1])
                if insp.get('Running') is False:
                    exit_code = insp.get('ExitCode', -1)
                    if exit_code == 0:
                        log(f'wget deployed {fname} → update-server:{nginx_dest}')
                        return True
                    else:
                        log(f'wget failed: exit code {exit_code}', 'error')
                        return False
        log(f'wget timeout ({timeout_s}s)', 'error')
        return False
    except Exception as e:
        log(f'wget error: {e}', 'error')
        return False
    except Exception as e:
        log(f'Deploy error {os.path.basename(local_path)}: {e}', 'error')
        return False


def deploy_dir_to_nginx(local_dir, nginx_dest):
    """Copy a directory to update-server container via Docker API.
    Deploys file-by-file to avoid Broken pipe on large tar archives."""
    if not DOCKER_SOCK:
        log(f'No Docker socket, skip deploy dir', 'warn')
        return False
    ok = True
    for root, dirs, files in os.walk(local_dir):
        for fname in files:
            fpath = os.path.join(root, fname)
            arcname = os.path.relpath(fpath, local_dir)
            dest = f'{nginx_dest}/{arcname}'
            if not deploy_file_to_nginx(fpath, dest):
                ok = False
    if ok:
        log(f'Deployed dir → update-server:{nginx_dest}')
    return ok


# ── GitHub API ──────────────────────────────────────────────────────
def fetch_json(url, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'dsh-sync/1.0',
                'Accept': 'application/vnd.github+json'
            })
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.loads(r.read().decode('utf-8'))
        except Exception as e:
            log(f'Fetch {url} attempt {i+1}/{retries}: {e}', 'warn')
            if i < retries - 1:
                time.sleep(5 * (i + 1))
            else:
                raise


def download_file(url, dest, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'dsh-sync/1.0'})
            with urllib.request.urlopen(req, timeout=None) as r:
                total = int(r.headers.get('Content-Length', 0))
                downloaded = 0
                start = time.time()
                with open(dest, 'wb') as f:
                    while True:
                        chunk = r.read(65536)
                        if not chunk:
                            break
                        f.write(chunk)
                        downloaded += len(chunk)
                        elapsed = time.time() - start
                        speed = downloaded / elapsed / 1024 / 1024 if elapsed > 0 else 0
                        if total > 0:
                            pct = downloaded / total * 100
                            log(f'  {os.path.basename(dest)}: {downloaded/1024/1024:.1f}/{total/1024/1024:.1f} MB ({pct:.0f}%) {speed:.1f} MB/s')
            # Verify file size
            fsize = os.path.getsize(dest)
            if fsize == 0:
                raise ValueError(f'Downloaded file is empty: {dest}')
            log(f'  ✓ {os.path.basename(dest)} ({fsize/1024/1024:.1f} MB)')
            return True
        except Exception as e:
            log(f'Download {os.path.basename(dest)} attempt {i+1}/{retries}: {e}', 'warn')
            if i < retries - 1:
                time.sleep(10 * (i + 1))
            else:
                log(f'Failed to download {os.path.basename(dest)} after {retries} attempts', 'error')
                return False


# ── Version helpers ─────────────────────────────────────────────────
def parse_version(v):
    m = re.match(r'v?(\d+)\.(\d+)\.(\d+)', v or '')
    return tuple(map(int, m.groups())) if m else (0, 0, 0)


def newer(a, b):
    return parse_version(a) > parse_version(b)


def scan_local_versions():
    """Scan actual directories to find versions with files."""
    dsh_dir = os.path.join(BASE, 'dsh')
    versions = []
    if not os.path.isdir(dsh_dir):
        return versions
    for entry in sorted(os.listdir(dsh_dir)):
        vpath = os.path.join(dsh_dir, entry)
        if os.path.isdir(vpath) and re.match(r'v\d+\.\d+\.\d+', entry):
            files = os.listdir(vpath)
            if files:
                versions.append({
                    'version': entry,
                    'date': datetime.date.fromtimestamp(os.path.getmtime(vpath)).isoformat(),
                    'files': {f.replace('dsh-desktop-', '').replace('-setup.exe', '').replace('.dmg', ''): f for f in files}
                })
    return sorted(versions, key=lambda v: parse_version(v['version']), reverse=True)


def load_versions_json():
    """Load versions.json — try update-server first (authoritative), then local file."""
    # 1. Try update-server directly (most authoritative)
    if DOCKER_SOCK:
        try:
            content = docker_exec_read('/usr/share/nginx/html/dsh/versions.json')
            if content:
                data = json.loads(content)
                versions = data.get('versions', [])
                if versions:
                    log(f'Read {len(versions)} versions from update-server')
                    return versions
        except Exception as e:
            log(f'Failed to read versions from update-server: {e}', 'warn')

    # 2. Try local file (no strict directory filter — avoid losing versions)
    path = os.path.join(BASE, 'dsh', 'versions.json')
    if os.path.exists(path):
        try:
            with open(path, encoding='utf-8') as f:
                data = json.load(f)
                versions = data.get('versions', [])
                if versions:
                    return versions
        except:
            pass

    return scan_local_versions()


def docker_exec_read(container_path):
    """Read a file from a container via Docker exec API.

    Docker exec with Tty=false returns multiplexed stream (8-byte header per frame):
    - byte 0: stream type (1=stdout, 2=stderr)
    - bytes 1-3: padding
    - bytes 4-7: payload length (big-endian uint32)
    - bytes 8..8+length-1: payload
    """
    try:
        exec_body = json.dumps({
            'Cmd': ['cat', container_path],
            'AttachStdout': True, 'AttachStderr': True
        }).encode()
        s = DockerSocket(timeout=15)
        code, body = s.call('POST', f'/containers/{UPDATE_SERVER}/exec',
                            body=exec_body, headers={'Content-Type': 'application/json'})
        if code != 201:
            return None
        exec_id = json.loads(body).get('Id')
        s2 = DockerSocket(timeout=30)
        code2, out = s2.call('POST', f'/exec/{exec_id}/start',
                              body=b'{"Detach":false,"Tty":false}',
                              headers={'Content-Type': 'application/json'})
        if code2 != 200 or not out:
            return None
        # 循环解析所有 multiplexed 帧
        stdout_parts = []
        i = 0
        while i + 8 <= len(out):
            stream_type = out[i]
            length = int.from_bytes(out[i + 4:i + 8], 'big')
            payload = out[i + 8:i + 8 + length]
            if stream_type == 1:  # stdout
                stdout_parts.append(payload)
            i += 8 + length
        if stdout_parts:
            return b''.join(stdout_parts).decode('utf-8', errors='ignore')
        # Fallback: 不是 multiplexed 格式
        return out.decode('utf-8', errors='ignore')
    except:
        pass
    return None


def save_versions_json(versions):
    path = os.path.join(BASE, 'dsh', 'versions.json')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump({'versions': versions}, f, ensure_ascii=False, indent=2)


# ── Ghost page update ───────────────────────────────────────────────
def update_ghost(version, date, files, all_versions):
    """Update Ghost DSH download page via admin-portal internal API."""
    try:
        url = f'http://{ADMIN_PORTAL}:3000/api/ghost/update-dsh-page'
        data = json.dumps({
            'version': version, 'date': date,
            'files': files, 'all_versions': all_versions
        }).encode()
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=30) as r:
            result = json.loads(r.read().decode())
            log(f'Ghost page updated to {version}')
            return True
    except Exception as e:
        log(f'Ghost page update failed: {e}', 'warn')
        return False


# ── GitHub releases listing ─────────────────────────────────────────
def list_github_releases(repo, count=20):
    """Fetch all releases from GitHub, return list of {tag, date, assets}."""
    releases = []
    page = 1
    while len(releases) < count:
        url = f'https://api.github.com/repos/{repo}/releases?per_page=100&page={page}'
        data = fetch_json(url)
        if not data:
            break
        for r in data:
            if r.get('draft'):
                continue
            releases.append({
                'tag': r.get('tag_name', ''),
                'version': r.get('tag_name', '').lstrip('v'),
                'date': r.get('published_at', '')[:10],
                'prerelease': r.get('prerelease', False),
                'assets': [{
                    'name': a['name'],
                    'size': a['size'],
                    'url': a['browser_download_url']
                } for a in r.get('assets', [])]
            })
            if len(releases) >= count:
                break
        page += 1
    return releases


def sync_specific_version(repo, version, platforms, targets, prefix=''):
    """Download a specific version from GitHub and deploy."""
    version_clean = version.lstrip('v')
    log(f'Syncing specific version: v{version_clean}')

    # Find the release
    url = f'https://api.github.com/repos/{repo}/releases/tags/v{version_clean}'
    try:
        rel = fetch_json(url)
    except:
        # Try without v prefix
        url = f'https://api.github.com/repos/{repo}/releases/tags/{version_clean}'
        try:
            rel = fetch_json(url)
        except Exception as e:
            log(f'Release not found: v{version_clean} — {e}', 'error')
            return False

    assets = {a['name']: a['browser_download_url'] for a in rel.get('assets', [])}
    log(f'Found release: {rel.get("tag_name")} ({len(assets)} assets)')

    dsh_dir = os.path.join(BASE, 'dsh')
    version_dir = os.path.join(dsh_dir, f'v{version_clean}')
    os.makedirs(version_dir, exist_ok=True)

    downloaded_files = {}
    total = len(targets)
    for idx, plat in enumerate(targets):
        fname = platforms.get(plat)
        if not fname:
            continue
        dl_url = assets.get(fname)
        if not dl_url:
            log(f'Asset not found: {fname}', 'warn')
            continue
        if prefix:
            dl_url = prefix + dl_url
        nginx_dest = f'/usr/share/nginx/html/dsh/v{version_clean}/{fname}'
        local_dest = os.path.join(version_dir, fname)
        # Skip if already downloaded locally
        if os.path.exists(local_dest) and os.path.getsize(local_dest) > 0:
            log(f'  Already exists locally: {fname} ({os.path.getsize(local_dest)/1024/1024:.1f} MB)')
            downloaded_files[plat] = fname
            continue
        log(f'Downloading [{idx+1}/{total}] {fname}...')
        write_progress('downloading', detail=f'Downloading {fname} ({idx+1}/{total})')
        # 方案A: 在 update-server 容器内直接 wget（避免大文件通过 Docker tar API 的 Broken pipe）
        if deploy_via_wget(dl_url, nginx_dest, timeout_s=600):
            downloaded_files[plat] = fname
            log(f'  ✓ {fname} deployed via wget')
        else:
            # 方案B: 本地下载 + tar deploy（fallback）
            log(f'  wget failed, falling back to local download + tar...', 'warn')
            if download_file(dl_url, local_dest):
                if deploy_file_to_nginx(local_dest, nginx_dest):
                    downloaded_files[plat] = fname
                    log(f'  ✓ {fname} deployed via tar')
                else:
                    log(f'  ✗ {fname} tar deploy also failed', 'error')

    if not downloaded_files:
        log('No files downloaded', 'error')
        return False

    log(f'Downloaded {len(downloaded_files)}/{total} platform files')

    # Update versions.json — 以 update-server 为权威，合并新版本
    remote_versions = load_versions_json()
    log(f'Base versions before merge: {[v["version"] for v in remote_versions]}')

    new_entry = {
        'version': f'v{version_clean}',
        'date': datetime.date.today().isoformat(),
        'files': downloaded_files
    }
    merged = [v for v in remote_versions if v['version'] != f'v{version_clean}']
    merged.insert(0, new_entry)
    merged.sort(key=lambda v: parse_version(v['version']), reverse=True)
    save_versions_json(merged)
    log(f'Merged versions: {[v["version"] for v in merged]}')

    # Deploy versions.json（小文件，用 tar API）
    deploy_ok = True
    versions_json_path = os.path.join(BASE, 'dsh', 'versions.json')
    if not deploy_file_to_nginx(versions_json_path, '/usr/share/nginx/html/dsh/versions.json'):
        deploy_ok = False
    log(f'Deployed versions.json: {[v["version"] for v in merged]}')

    # Update Ghost page（传合并后的完整列表，确保历史完整）
    update_ghost(
        version=f'v{version_clean}',
        date=datetime.date.today().isoformat(),
        files=downloaded_files,
        all_versions=merged
    )

    status = 'success' if deploy_ok else 'partial'
    detail = f'v{version_clean} synced ({len(downloaded_files)} files)' + ('' if deploy_ok else ' — deploy failed')
    add_history(status, detail, f'v{version_clean}')

    write_progress('done', status='done', detail=f'Sync complete: v{version_clean}')
    log(f'✅ v{version_clean} synced: {list(downloaded_files.values())}')
    return True


# ── Main ────────────────────────────────────────────────────────────
def main():
    import argparse
    parser = argparse.ArgumentParser(description='DSH Desktop Sync')
    parser.add_argument('--list-releases', action='store_true', help='List all GitHub releases (JSON output)')
    parser.add_argument('--sync-version', type=str, help='Sync a specific version (e.g. 0.7.1 or v0.7.1)')
    parser.add_argument('--count', type=int, default=20, help='Number of releases to list (default: 20)')
    args = parser.parse_args()

    log('='*50)
    log('DSH Desktop Sync — Starting')
    log(f'UPDATE_ROOT: {BASE}')
    log(f'Docker socket: {DOCKER_SOCK or "NOT FOUND"}')
    log('='*50)

    # Load config
    try:
        with open(CONFIG_PATH, encoding='utf-8') as f:
            cfg = json.load(f)
    except Exception as e:
        log(f'Failed to load config: {e}', 'error')
        sys.exit(1)

    repo = cfg.get('repo', 'dataelement/dsh-desktop')
    platforms = cfg.get('platforms', {})
    targets = cfg.get('targets', list(platforms.keys()))
    keep = cfg.get('keep_releases', 5)
    prefix = cfg.get('download_prefix', '')

    # ── Mode: List releases ─────────────────────────────────────────
    if args.list_releases:
        log(f'Fetching releases from {repo}...')
        releases = list_github_releases(repo, args.count)
        # Merge with local status
        local_versions = load_versions_json()
        local_tags = {v['version'] for v in local_versions}
        for r in releases:
            r['local'] = r['version'] in local_tags or f'v{r["version"]}' in local_tags
        print(json.dumps({'releases': releases, 'local_versions': [v['version'] for v in local_versions]}, indent=2))
        return

    # ── Mode: Sync specific version ─────────────────────────────────
    if args.sync_version:
        write_progress('connecting', detail=f'Syncing version {args.sync_version}...')
        success = sync_specific_version(repo, args.sync_version, platforms, targets, prefix)
        if not success:
            sys.exit(1)
        return

    # ── Mode: Auto-sync latest ──────────────────────────────────────
    write_progress('connecting', detail='Connecting to GitHub...')

    # Fetch latest release
    try:
        rel = fetch_json(f'https://api.github.com/repos/{repo}/releases/latest')
    except Exception as e:
        log(f'Failed to fetch latest release: {e}', 'error')
        write_progress('error', status='error', detail=f'GitHub API error: {e}')
        add_history('error', f'GitHub API error: {e}')
        sys.exit(1)

    latest_tag = rel.get('tag_name', '')
    latest = latest_tag.lstrip('v')
    assets = {a['name']: a['browser_download_url'] for a in rel.get('assets', [])}
    log(f'Latest release: {latest_tag} ({len(assets)} assets)')

    write_progress('checking', detail=f'Latest: {latest}, checking local...')

    # Check local versions
    local_versions = load_versions_json()
    local_latest = local_versions[0]['version'].lstrip('v') if local_versions else ''
    log(f'Local latest: {local_latest or "(none)"}')
    log(f'Local versions: {[v["version"] for v in local_versions]}')

    # Determine if we need to download
    if local_latest and not newer(latest, local_latest):
        log(f'Already up to date ({local_latest})')
        write_progress('done', status='done', detail=f'Already up to date: v{local_latest}')
        add_history('success', f'No update (latest: v{latest})', latest)
        return

    log(f'New version available: v{latest} (local: v{local_latest or "none"})')
    success = sync_specific_version(repo, latest, platforms, targets, prefix)
    if not success:
        sys.exit(1)


if __name__ == '__main__':
    main()
