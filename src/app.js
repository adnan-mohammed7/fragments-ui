// src/app.js

import { signIn, signOut, getUser } from './auth';
import { addFragment, getUserFragments, getFragmentData, deleteFragment, updateFragment, getFragmentBinary, getConvertedFragment, getConvertedFragmentBinary, } from './api';

async function init() {
  const apiUrl = process.env.API_URL;
  // Get our UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const createFragmentBtn = document.querySelector(`#createFragment`);
  const fragmentTypeSelect = document.querySelector('#fragment-type');
  const fragmentContent = document.querySelector('#fragment-content');
  const fragmentsListSection = document.querySelector('#fragments-list');
  const fragmentsList = document.querySelector('#fragments-ul');

  // Wire up event handlers to deal with login and logout.
  loginBtn.onclick = () => {
    // Sign-in via the Amazon Cognito Hosted UI (requires redirects), see:
    signIn();
  };

  logoutBtn.onclick = () => {
    signOut();
  };

  const enableCreateBtn = () => {
    if (!user) {
      createFragmentBtn.disabled = true;
      return;
    }
    const contentType = fragmentTypeSelect.value;

    if (contentType.startsWith('image/')) {
      createFragmentBtn.innerText = "Upload"
      createFragmentBtn.disabled = false;
      return;
    } else {
      createFragmentBtn.innerText = "Create"
    }

    const hasContent = fragmentContent.value.trim().length > 0;
    createFragmentBtn.disabled = !hasContent;
  };

  function markdownToHtml(md) {
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>');
    html = html.replace(/^##### (.*)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.*)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    html = html.replace(/\n/g, '<br/>');
    return html;
  }


  const renderFragments = async (fragments) => {
    fragmentsList.innerHTML = '';
    if (!fragments || fragments.length === 0) {
      fragmentsList.innerHTML = '<li>No fragments found.</li>';
      return;
    }

    for (const fragment of fragments) {
      const li = document.createElement('li');
      const container = document.createElement('div');
      container.style.border = '1px solid #ddd';
      container.style.padding = '12px';
      container.style.marginBottom = '12px';
      container.style.borderRadius = '4px';

      // Metadata
      const metaDiv = document.createElement('div');
      metaDiv.innerHTML = `
      <strong>ID:</strong> ${fragment.id}<br/>
      <strong>Content-Type:</strong> ${fragment.type}<br/>
      <strong>Created:</strong> ${new Date(fragment.created).toLocaleString()}<br/>
      <strong>Updated:</strong> ${new Date(fragment.updated).toLocaleString()}<br/>
      <strong>Size:</strong> ${fragment.size} bytes<br/>
    `;
      metaDiv.style.marginBottom = '8px';

      // Content area + textarea
      const contentArea = document.createElement('div');
      contentArea.id = `content-${fragment.id}`;

      const textarea = document.createElement('textarea');
      textarea.style.width = '100%';
      textarea.style.height = '150px';
      textarea.style.display = 'none';
      textarea.style.resize = 'vertical';

      let previewElement;
      const type = fragment.type.toLowerCase();

      if (type.startsWith('image/')) {
        const blob = await getFragmentBinary(user, fragment.id);

        if (!blob) {
          previewElement = document.createElement('div');
          previewElement.textContent = '[Error loading image]';
        } else {
          const dataUrl = URL.createObjectURL(blob);

          previewElement = document.createElement('div');
          const img = document.createElement('img');
          img.src = dataUrl;
          img.alt = 'Fragment image';
          img.style.maxWidth = '200px';
          img.style.maxHeight = '200px';
          img.style.border = '1px solid #ccc';
          img.style.borderRadius = '4px';

          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `${fragment.id}.${type.split('/')[1]}`;
          link.textContent = 'Download image';
          link.style.display = 'inline-block';
          link.style.marginTop = '4px';

          const small = document.createElement('small');
          small.appendChild(link);

          previewElement.appendChild(img);
          previewElement.appendChild(document.createElement('br'));
          previewElement.appendChild(small);
        }

        textarea.value = '';
      }

      else {
        // Non-image: fetch as text
        const data = await getFragmentData(user, fragment.id);

        if (data !== undefined && data !== null) {
          if (type === 'text/csv') {
            const normalized = data.replace(/\\n/g, '\n');
            const rows = normalized
              .trim()
              .split('\n')
              .map(row => row.split(',').map(cell => cell.trim()));

            let tableHTML = '<table style="border-collapse: collapse; width: 100%;"><tbody>';
            rows.forEach(row => {
              tableHTML += '<tr>';
              row.forEach(cell => {
                tableHTML += `<td style="padding:4px; border:1px solid #eee;">${cell.replace(/"/g, '&quot;')}</td>`;
              });
              tableHTML += '</tr>';
            });
            tableHTML += '</tbody></table>';

            previewElement = document.createElement('div');
            previewElement.innerHTML = tableHTML;
            textarea.value = data;
          } else if (type === 'application/json') {
            previewElement = document.createElement('pre');
            previewElement.style.color = '#f8f9fa';
            previewElement.style.padding = '12px';
            previewElement.style.borderRadius = '4px';
            previewElement.style.overflow = 'auto';
            previewElement.style.whiteSpace = 'pre';

            let raw = data.trim();
            if ((raw.startsWith('"') && raw.endsWith('"')) ||
              (raw.startsWith("'") && raw.endsWith("'"))) {
              raw = raw.slice(1, -1);
            }

            let pretty = raw;
            try {
              let normalized = raw;
              normalized = normalized.replace(/([{,\s])([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
              normalized = normalized.replace(/'([^']*)'/g, '"$1"');
              const parsed = JSON.parse(normalized);
              pretty = JSON.stringify(parsed, null, 2);
            } catch (err) {
              pretty = raw;
            }

            previewElement.textContent = pretty;
            textarea.value = data;
          } else if (type === 'application/yaml') {
            previewElement = document.createElement('pre');
            previewElement.style.color = '#f8f9fa';
            previewElement.style.padding = '12px';
            previewElement.style.borderRadius = '4px';
            previewElement.style.overflow = 'auto';

            let pretty = data.replace(/\\n/g, '\n');
            pretty = pretty
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .join('\n');

            previewElement.textContent = pretty;
            textarea.value = data;
          } else if (type === 'text/html') {
            previewElement = document.createElement('div');
            previewElement.style.padding = '12px';
            previewElement.style.borderRadius = '4px';
            previewElement.innerHTML = data;
            textarea.value = data;
          } else if (type === 'text/markdown') {
            previewElement = document.createElement('div');
            previewElement.style.padding = '12px';
            previewElement.style.borderRadius = '4px';
            previewElement.innerHTML = markdownToHtml(data);
            textarea.value = data;
          } else if (type === 'text/plain') {
            previewElement = document.createElement('pre');
            previewElement.style.whiteSpace = 'pre-wrap';
            previewElement.style.padding = '12px';
            previewElement.style.borderRadius = '4px';
            previewElement.textContent = data;
            textarea.value = data;
          } else {
            previewElement = document.createElement('pre');
            previewElement.style.whiteSpace = 'pre-wrap';
            previewElement.style.padding = '12px';
            previewElement.style.borderRadius = '4px';
            previewElement.textContent = data;
            textarea.value = data;
          }
        } else {
          previewElement = document.createElement('div');
          previewElement.textContent = '[Error loading data]';
        }
      }

      contentArea.appendChild(previewElement);
      contentArea.appendChild(textarea);

      const convertDiv = document.createElement('div');
      convertDiv.style.marginTop = '8px';
      convertDiv.style.display = 'flex';
      convertDiv.style.alignItems = 'center';

      const convertSelect = document.createElement('select');
      const convertBtn = document.createElement('button');
      convertBtn.textContent = 'Convert';
      convertBtn.style.marginLeft = '4px';

      // Allowed extensions per type
      const conversionMap = {
        'text/plain': ['txt'],
        'text/markdown': ['md', 'html', 'txt'],
        'text/html': ['html', 'txt'],
        'text/csv': ['csv', 'txt', 'json'],
        'application/json': ['json', 'yaml', 'yml', 'txt'],
        'application/yaml': ['yaml', 'txt'],
        'image/png': ['png', 'jpg', 'webp', 'gif', 'avif'],
        'image/jpeg': ['png', 'jpg', 'webp', 'gif', 'avif'],
        'image/webp': ['png', 'jpg', 'webp', 'gif', 'avif'],
        'image/avif': ['png', 'jpg', 'webp', 'gif', 'avif'],
        'image/gif': ['png', 'jpg', 'webp', 'gif', 'avif'],
      };

      const exts = conversionMap[fragment.type] || [];
      exts.forEach(ext => {
        const opt = document.createElement('option');
        opt.value = ext;
        opt.textContent = `.${ext}`;
        convertSelect.appendChild(opt);
      });

      if (exts.length === 0) {
        convertSelect.disabled = true;
        convertBtn.disabled = true;
      }

      convertDiv.appendChild(convertSelect);
      convertDiv.appendChild(convertBtn);

      contentArea.appendChild(convertDiv);


      // Buttons
      const buttonsDiv = document.createElement('div');
      buttonsDiv.style.marginTop = '12px';

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.style.marginRight = '8px';

      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      saveBtn.style.marginRight = '8px';
      saveBtn.disabled = true;

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.marginRight = '8px';
      cancelBtn.style.display = 'none';

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.style.marginRight = '8px';
      deleteBtn.style.background = '#dc3545';
      deleteBtn.style.color = 'white';

      buttonsDiv.append(editBtn, saveBtn, cancelBtn, deleteBtn);

      container.appendChild(metaDiv);
      container.appendChild(contentArea);
      container.appendChild(buttonsDiv);
      li.appendChild(container);
      fragmentsList.appendChild(li);

      // Edit / Cancel
      const enterEdit = () => {
        previewElement.style.display = 'none';
        textarea.style.display = 'block';
        editBtn.disabled = true;
        saveBtn.disabled = false;
        cancelBtn.style.display = 'inline-block';
        textarea.focus();
      };
      const exitEdit = () => {
        previewElement.style.display = 'block';
        textarea.style.display = 'none';
        editBtn.disabled = false;
        saveBtn.disabled = true;
        cancelBtn.style.display = 'none';
      };

      editBtn.onclick = enterEdit;
      cancelBtn.onclick = exitEdit;

      // Save
      saveBtn.onclick = async () => {
        saveBtn.disabled = true;
        try {
          const newBody = textarea.value;
          let valid = true;

          if (fragment.type === 'application/json') {
            JSON.parse(newBody);
          } else if (fragment.type === 'application/yaml') {
            if (!newBody.trim().startsWith('{') && !newBody.trim().startsWith('-')) {
              valid = confirm('This doesn\'t look like valid YAML. Continue anyway?');
            }
          }

          if (!valid) {
            saveBtn.disabled = false;
            return;
          }

          await updateFragment(user, fragment.id, {
            contentType: fragment.type,
            body: newBody,
          });

          const refreshed = await getUserFragments(user);
          renderFragments(refreshed.fragments || []);
        } catch (e) {
          alert('Update failed: ' + e.message);
        } finally {
          saveBtn.disabled = false;
        }
      };

      // Delete
      deleteBtn.onclick = async () => {
        if (!confirm(`Delete fragment ${fragment.id}?`)) return;
        const ok = await deleteFragment(user, fragment.id);
        if (ok) li.remove();
        if (fragmentsList.children.length === 0) {
          fragmentsList.innerHTML = '<li>No fragments found.</li>';
        }
      };

      convertBtn.onclick = async () => {
        const ext = convertSelect.value;
        if (!ext) return;

        try {
          if (type.startsWith('image/')) {
            const blob = await getConvertedFragmentBinary(user, fragment.id, ext);
            if (!blob) {
              alert('Conversion failed');
              return;
            }

            const objectUrl = URL.createObjectURL(blob);
            const img = contentArea.querySelector('img');
            if (img) img.src = objectUrl;

            const link = contentArea.querySelector('a');
            if (link) {
              link.href = objectUrl;
              link.download = `${fragment.id}.${ext}`;
            }
          } else {
            const converted = await getConvertedFragment(user, fragment.id, ext);
            if (!converted) {
              alert('Conversion failed');
              return;
            }

            textarea.value = converted;

            // Decide how to render based on requested extension
            if (ext === 'csv') {
              const normalized = converted.replace(/\\n/g, '\n');
              const rows = normalized
                .trim()
                .split('\n')
                .map(row => row.split(',').map(cell => cell.trim()));

              let tableHTML = '<table style="border-collapse: collapse; width: 100%;"><tbody>';
              rows.forEach(row => {
                tableHTML += '<tr>';
                row.forEach(cell => {
                  tableHTML += `<td style="padding:4px; border:1px solid #eee;">${cell.replace(/"/g, '&quot;')}</td>`;
                });
                tableHTML += '</tr>';
              });
              tableHTML += '</tbody></table>';

              previewElement.innerHTML = tableHTML;
            } else if (ext === 'md') {
              previewElement.innerHTML = markdownToHtml(converted);
            } else if (ext === 'html') {
              previewElement.innerHTML = converted;
            } else if (ext === 'json') {
              previewElement.innerHTML = '';
              previewElement.tagName === 'PRE' || (() => {
                const pre = document.createElement('pre');
                pre.style.color = '#f8f9fa';
                pre.style.padding = '12px';
                pre.style.borderRadius = '4px';
                pre.style.overflow = 'auto';
                pre.style.whiteSpace = 'pre';
                previewElement.replaceWith(pre);
                previewElement = pre;
              })();

              let raw = converted.trim();
              if ((raw.startsWith('"') && raw.endsWith('"')) ||
                (raw.startsWith("'") && raw.endsWith("'"))) {
                raw = raw.slice(1, -1);
              }

              let pretty = raw;
              try {
                let normalized = raw;
                normalized = normalized.replace(/([{,\s])([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
                normalized = normalized.replace(/'([^']*)'/g, '"$1"');
                const parsed = JSON.parse(normalized);
                pretty = JSON.stringify(parsed, null, 2);
              } catch (error) {
                pretty = raw;
              }

              previewElement.textContent = pretty;
            } else if (ext === 'yaml' || ext === 'yml') {
              if (previewElement.tagName !== 'PRE') {
                const pre = document.createElement('pre');
                pre.style.color = '#f8f9fa';
                pre.style.padding = '12px';
                pre.style.borderRadius = '4px';
                pre.style.overflow = 'auto';
                previewElement.replaceWith(pre);
                previewElement = pre;
              }

              let raw = converted.trim();
              if (raw.startsWith("'") && raw.endsWith("'")) {
                raw = raw.slice(1, -1);
                raw = raw.replace(/''/g, "'");
              }

              if (raw.startsWith('{') && raw.endsWith('}')) {
                raw = raw.slice(1, -1);
              }

              let pretty = raw
                .split(',')
                .map(p => p.trim())
                .filter(Boolean)
                .join('\n');

              previewElement.textContent = pretty;
            } else {
              previewElement.textContent = converted;
            }
          }
        } catch (e) {
          console.error(e);
          alert('Conversion error: ' + e.message);
        }
      };
    }
  };

  createFragmentBtn.onclick = async () => {
    if (!user || createFragmentBtn.disabled) return;

    const contentType = fragmentTypeSelect.value;
    let body = fragmentContent.value;

    if (contentType.startsWith('image/')) {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = contentType;
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      fileInput.click();

      fileInput.onchange = async () => {
        const file = fileInput.files[0];
        document.body.removeChild(fileInput);
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
          const arrayBuffer = reader.result;
          body = new Uint8Array(arrayBuffer);
          createFragmentBtn.disabled = true;
          try {
            await addFragment(user, { contentType, body });
            const userFragmentsResponse = await getUserFragments(user);
            renderFragments(userFragmentsResponse.fragments || []);
            fragmentContent.value = '';
          } catch (error) {
            console.error(error);
          } finally {
            enableCreateBtn();
          }
        };
        reader.readAsArrayBuffer(file);
      };
      return;
    }

    if (contentType === 'application/json') {
      try {
        JSON.parse(body);
      } catch (e) {
        alert('Invalid JSON. Please fix the input.');
        return;
      }
    }

    createFragmentBtn.disabled = true;
    try {
      const created = await addFragment(user, { contentType, body });
      const userFragmentsResponse = await getUserFragments(user);
      renderFragments(userFragmentsResponse.fragments || []);
      fragmentContent.value = '';
      enableCreateBtn();
    } catch (error) {
      console.error(error);
      enableCreateBtn();
    }
  };

  // See if we're signed in (i.e., we'll have a `user` object)
  const user = await getUser();
  if (!user) {
    logoutBtn.disabled = true;
    createFragmentBtn.disabled = true;
    fragmentsListSection.hidden = true;
  }

  // Update the UI to welcome the user
  userSection.hidden = false;

  // Show the user's username
  userSection.querySelector('.username').innerText = user.username;

  // Disable the Login button
  loginBtn.disabled = true;

  logoutBtn.disabled = false;

  const userFragmentsResponse = await getUserFragments(user);

  fragmentsListSection.hidden = false;
  renderFragments(userFragmentsResponse.fragments || []);

  fragmentContent.addEventListener('input', enableCreateBtn);
  fragmentTypeSelect.addEventListener('change', enableCreateBtn);
  enableCreateBtn();
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);