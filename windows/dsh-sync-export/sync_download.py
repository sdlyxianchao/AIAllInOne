#!/usr/bin/env python3
import json, os, sys, urllib.request, datetime, time, subprocess, tarfile, io, socket, re

BASE = os.environ.get('UPDATE_ROOT', '/tmp/dsh-sync-output')
CONFIG_PATH = os.environ.get('SYNC_CONFIG', 'sync-config.json')
REPO = 'dataelement/dsh-desktop'
UPDATE_SERVER_CONTAINER = os.environ.get('UPDATE_SERVER_CONTAINER', 'update-server')
ADMIN_PORTAL_URL = os.environ.get('ADMIN_PORTAL_URL', 'http://admin-portal:3000')
_started_at = datetime.datetime.now().isoformat()

class UnixSocketHTTPConnection:
    """HTTP connection via Unix socket"""
    def __init__(self, socket_path, timeout=30):
        self.socket_path = socket_path
        self.timeout = timeout
        self.sock = None
    
    def request(self, method, path, body=None, headers=None):
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect(self.socket_path)
        
        if headers is None:
            headers = {}
        
        request = f"{method} {path} HTTP/1.1\r\n"
        request += f"Host: localhost\r\n"
        for key, value in headers.items():
            request += f"{key}: {value}\r\n"
        if body:
            request += f"Content-Length: {len(body)}\r\n"
        request += "\r\n"
        
        self.sock.sendall(request.encode())
        if body:
            self.sock.sendall(body)
    
    def getresponse(self):
        response = b""
        while True:
            chunk = self.sock.recv(4096)
            if not chunk:
                break
            response += chunk
            if b"\r\n\r\n" in response:
                break
        
        header_end = response.find(b"\r\n\r\n")
        header = response[:header_end].decode()
        body = response[header_end+4:]
        
        status_line = header.split("\r\n")[0]
        status_code = int(status_line.split(" ")[1])
        
        return type('Response', (), {'status': status_code, 'read': lambda: body})()
    
    def close(self):
        if self.sock:
            self.sock.close()

def update_progress(phase, status='running', total_files=0, done_files=0, total_mb=0, done_mb=0, detail=''):
    global _started_at
    progress_path = os.path.join(BASE, 'dsh', 'sync-progress.json')
    os.makedirs(os.path.dirname(progress_path), exist_ok=True)
    progress = {
        'phase': phase, 'status': status,
        'total_files': total_files, 'done_files': done_files,
        'total_mb': round(total_mb, 2), 'done_mb': round(done_mb, 2),
        'started_at': _started_at, 'elapsed_s': 0, 'eta_s': None,
        'failed': [], 'detail': detail
    }
    with open(progress_path, 'w', encoding='utf-8') as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)
    copy_to_update_server(progress_path, '/usr/share/nginx/html/dsh/sync-progress.json')

def copy_to_update_server(local_path, container_dest):
    """Copy file to update-server container using Docker API via Unix socket"""
    try:
        tar_stream = io.BytesIO()
        with tarfile.open(fileobj=tar_stream, mode='w') as tar:
            arcname = os.path.basename(container_dest)
            tar.add(local_path, arcname=arcname)
        tar_stream.seek(0)
        
        conn = UnixSocketHTTPConnection('/var/run/docker.sock', timeout=30)
        container_dest_dir = os.path.dirname(container_dest)
        conn.request('PUT', f'/containers/{UPDATE_SERVER_CONTAINER}/archive?path={container_dest_dir}', 
                    body=tar_stream.read(),
                    headers={'Content-Type': 'application/x-tar'})
        resp = conn.getresponse()
        if resp.status == 200:
            print(f'[dsh-sync] Copied {local_path} to update-server:{container_dest}')
        else:
            print(f'[dsh-sync] Failed to copy: {resp.status} {resp.read().decode()}')
        conn.close()
    except Exception as e:
        print(f'[dsh-sync] Failed to copy {local_path}: {e}')

def copy_dir_to_update_server(local_dir, container_dest):
    """Copy directory contents to update-server container using Docker API via Unix socket"""
    try:
        tar_stream = io.BytesIO()
        with tarfile.open(fileobj=tar_stream, mode='w') as tar:
            for root, dirs, files in os.walk(local_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, local_dir)
                    tar.add(file_path, arcname=arcname)
        tar_stream.seek(0)
        
        conn = UnixSocketHTTPConnection('/var/run/docker.sock', timeout=60)
        conn.request('PUT', f'/containers/{UPDATE_SERVER_CONTAINER}/archive?path={container_dest}', 
                    body=tar_stream.read(),
                    headers={'Content-Type': 'application/x-tar'})
        resp = conn.getresponse()
        if resp.status == 200:
            print(f'[dsh-sync] Copied {local_dir} to update-server:{container_dest}')
        else:
            print(f'[dsh-sync] Failed to copy: {resp.status} {resp.read().decode()}')
        conn.close()
    except Exception as e:
        print(f'[dsh-sync] Failed to copy {local_dir}: {e}')

def delete_from_update_server(container_path):
    """Delete file/dir from update-server container using Docker API"""
    try:
        conn = UnixSocketHTTPConnection('/var/run/docker.sock', timeout=30)
        conn.request('DELETE', f'/containers/{UPDATE_SERVER_CONTAINER}/archive?path={container_path}')
        resp = conn.getresponse()
        if resp.status == 200:
            print(f'[dsh-sync] Deleted {container_path} from update-server')
        else:
            print(f'[dsh-sync] Failed to delete {container_path}: {resp.status}')
        conn.close()
    except Exception as e:
        print(f'[dsh-sync] Failed to delete {container_path}: {e}')

def update_ghost_page(version, date, files, all_versions=None):
    """Update Ghost DSH Desktop page with new version info"""
    try:
        url = f'{ADMIN_PORTAL_URL}/api/ghost/update-dsh-page'
        data = json.dumps({
            'version': version,
            'date': date,
            'files': files,
            'all_versions': all_versions or []
        }).encode('utf-8')
        
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=30) as r:
            result = json.loads(r.read().decode('utf-8'))
            print(f'[dsh-sync] Ghost page updated: {result}')
            return True
    except Exception as e:
        print(f'[dsh-sync] Failed to update Ghost page: {e}')
        return False

def load_config():
    with open(CONFIG_PATH, encoding='utf-8') as f:
        return json.load(f)

def fetch_json(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'dsh-sync', 'Accept': 'application/vnd.github+json'})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode('utf-8'))
        except Exception as e:
            print(f'[dsh-sync] Attempt {attempt+1}/{retries} failed: {e}')
            if attempt < retries - 1:
                time.sleep(5)
            else:
                raise

def download(url, dest, retries=2):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'dsh-sync'})
            with urllib.request.urlopen(req, timeout=600) as r:
                total_size = int(r.headers.get('Content-Length', 0))
                downloaded = 0
                start_time = time.time()
                with open(dest, 'wb') as f:
                    while True:
                        chunk = r.read(8192)
                        if not chunk:
                            break
                        f.write(chunk)
                        downloaded += len(chunk)
                        elapsed = time.time() - start_time
                        speed = downloaded / elapsed if elapsed > 0 else 0
                        update_progress(
                            phase='downloading', status='running',
                            total_files=1, done_files=0,
                            total_mb=total_size / (1024 * 1024),
                            done_mb=downloaded / (1024 * 1024),
                            detail=f'Downloading: {downloaded/(1024*1024):.1f}/{total_size/(1024*1024):.1f} MB'
                        )
                return
        except Exception as e:
            print(f'[dsh-sync] Download attempt {attempt+1}/{retries} failed: {e}')
            if attempt < retries - 1:
                time.sleep(5)
            else:
                raise

def read_local_versions():
    """Read all versions - try local file, then admin-portal API, then Docker API"""
    # 1. Try local file first
    try:
        versions_path = os.path.join(BASE, 'dsh', 'versions.json')
        if os.path.exists(versions_path):
            with open(versions_path, encoding='utf-8') as f:
                data = json.load(f)
                versions = data.get('versions', [])
                if versions:
                    return versions
    except:
        pass
    
    # 2. Try admin-portal API (no auth required, works from any container)
    try:
        url = f'{ADMIN_PORTAL_URL}/api/gitea/sync/versions-internal'
        req = urllib.request.Request(url, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode('utf-8'))
            versions = data.get('versions', [])
            if versions:
                print(f'[dsh-sync] Read {len(versions)} versions from admin-portal API')
                return versions
    except Exception as e:
        print(f'[dsh-sync] Failed to read versions from admin-portal: {e}')
    
    # 3. Try Docker API as fallback
    try:
        conn = UnixSocketHTTPConnection('/var/run/docker.sock', timeout=10)
        exec_body = json.dumps({'Cmd': ['cat', '/usr/share/nginx/html/dsh/versions.json'], 'AttachStdout': True, 'AttachStderr': True})
        conn.request('POST', f'/containers/{UPDATE_SERVER_CONTAINER}/exec', body=exec_body.encode(), headers={'Content-Type': 'application/json'})
        exec_resp = conn.getresponse()
        if exec_resp.status == 201:
            exec_data = json.loads(exec_resp.read())
            exec_id = exec_data.get('Id')
            conn2 = UnixSocketHTTPConnection('/var/run/docker.sock', timeout=10)
            conn2.request('POST', f'/exec/{exec_id}/start', body=b'{"Detach":false,"Tty":false}', headers={'Content-Type': 'application/json'})
            start_resp = conn2.getresponse()
            if start_resp.status == 200:
                output = start_resp.read().decode('utf-8', errors='ignore')
                json_start = output.find('{')
                if json_start >= 0:
                    data = json.loads(output[json_start:])
                    return data.get('versions', [])
        conn.close()
    except Exception as e:
        print(f'[dsh-sync] Failed to read versions from Docker API: {e}')
    
    return []

def get_latest_version(versions):
    """Get the latest version from versions list"""
    if not versions:
        return None
    def version_key(v):
        m = re.match(r'v?(\d+)\.(\d+)\.(\d+)', v.get('version', ''))
        if m:
            return tuple(map(int, m.groups()))
        return (0, 0, 0)
    
    sorted_versions = sorted(versions, key=version_key, reverse=True)
    return sorted_versions[0] if sorted_versions else None

def cleanup_old_versions(versions, keep_releases):
    """Remove old versions beyond keep_releases limit"""
    if len(versions) <= keep_releases:
        return versions
    
    def version_key(v):
        m = re.match(r'v?(\d+)\.(\d+)\.(\d+)', v.get('version', ''))
        if m:
            return tuple(map(int, m.groups()))
        return (0, 0, 0)
    
    sorted_versions = sorted(versions, key=version_key, reverse=True)
    to_keep = sorted_versions[:keep_releases]
    to_remove = sorted_versions[keep_releases:]
    
    for v in to_remove:
        ver = v.get('version', '')
        if ver:
            print(f'[dsh-sync] Removing old version: {ver}')
            delete_from_update_server(f'/usr/share/nginx/html/dsh/{ver}')
    
    return to_keep

def main():
    print('[dsh-sync] Starting sync...')
    update_progress(phase='starting', status='running', detail='Starting sync...')
    cfg = load_config()
    platforms = cfg.get('platforms', {})
    prefix = cfg.get('download_prefix', '')
    repo = cfg.get('repo', REPO)
    keep_releases = cfg.get('keep_releases', 3)
    print(f'[dsh-sync] Config loaded, repo={repo}, platforms={list(platforms.keys())}, keep_releases={keep_releases}')

    update_progress(phase='connecting_github', status='running', detail='Connecting to GitHub...')
    api_url = f'https://api.github.com/repos/{repo}/releases/latest'
    print(f'[dsh-sync] Fetching {api_url}')
    rel = fetch_json(api_url)
    latest = rel.get('tag_name', '').lstrip('v')
    assets = {a['name']: a['browser_download_url'] for a in rel.get('assets', [])}
    print(f'[dsh-sync] Latest version: {latest}')

    update_progress(phase='checking_version', status='running', detail=f'Checking version: {latest}')
    
    # Read existing versions (from admin-portal API or Docker API)
    existing_versions = read_local_versions()
    latest_version_info = get_latest_version(existing_versions)
    local = latest_version_info.get('version', '').lstrip('v') if latest_version_info else ''
    print(f'[dsh-sync] Local version: {local}, existing versions: {[v.get("version") for v in existing_versions]}')

    if not local or _newer(latest, local):
        print(f'[dsh-sync] New version available, downloading...')
        
        dsh_dir = os.path.join(BASE, 'dsh')
        version_dir = os.path.join(dsh_dir, f'v{latest}')
        os.makedirs(version_dir, exist_ok=True)
        
        files = {}
        total_files = len(platforms)
        done_files = 0
        for plat, fname in platforms.items():
            url = assets.get(fname)
            if not url:
                print(f'[dsh-sync] No asset found for {fname}')
                continue
            if prefix:
                url = prefix + url
            dest = os.path.join(version_dir, fname)
            update_progress(phase='downloading', status='running',
                total_files=total_files, done_files=done_files,
                detail=f'Downloading {fname} ({done_files+1}/{total_files})')
            print(f'[dsh-sync] Downloading {fname}...')
            download(url, dest)
            files[plat] = fname
            done_files += 1
            print(f'[dsh-sync] Downloaded {fname} ({latest})')

        update_progress(phase='updating_page', status='running', detail='Updating version info...')
        
        # Update versions list - preserve existing versions!
        new_version_entry = {
            'version': f'v{latest}',
            'date': datetime.date.today().isoformat(),
            'files': files
        }
        
        existing_versions = [v for v in existing_versions if v.get('version') != f'v{latest}']
        existing_versions.insert(0, new_version_entry)
        existing_versions = cleanup_old_versions(existing_versions, keep_releases)
        
        versions_path = os.path.join(dsh_dir, 'versions.json')
        with open(versions_path, 'w', encoding='utf-8') as f:
            json.dump({'versions': existing_versions}, f, ensure_ascii=False, indent=2)
        
        with open(os.path.join(BASE, 'version.txt'), 'w', encoding='utf-8') as f:
            f.write(f'v{latest}')

        hist_path = os.path.join(dsh_dir, 'sync-history.json')
        hist = []
        # 先从 update-server 读取已有历史
        try:
            url = f'{ADMIN_PORTAL_URL}/api/gitea/sync/history-internal'
            req = urllib.request.Request(url, headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=10) as r:
                data = json.loads(r.read().decode('utf-8'))
                hist = data.get('history', [])
        except Exception as e:
            print(f'[dsh-sync] Failed to read history from admin-portal: {e}')
            # 尝试从本地文件读取
            try:
                with open(hist_path, encoding='utf-8') as f:
                    hist = json.load(f)
            except (OSError, ValueError):
                pass
        # 写入前端期望的格式：{time, status, detail, version, date}
        hist.insert(0, {
            'time': datetime.datetime.now().isoformat(),
            'status': 'success',
            'detail': f'Synced v{latest} ({len(files)} files)',
            'version': f'v{latest}',
            'date': datetime.date.today().isoformat()
        })
        with open(hist_path, 'w', encoding='utf-8') as f:
            json.dump(hist, f, ensure_ascii=False, indent=2)

        print('[dsh-sync] Copying files to update-server...')
        copy_dir_to_update_server(version_dir, f'/usr/share/nginx/html/dsh/v{latest}')
        copy_to_update_server(versions_path, '/usr/share/nginx/html/dsh/versions.json')
        copy_to_update_server(os.path.join(BASE, 'version.txt'), '/usr/share/nginx/html/version.txt')
        copy_to_update_server(hist_path, '/usr/share/nginx/html/dsh/sync-history.json')

        # Update Ghost page with ALL versions
        print('[dsh-sync] Updating Ghost page...')
        update_ghost_page(
            version=f'v{latest}',
            date=datetime.date.today().isoformat(),
            files=files,
            all_versions=existing_versions
        )

        print(f'[dsh-sync] Updated to v{latest}, total versions: {len(existing_versions)}')
        update_progress(phase='done', status='done', total_files=total_files, done_files=done_files, detail=f'Sync complete: v{latest}')
    else:
        print(f'[dsh-sync] No update (local={local}, latest={latest})')
        update_progress(phase='no_change', status='done', detail=f'No new version (local={local}, latest={latest})')
    
    # 每次同步都记录到 sync-history（无论是否有新版本）
    try:
        hist_path = os.path.join(BASE, 'dsh', 'sync-history.json')
        hist = []
        try:
            url = f'{ADMIN_PORTAL_URL}/api/gitea/sync/history-internal'
            req = urllib.request.Request(url, headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=10) as r:
                data = json.loads(r.read().decode('utf-8'))
                hist = data.get('history', [])
        except:
            try:
                with open(hist_path, encoding='utf-8') as f:
                    hist = json.load(f)
            except:
                pass
        
        has_update = not local or _newer(latest, local)
        hist.insert(0, {
            'time': datetime.datetime.now().isoformat(),
            'status': 'success',
            'detail': f'New version v{latest} synced' if has_update else f'No update (latest: v{latest})',
            'version': f'v{latest}',
            'date': datetime.date.today().isoformat()
        })
        
        os.makedirs(os.path.dirname(hist_path), exist_ok=True)
        with open(hist_path, 'w', encoding='utf-8') as f:
            json.dump(hist, f, ensure_ascii=False, indent=2)
        copy_to_update_server(hist_path, '/usr/share/nginx/html/dsh/sync-history.json')
        print(f'[dsh-sync] Sync history updated')
    except Exception as e:
        print(f'[dsh-sync] Failed to update sync history: {e}')

def _newer(a, b):
    pa = re.match(r'(\d+)\.(\d+)\.(\d+)', a or '')
    pb = re.match(r'(\d+)\.(\d+)\.(\d+)', b or '')
    if not pa or not pb:
        return False
    return tuple(map(int, pa.groups())) > tuple(map(int, pb.groups()))

if __name__ == '__main__':
    main()
