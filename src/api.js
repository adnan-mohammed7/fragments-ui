// src/api.js

// fragments microservice API to use, defaults to localhost:8080 if not set in env
const apiUrl = process.env.API_URL;

/**
 * Given an authenticated user, request all fragments for this user from the
 * fragments microservice (currently only running locally). We expect a user
 * to have an `idToken` attached, so we can send that along with the request.
 */
export async function getUserFragments(user) {
  console.log('Requesting user fragments data...');
  console.log(`${process.env.API_URL}`);
  try {
    const fragmentsUrl = new URL('/v1/fragments', apiUrl);
    const res = await fetch(fragmentsUrl, {
      // Generate headers with the proper Authorization bearer token to pass.
      // We are using the `authorizationHeaders()` helper method we defined
      // earlier, to automatically attach the user's ID token.
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Successfully got user fragments data', { data });
    return data;
  } catch (err) {
    console.error('Unable to call GET /v1/fragment', { err });
  }
}

export async function addFragment(user, { contentType, body }) {
  console.log('Posting fragment data...');
  try {
    const fragmentsUrl = new URL('/v1/fragments', apiUrl);
    const header = new Headers();
    header.set('Content-Type', contentType);
    const auth = user.authorizationHeaders();
    if (auth?.Authorization) {
      header.set('Authorization', auth.Authorization);
    }

    const res = await fetch(fragmentsUrl, {
      method: 'POST',
      headers: header,
      body: body,
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const result = await res.json();
    console.log("Fragment created!")
    return result;
  } catch (err) {
    console.error('Unable to call POST /v1/fragment', { err });
  }
}