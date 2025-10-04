// src/app.js

import { signIn, signOut, getUser } from './auth';
import { addFragment, getUserFragments } from './api';

async function init() {
  // Get our UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const createFragmentBtn = document.querySelector(`#createFragment`);

  // Wire up event handlers to deal with login and logout.
  loginBtn.onclick = () => {
    // Sign-in via the Amazon Cognito Hosted UI (requires redirects), see:
    signIn();
  };

  logoutBtn.onclick = () => {
    signOut();
  };

  createFragmentBtn.onclick = async () => {
    const createUser = await addFragment(user, { contentType: "text/plain", body: "This is a fragment" });
    console.log(createUser)
  }



  // See if we're signed in (i.e., we'll have a `user` object)
  const user = await getUser();
  if (!user) {
    logoutBtn.disabled = true;
    createFragmentBtn.disabled = true;
  }

  // Update the UI to welcome the user
  userSection.hidden = false;

  // Show the user's username
  userSection.querySelector('.username').innerText = user.username;

  // Disable the Login button
  loginBtn.disabled = true;

  logoutBtn.disabled = false;
  createFragmentBtn.disabled = false;

  const userFragments = await getUserFragments(user);

}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);