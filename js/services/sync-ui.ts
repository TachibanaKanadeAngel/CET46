let statusTimeoutId: any = null;

export function updateWebDAVStatus(message: string, _type: string = 'info'): void {
  const statusEl = document.getElementById('webdav-status');
  if (statusEl) {
    statusEl.textContent = message;
    if (statusTimeoutId) clearTimeout(statusTimeoutId);
    statusTimeoutId = setTimeout(() => {
      statusEl.textContent = '';
      statusTimeoutId = null;
    }, 5000);
  }
}

export default updateWebDAVStatus;
