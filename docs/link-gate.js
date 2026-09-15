(() => {
  'use strict';
  const local = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '::1';
  window.SEER_STATIC = location.protocol === 'file:' || !local;
  if (local) return;
  const digest = '68b89ff39297245bb85ce6d022a8af82e96954089d292842964dad750594a7a2';
  const style = document.createElement('style');
  style.textContent = 'html.link-locked body>*:not(#link-gate){visibility:hidden!important}#link-gate{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#070d18;color:#e9f2ff;font:16px system-ui,sans-serif}#link-gate[hidden]{display:none}#link-gate .gate-card{width:min(420px,calc(100vw - 40px));box-sizing:border-box;padding:24px;border:1px solid #29466d;border-radius:22px;background:linear-gradient(145deg,#122239,#0b1423);box-shadow:0 24px 80px #0009}#link-gate h1{margin:0 0 8px;font-size:24px}#link-gate p{margin:0 0 20px;color:#9eb4d3}#link-gate form{display:flex;flex-wrap:wrap;gap:10px}#link-gate input{min-width:100px;flex:1;padding:12px 14px;border:1px solid #35557f;border-radius:12px;background:#091321;color:#fff;font-size:18px;letter-spacing:.18em}#link-gate button{padding:12px 18px;border:0;border-radius:12px;background:#eaff35;color:#091016;font-weight:700;cursor:pointer}#link-gate .gate-error{min-height:22px;margin:12px 0 0;color:#ff9e9e}';
  document.head.append(style);
  document.documentElement.classList.add('link-locked');
  async function hash(value) {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }
  function mount() {
    try { if (sessionStorage.getItem('seer-link-unlocked') === digest) return unlock(); } catch {}
    const gate = document.createElement('section'); gate.id = 'link-gate'; gate.setAttribute('aria-label', '链接访问密码');
    gate.innerHTML = '<div class="gate-card"><h1>赛尔档案馆</h1><p>请输入演示链接密码后继续浏览。</p><form><input type="password" inputmode="numeric" autocomplete="current-password" aria-label="链接密码" placeholder="链接密码" required><button type="submit">进入档案馆</button></form><div class="gate-error" role="alert"></div></div>';
    document.body.append(gate); const form = gate.querySelector('form'), input = gate.querySelector('input'), error = gate.querySelector('.gate-error'); input.focus();
    form.addEventListener('submit', async event => { event.preventDefault(); let ok=false; try { ok=(await hash(input.value))===digest; } catch { error.textContent='无法验证密码，请使用 HTTPS 链接并刷新重试。'; return; } if (!ok) { error.textContent = '密码不正确，请重试。'; input.select(); return; } try { sessionStorage.setItem('seer-link-unlocked', digest); } catch {} unlock(); });
  }
  function unlock() { document.documentElement.classList.remove('link-locked'); const gate = document.getElementById('link-gate'); if (gate) gate.remove(); window.dispatchEvent(new CustomEvent('seer:link-unlocked')); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once: true}); else mount();
})();
