// Slate — Tauri backend
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use screenshots::Screen;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

// ── Screen sources ────────────────────────────────────────────────────────────

#[derive(Serialize)]
struct CaptureSource {
    id: u32,
    name: String,
    kind: String,
    width: u32,
    height: u32,
}

#[tauri::command]
fn list_capture_sources() -> Vec<CaptureSource> {
    Screen::all()
        .unwrap_or_default()
        .into_iter()
        .enumerate()
        .map(|(i, s)| CaptureSource {
            id: i as u32,
            name: format!("Monitor {}", i + 1),
            kind: "monitor".to_string(),
            width: s.display_info.width,
            height: s.display_info.height,
        })
        .collect()
}

// ── MP4 export ────────────────────────────────────────────────────────────────

#[tauri::command]
async fn convert_to_mp4(webm_path: String) -> Result<String, String> {
    let mp4_path = webm_path.replace(".webm", ".mp4");
    let webm = webm_path.clone();
    let mp4 = mp4_path.clone();

    tauri::async_runtime::spawn_blocking(move || {
        Command::new(ffmpeg_bin())
            .args([
                "-i", &webm,
                "-c:v", "libx264", "-preset", "fast", "-crf", "18",
                "-c:a", "aac", "-b:a", "128k",
                "-y", &mp4,
            ])
            .output()
            .map_err(|e| {
                if e.kind() == std::io::ErrorKind::NotFound {
                    "ffmpeg not found — please reinstall Slate".to_string()
                } else {
                    e.to_string()
                }
            })
            .and_then(|out| {
                if out.status.success() {
                    Ok(mp4)
                } else {
                    let stderr = String::from_utf8_lossy(&out.stderr);
                    Err(stderr.lines().last().unwrap_or("Conversion failed").to_string())
                }
            })
    })
    .await
    .map_err(|e| e.to_string())?
}

// ── RTMP Streaming (supports simultaneous multi-destination) ──────────────────

// stdins are shared between the Tauri command thread and the WebSocket reader thread
type StdinList = Arc<Mutex<Vec<ChildStdin>>>;

struct StreamState {
    children: Vec<Child>,
    stdin_list: StdinList,
    ws_running: Option<Arc<AtomicBool>>,
}

impl Default for StreamState {
    fn default() -> Self {
        Self {
            children: Vec::new(),
            stdin_list: Arc::new(Mutex::new(Vec::new())),
            ws_running: None,
        }
    }
}

/// Returns the path to ffmpeg: bundled copy next to the exe, or falls back to PATH.
fn ffmpeg_bin() -> std::path::PathBuf {
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            let bundled = dir.join("ffmpeg.exe");
            if bundled.exists() { return bundled; }
        }
    }
    std::path::PathBuf::from("ffmpeg")
}

fn spawn_ffmpeg(rtmp_url: &str, bitrate_kbps: u32, fps: u32, copy_video: bool) -> Result<(Child, ChildStdin), String> {
    let ffmpeg = ffmpeg_bin();
    let err_map = |e: std::io::Error| {
        if e.kind() == std::io::ErrorKind::NotFound {
            "ffmpeg not found — please reinstall Slate".to_string()
        } else {
            e.to_string()
        }
    };

    let mut child = if copy_video {
        // WebCodecs path: browser already encoded H.264 into Matroska — just remux, no re-encode
        Command::new(&ffmpeg)
            .args([
                "-fflags", "+nobuffer",
                "-flags", "low_delay",
                "-f", "matroska", "-i", "pipe:0",
                "-c:v", "copy",
                "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
                "-f", "flv", rtmp_url,
            ])
            .stdin(Stdio::piped()).stdout(Stdio::null()).stderr(Stdio::null())
            .spawn().map_err(err_map)?
    } else {
        // VP8 fallback path: re-encode to H.264
        let maxrate = format!("{}k", bitrate_kbps);
        let bufsize = format!("{}k", bitrate_kbps * 2);
        let gop = (fps * 2).to_string();
        Command::new(&ffmpeg)
            .args([
                "-fflags", "+nobuffer",
                "-flags", "low_delay",
                "-f", "matroska", "-i", "pipe:0",
                "-c:v", "libx264", "-preset", "veryfast", "-tune", "zerolatency",
                "-threads", "0",
                "-b:v", &maxrate, "-maxrate", &maxrate, "-bufsize", &bufsize,
                "-pix_fmt", "yuv420p", "-g", &gop, "-sc_threshold", "0",
                "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
                "-f", "flv", rtmp_url,
            ])
            .stdin(Stdio::piped()).stdout(Stdio::null()).stderr(Stdio::null())
            .spawn().map_err(err_map)?
    };

    let stdin = child.stdin.take().ok_or("could not open ffmpeg stdin")?;
    Ok((child, stdin))
}

const WS_PORT: u16 = 9737;

#[tauri::command]
fn start_stream(
    state: tauri::State<Mutex<StreamState>>,
    rtmp_urls: Vec<String>,
    bitrate_kbps: u32,
    fps: u32,
    copy_video: bool,
) -> Result<(), String> {
    let mut s = state.lock().map_err(|e| e.to_string())?;

    // Stop any previous stream
    if let Some(running) = s.ws_running.take() { running.store(false, Ordering::Relaxed); }
    s.stdin_list.lock().map_err(|e| e.to_string())?.clear();
    for mut child in s.children.drain(..) { child.kill().ok(); }

    // Spawn ffmpeg instances
    for url in &rtmp_urls {
        let (child, stdin) = spawn_ffmpeg(url, bitrate_kbps, fps, copy_video)?;
        s.children.push(child);
        s.stdin_list.lock().map_err(|e| e.to_string())?.push(stdin);
    }

    // Bind the WebSocket server synchronously so the port is ready before we return
    let listener = TcpListener::bind(format!("127.0.0.1:{}", WS_PORT))
        .map_err(|e| format!("Could not bind stream IPC port {}: {}", WS_PORT, e))?;
    listener.set_nonblocking(true).map_err(|e| e.to_string())?;

    let running = Arc::new(AtomicBool::new(true));
    let running_clone = Arc::clone(&running);
    let stdin_list_clone = Arc::clone(&s.stdin_list);

    std::thread::spawn(move || {
        // Wait for the JS side to connect (non-blocking accept with polling)
        let stream = loop {
            match listener.accept() {
                Ok((s, _)) => break s,
                Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    if !running_clone.load(Ordering::Relaxed) { return; }
                    std::thread::sleep(std::time::Duration::from_millis(50));
                }
                Err(_) => return,
            }
        };

        // Switch to blocking with a short read timeout so we can check the running flag
        stream.set_nonblocking(false).ok();
        stream.set_read_timeout(Some(std::time::Duration::from_millis(300))).ok();

        let mut ws = match tungstenite::accept(stream) {
            Ok(ws) => ws,
            Err(_) => return,
        };

        while running_clone.load(Ordering::Relaxed) {
            match ws.read() {
                Ok(tungstenite::Message::Binary(data)) => {
                    if let Ok(mut stds) = stdin_list_clone.lock() {
                        for s in stds.iter_mut() { s.write_all(&data).ok(); }
                    }
                }
                Ok(tungstenite::Message::Close(_)) => break,
                // Read timeout: check running flag and continue
                Err(tungstenite::Error::Io(e))
                    if e.kind() == std::io::ErrorKind::WouldBlock
                    || e.kind() == std::io::ErrorKind::TimedOut => {}
                Err(_) => break,
                Ok(_) => {} // ping/pong/text — ignore
            }
        }
    });

    s.ws_running = Some(running);
    Ok(())
}

#[tauri::command]
fn stop_stream(state: tauri::State<Mutex<StreamState>>) -> Result<(), String> {
    let mut s = state.lock().map_err(|e| e.to_string())?;
    // Signal WS thread to stop (it will exit within one read timeout cycle)
    if let Some(running) = s.ws_running.take() { running.store(false, Ordering::Relaxed); }
    // Drop all stdins — this sends EOF to ffmpeg
    s.stdin_list.lock().map_err(|e| e.to_string())?.clear();
    for mut child in s.children.drain(..) { child.wait().ok(); }
    Ok(())
}

// ── OAuth helpers ─────────────────────────────────────────────────────────────

fn open_url(url: &str) {
    #[cfg(target_os = "windows")]
    // cmd.exe treats & as a command separator, stripping everything after the first query param.
    // PowerShell passes the full URL as a literal string, preserving all & chars.
    Command::new("powershell")
        .args(["-NoProfile", "-Command", &format!("Start-Process '{}'", url)])
        .spawn()
        .ok();
    #[cfg(target_os = "macos")]
    Command::new("open").arg(url).spawn().ok();
    #[cfg(target_os = "linux")]
    Command::new("xdg-open").arg(url).spawn().ok();
}

fn read_http_request(stream: &mut TcpStream) -> String {
    stream.set_read_timeout(Some(std::time::Duration::from_secs(180))).ok();
    let mut buf = [0u8; 16384];
    let n = stream.read(&mut buf).unwrap_or(0);
    String::from_utf8_lossy(&buf[..n]).to_string()
}

fn send_html(stream: &mut TcpStream, html: &str) {
    let resp = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        html.len(), html
    );
    stream.write_all(resp.as_bytes()).ok();
}

fn extract_query_param(request: &str, key: &str) -> Option<String> {
    let path = request.lines().next()?.split_whitespace().nth(1)?;
    let query = path.splitn(2, '?').nth(1)?;
    for part in query.split('&') {
        let mut kv = part.splitn(2, '=');
        if kv.next() == Some(key) {
            return kv.next().map(|v| urldecode(v));
        }
    }
    None
}

fn urldecode(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut chars = s.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '%' {
            let h1 = chars.next().unwrap_or('0');
            let h2 = chars.next().unwrap_or('0');
            if let Ok(b) = u8::from_str_radix(&format!("{}{}", h1, h2), 16) {
                out.push(b as char);
            }
        } else if c == '+' {
            out.push(' ');
        } else {
            out.push(c);
        }
    }
    out
}

fn slate_success_page(platform: &str) -> String {
    // Use ##-delimited raw string so "# inside SVG fill attributes doesn't close the literal
    format!(r##"<!DOCTYPE html><html><head><meta charset="utf-8"><title>Connected to Slate</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'%3E%3Crect width='72' height='72' rx='18' fill='%23FF4D4D'/%3E%3Ccircle cx='36' cy='36' r='17' stroke='white' stroke-width='3' fill='none'/%3E%3Ccircle cx='36' cy='36' r='10' stroke='white' stroke-width='2.5' fill='none'/%3E%3Ccircle cx='36' cy='36' r='4' fill='white'/%3E%3Ccircle cx='52' cy='20' r='5' fill='white'/%3E%3Ccircle cx='52' cy='20' r='2.5' fill='%23FF4D4D'/%3E%3C/svg%3E">
<style>*{{margin:0;padding:0;box-sizing:border-box}}body{{background:#0d0d13;color:white;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}}.card{{text-align:center;padding:48px 40px}}.logo{{margin-bottom:28px}}.check{{width:60px;height:60px;border-radius:50%;background:rgba(34,197,94,.12);border:1.5px solid rgba(34,197,94,.3);display:flex;align-items:center;justify-content:center;margin:0 auto 20px}}h1{{font-size:20px;font-weight:700;margin-bottom:6px}}p{{font-size:13px;color:#6b7280;margin-bottom:4px}}.hint{{margin-top:20px;font-size:11px;color:#374151}}</style></head>
<body><div class="card">
<div class="logo"><svg width="52" height="52" viewBox="0 0 72 72" fill="none"><rect width="72" height="72" rx="18" fill="#FF4D4D"/><circle cx="36" cy="36" r="17" stroke="white" stroke-width="3" fill="none"/><circle cx="36" cy="36" r="10" stroke="white" stroke-width="2.5" fill="none"/><circle cx="36" cy="36" r="4" fill="white"/><circle cx="52" cy="20" r="5" fill="white"/><circle cx="52" cy="20" r="2.5" fill="#FF4D4D"/></svg></div>
<div class="check"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
<h1>Connected to {}!</h1>
<p>Return to Slate to go live.</p>
<p class="hint">This tab will close automatically&#8230;</p>
</div>
<script>setTimeout(()=>window.close(),2500)</script></body></html>"##, platform)
}

/// Twitch uses implicit flow — token arrives in the URL fragment.
/// We serve a bridge page that reads the fragment and sends the token as a query param.
fn oauth_listen_fragment(port: u16) -> Result<String, String> {
    let listener = TcpListener::bind(format!("127.0.0.1:{}", port))
        .map_err(|e| format!("Port {} is busy — close any app using it and try again. ({})", port, e))?;

    // First request: serve silent JS bridge that extracts the fragment and redirects
    let (mut s1, _) = listener.accept().map_err(|e| e.to_string())?;
    let _r1 = read_http_request(&mut s1);
    let bridge = "<script>const p=new URLSearchParams(location.hash.slice(1));const t=p.get('access_token');if(t){location.replace('/cb?t='+encodeURIComponent(t))}else{document.body.textContent='Auth failed or cancelled'}</script>";
    send_html(&mut s1, bridge);
    drop(s1);

    // Second request: bridge redirects here with token as query param
    let (mut s2, _) = listener.accept().map_err(|e| e.to_string())?;
    let r2 = read_http_request(&mut s2);
    let token = extract_query_param(&r2, "t").ok_or("No access token received — did you complete the login?")?;
    send_html(&mut s2, &slate_success_page("Twitch"));

    Ok(token)
}

/// YouTube uses auth code flow — code arrives as a query param directly.
fn oauth_listen_code(port: u16) -> Result<String, String> {
    let listener = TcpListener::bind(format!("127.0.0.1:{}", port))
        .map_err(|e| format!("Port {} is busy — close any app using it and try again. ({})", port, e))?;

    let (mut stream, _) = listener.accept().map_err(|e| e.to_string())?;
    let req = read_http_request(&mut stream);
    let code = extract_query_param(&req, "code").ok_or("No authorization code received — did you complete the login?")?;
    send_html(&mut stream, &slate_success_page("YouTube"));

    Ok(code)
}

// ── OAuth — Twitch ────────────────────────────────────────────────────────────

#[derive(Serialize)]
struct ConnectedAccount {
    username: String,
    #[serde(rename = "streamKey")]
    stream_key: String,
    platform: String,
    token: String,
    #[serde(rename = "broadcasterId")]
    broadcaster_id: String,
}

#[tauri::command]
async fn connect_twitch(client_id: String) -> Result<ConnectedAccount, String> {
    const PORT: u16 = 3737;
    let redirect_uri = format!("http://localhost:{}", PORT);

    let auth_url = format!(
        "https://id.twitch.tv/oauth2/authorize?client_id={}&redirect_uri={}&response_type=token&scope=channel%3Aread%3Astream_key+user%3Aread%3Aemail+channel%3Amanage%3Abroadcast",
        client_id, redirect_uri
    );

    open_url(&auth_url);

    let token = tauri::async_runtime::spawn_blocking(move || oauth_listen_fragment(PORT))
        .await
        .map_err(|e| e.to_string())??;

    let http = reqwest::Client::new();

    let user_resp: serde_json::Value = http
        .get("https://api.twitch.tv/helix/users")
        .header("Authorization", format!("Bearer {}", token))
        .header("Client-Id", &client_id)
        .send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())?;

    let user_id = user_resp["data"][0]["id"]
        .as_str().ok_or("Could not get your Twitch user ID")?.to_string();
    let username = user_resp["data"][0]["login"]
        .as_str().unwrap_or("unknown").to_string();

    let key_resp: serde_json::Value = http
        .get("https://api.twitch.tv/helix/streams/key")
        .query(&[("broadcaster_id", user_id.as_str())])
        .header("Authorization", format!("Bearer {}", token))
        .header("Client-Id", &client_id)
        .send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())?;

    let stream_key = key_resp["data"][0]["stream_key"]
        .as_str().ok_or("Could not get your Twitch stream key")?.to_string();

    Ok(ConnectedAccount { username, stream_key, platform: "twitch".to_string(), token, broadcaster_id: user_id })
}

// ── OAuth — YouTube (PKCE — no client secret needed) ─────────────────────────

#[tauri::command]
async fn connect_youtube(client_id: String, code_verifier: String, code_challenge: String) -> Result<ConnectedAccount, String> {
    const PORT: u16 = 3738; // different port from Twitch (3737) so both can connect simultaneously
    let redirect_uri = format!("http://localhost:{}", PORT);

    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube&access_type=offline&prompt=consent&code_challenge={}&code_challenge_method=S256",
        client_id, redirect_uri, code_challenge
    );

    open_url(&auth_url);

    let code = tauri::async_runtime::spawn_blocking(move || oauth_listen_code(PORT))
        .await
        .map_err(|e| e.to_string())??;

    let http = reqwest::Client::new();

    // PKCE token exchange — no client_secret required for desktop apps
    let token_resp: serde_json::Value = http
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("code", code.as_str()),
            ("client_id", client_id.as_str()),
            ("code_verifier", code_verifier.as_str()),
            ("redirect_uri", redirect_uri.as_str()),
            ("grant_type", "authorization_code"),
        ])
        .send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())?;

    let access_token = token_resp["access_token"]
        .as_str().ok_or("No access token from Google — check your credentials")?.to_string();

    let channel_resp: serde_json::Value = http
        .get("https://www.googleapis.com/youtube/v3/channels")
        .query(&[("part", "snippet"), ("mine", "true")])
        .header("Authorization", format!("Bearer {}", access_token))
        .send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())?;

    let username = channel_resp["items"][0]["snippet"]["title"]
        .as_str().unwrap_or("YouTube Channel").to_string();

    let streams_resp: serde_json::Value = http
        .get("https://www.googleapis.com/youtube/v3/liveStreams")
        .query(&[("part", "cdn,snippet"), ("mine", "true")])
        .header("Authorization", format!("Bearer {}", access_token))
        .send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())?;

    let stream_key = streams_resp["items"][0]["cdn"]["ingestionInfo"]["streamName"]
        .as_str()
        .ok_or("No YouTube stream key found. Go to YouTube Studio → Go Live → Stream to create one first.")?
        .to_string();

    Ok(ConnectedAccount { username, stream_key, platform: "youtube".to_string(), token: String::new(), broadcaster_id: String::new() })
}

// ── Entry point ───────────────────────────────────────────────────────────────

fn main() {
    tauri::Builder::default()
        .manage(Mutex::new(StreamState::default()))
        .invoke_handler(tauri::generate_handler![
            list_capture_sources,
            convert_to_mp4,
            start_stream,
            stop_stream,
            connect_twitch,
            connect_youtube,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Slate");
}
