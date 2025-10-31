// src/app.js

import { signIn, signOut, getUser } from './auth';
import { addFragment, getUserFragments, getFragmentData } from './api';

async function init() {
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
    const hasContent = fragmentContent.value.trim().length > 0;
    createFragmentBtn.disabled = !hasContent;
  };

  const renderFragments = async (fragments) => {
    fragmentsList.innerHTML = '';
    if (!fragments || fragments.length === 0) {
      fragmentsList.innerHTML = '<li>No fragments found.</li>';
      return;
    }

    for (const fragment of fragments) {
      const item = document.createElement('li');

      let metaInfo = `
      <strong>ID:</strong> ${fragment.id}<br/>
      <strong>Content-Type:</strong> ${fragment.type}<br/>
      <strong>Created:</strong> ${new Date(fragment.created).toLocaleString()}<br/>
      <strong>Updated:</strong> ${new Date(fragment.updated).toLocaleString()}<br/>
      <strong>Size:</strong> ${fragment.size}<br/>
    `;

      let dataPreview = '[Loading data...]';

      item.innerHTML = `<div>${metaInfo}<pre style="white-space: pre-wrap;">${dataPreview}</pre></div>`;
      fragmentsList.appendChild(item);

      const data = await getFragmentData(user, fragment.id);
      if (data) {
        item.querySelector('pre').textContent = data;
      } else {
        item.querySelector('pre').textContent = '[Error loading data]';
      }
    }
  };


  createFragmentBtn.onclick = async () => {
    if (!user || createFragmentBtn.disabled) return;

    const contentType = fragmentTypeSelect.value;
    const body = fragmentContent.value;

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