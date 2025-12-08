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
  try {
    const fragmentsUrl = new URL('/v1/fragments?expand=1', apiUrl);
    const res = await fetch(fragmentsUrl, {
      // Generate headers with the proper Authorization bearer token to pass.
      // We are using the `authorizationHeaders()` helper method we defined
      // earlier, to automatically attach the user's ID token.
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.error}`);
    }
    const data = await res.json();
    console.log('Successfully got user fragments data', { data });
    return data;
  } catch (err) {
    console.error('Unable to call GET /v1/fragment', { err });
  }
}

// Fetch fragment data by ID for authenticated user
export async function getFragmentData(user, fragmentId) {
  try {
    const fragmentUrl = new URL(`/v1/fragments/${fragmentId}`, apiUrl);
    const res = await fetch(fragmentUrl, {
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.error}`);
    }
    console.log(res);
    const data = await res.text();
    return data;
  } catch (err) {
    console.error(`Unable to call GET /v1/fragments/${fragmentId}`, { err });
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
      throw new Error(`${res.status} ${res.error}`);
    }
    const result = await res.json();
    console.log("Fragment created!")
    return result;
  } catch (err) {
    console.error('Unable to call POST /v1/fragment', { err });
  }
}

export async function updateFragment(user, id, { contentType, body }) {
  console.log(`Updating fragment ${id}...`);
  try {
    const fragmentUrl = new URL(`/v1/fragments/${id}`, apiUrl);
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    const auth = user.authorizationHeaders();
    if (auth?.Authorization) {
      headers.set('Authorization', auth.Authorization);
    }

    const res = await fetch(fragmentUrl, {
      method: 'PUT',
      headers,
      body,
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.error}`);
    }
    const data = await res.json();
    console.log('Fragment updated', { data });
    return data;
  } catch (err) {
    console.error(`Unable to call PUT /v1/fragments/${id}`, { err });
  }
}

export async function deleteFragment(user, id) {
  console.log(`Deleting fragment ${id}...`);
  try {
    const fragmentUrl = new URL(`/v1/fragments/${id}`, apiUrl);
    const res = await fetch(fragmentUrl, {
      method: 'DELETE',
      headers: user.authorizationHeaders(),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.error}`);
    }
    console.log('Fragment deleted');
    return true;
  } catch (err) {
    console.error(`Unable to call DELETE /v1/fragments/${id}`, { err });
    return false;
  }
}

export async function getFragmentBinary(user, fragmentId) {
  try {
    const fragmentUrl = new URL(`/v1/fragments/${fragmentId}`, apiUrl);
    const res = await fetch(fragmentUrl, { headers: user.authorizationHeaders() });
    if (!res.ok) throw new Error(`${res.status} ${res.error}`);
    return await res.blob();
  } catch (err) {
    console.error(`Unable to get Image Fragment: ${fragmentId}, ${err}`)
  }

}


// Get a converted fragment (text)
export async function getConvertedFragment(user, fragmentId, ext) {
  try {
    const fragmentUrl = new URL(`/v1/fragments/${fragmentId}.${ext}`, apiUrl);
    console.log(fragmentUrl);
    const res = await fetch(fragmentUrl, {
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.error}`);
    }
    return await res.text();
  } catch (err) {
    console.error(`Unable to call GET /v1/fragments/${fragmentId}.${ext}`, { err });
  }
}

export async function getConvertedFragmentBinary(user, fragmentId, ext) {
  try {
    const fragmentUrl = new URL(`/v1/fragments/${fragmentId}.${ext}`, apiUrl);
    const res = await fetch(fragmentUrl, {
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.error}`);
    }
    return await res.blob();
  } catch (err) {
    console.error(`Unable to call GET /v1/fragments/${fragmentId}.${ext} (binary)`, { err });
  }
}
