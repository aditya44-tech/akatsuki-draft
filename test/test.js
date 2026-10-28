import 'dotenv/config';
import app from '../src/app.js';
import { connectDB, closeDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';
import assert from 'node:assert/strict';

const TEST_PORT = 5099;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function runTests() {
  console.log('\n======================================================');
  console.log('  STARTING AKATSUKI DRAFT BACKEND API TEST SUITE');
  console.log('======================================================\n');

  await connectDB();

  // Reset collections for clean test run
  await User.deleteMany({});
  await Post.deleteMany({});

  const server = app.listen(TEST_PORT);
  console.log(`[Test Server] Listening on port ${TEST_PORT}\n`);

  try {
    let userToken = '';
    let adminToken = '';
    let testPostId = '';
    let improvedDraftId = '';
    let pendingPostId = '';

    // Test 1: Health check
    console.log('▶ [1/15] GET /api/health');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    assert.equal(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.equal(healthData.status, 'healthy');
    console.log('  ✔ Health check passed\n');

    // Test 2: Register regular user
    console.log('▶ [2/15] POST /auth/register (Regular User)');
    const regUserRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Deidara',
        email: 'deidara@akatsuki.dev',
        password: 'ArtIsAnExplosion123',
        role: 'user',
      }),
    });
    assert.equal(regUserRes.status, 201);
    const regUserData = await regUserRes.json();
    assert.equal(regUserData.success, true);
    assert.equal(regUserData.user.role, 'user');
    assert.ok(regUserData.token);
    userToken = regUserData.token;
    console.log('  ✔ User registered successfully with JWT\n');

    // Test 3: Register admin user
    console.log('▶ [3/15] POST /auth/register (Admin)');
    const regAdminRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Leader Pain',
        email: 'admin@akatsuki.dev',
        password: 'PeaceThroughPower123',
        role: 'admin',
      }),
    });
    assert.equal(regAdminRes.status, 201);
    const regAdminData = await regAdminRes.json();
    assert.equal(regAdminData.user.role, 'admin');
    console.log('  ✔ Admin registered successfully\n');

    // Test 4: Login to retrieve tokens
    console.log('▶ [4/15] POST /auth/login');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@akatsuki.dev',
        password: 'PeaceThroughPower123',
      }),
    });
    assert.equal(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert.equal(loginData.success, true);
    assert.ok(loginData.token);
    adminToken = loginData.token;
    console.log('  ✔ Admin login successful\n');

    // Test 5: GET /auth/me
    console.log('▶ [5/15] GET /auth/me');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.user.email, 'deidara@akatsuki.dev');
    console.log(`  ✔ Authenticated as: ${meData.user.name} (${meData.user.role})\n`);

    // Test 6: POST /posts (Create Draft)
    console.log('▶ [6/15] POST /posts (Create Draft)');
    const draftRes = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        title: 'Explosive Clay Techniques in Modern Art',
        description: 'An exploration of fleeting beauty and transient aesthetics.',
        content: 'True art is a fleeting burst of glory. In this draft, we analyze sculptured micro-detonations.',
        category: 'Art & Design',
        status: 'draft',
      }),
    });
    assert.equal(draftRes.status, 201);
    const draftData = await draftRes.json();
    assert.equal(draftData.post.status, 'draft');
    testPostId = draftData.post._id;
    console.log(`  ✔ Draft created with ID: ${testPostId}\n`);

    // Test 7: POST /posts (Create Pending Post)
    console.log('▶ [7/15] POST /posts (Create Pending Post for Admin Approval)');
    const pendingRes = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        title: 'Chakra Control and Sculptural Mastery',
        description: 'Advanced guide to manipulating kinetic matter.',
        content: 'Molding matter with precision requires complete harmony between body and mind.',
        category: 'Ninjutsu',
        status: 'pending',
      }),
    });
    assert.equal(pendingRes.status, 201);
    const pendingData = await pendingRes.json();
    assert.equal(pendingData.post.status, 'pending');
    pendingPostId = pendingData.post._id;
    console.log(`  ✔ Pending post created with ID: ${pendingPostId}\n`);

    // Test 8: GET /posts/my-posts (View user's posts and drafts)
    console.log('▶ [8/15] GET /posts/my-posts');
    const myPostsRes = await fetch(`${BASE_URL}/posts/my-posts`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.equal(myPostsRes.status, 200);
    const myPostsData = await myPostsRes.json();
    assert.equal(myPostsData.posts.length, 2);
    console.log(`  ✔ Retrieved ${myPostsData.posts.length} user posts\n`);

    // Test 9: PATCH /posts/:id (Update own post)
    console.log(`▶ [9/15] PATCH /posts/${testPostId}`);
    const updateRes = await fetch(`${BASE_URL}/posts/${testPostId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        title: 'Explosive Clay Art: The Ephemeral Masterpiece',
        category: 'Sculpture',
      }),
    });
    assert.equal(updateRes.status, 200);
    const updateData = await updateRes.json();
    assert.equal(updateData.post.title, 'Explosive Clay Art: The Ephemeral Masterpiece');
    console.log('  ✔ Post title updated successfully\n');

    // Test 10: POST /ai/improve/:postId (AI Content Improvement)
    console.log(`▶ [10/15] POST /ai/improve/${testPostId} (AI Content Improvement)`);
    const aiRes = await fetch(`${BASE_URL}/ai/improve/${testPostId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        instruction: 'Elevate this draft with refined vocabulary, structured headers, and persuasive prose.',
      }),
    });
    assert.equal(aiRes.status, 201);
    const aiData = await aiRes.json();
    assert.equal(aiData.success, true);
    assert.notEqual(aiData.newDraft._id, testPostId);
    assert.equal(aiData.newDraft.status, 'draft');
    assert.equal(aiData.newDraft.originalPostId, testPostId);
    improvedDraftId = aiData.newDraft._id;
    console.log(`  ✔ New AI draft created with distinct ID: ${improvedDraftId}`);
    console.log(`  ✔ Original draft preserved with ID: ${aiData.originalDraft._id}`);
    console.log(`  ✔ AI Provider: ${aiData.aiDetails.provider}\n`);

    // Test 11: GET /admin/posts/pending (Admin view pending posts)
    console.log('▶ [11/15] GET /admin/posts/pending');
    const pendingListRes = await fetch(`${BASE_URL}/admin/posts/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(pendingListRes.status, 200);
    const pendingListData = await pendingListRes.json();
    assert.ok(pendingListData.posts.some((p) => p._id === pendingPostId));
    console.log(`  ✔ Admin found ${pendingListData.posts.length} pending posts\n`);

    // Test 12: PATCH /admin/posts/approve/:id (Admin approve post)
    console.log(`▶ [12/15] PATCH /admin/posts/approve/${pendingPostId}`);
    const approveRes = await fetch(`${BASE_URL}/admin/posts/approve/${pendingPostId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.equal(approveData.post.status, 'approved');
    console.log('  ✔ Post approved by admin\n');

    // Test 13: GET /posts and GET /posts/:id (Public view of approved post)
    console.log(`▶ [13/15] GET /posts (Public Feed) & GET /posts/${pendingPostId}`);
    const feedRes = await fetch(`${BASE_URL}/posts`);
    assert.equal(feedRes.status, 200);
    const feedData = await feedRes.json();
    assert.ok(feedData.posts.some((p) => p._id === pendingPostId));

    const singleRes = await fetch(`${BASE_URL}/posts/${pendingPostId}`);
    assert.equal(singleRes.status, 200);
    const singleData = await singleRes.json();
    assert.equal(singleData.post.title, 'Chakra Control and Sculptural Mastery');
    console.log('  ✔ Approved post is publicly accessible\n');

    // Test 14: PATCH /admin/posts/reject/:id (Admin reject post)
    console.log(`▶ [14/15] PATCH /admin/posts/reject/${improvedDraftId}`);
    // First update improvedDraftId to pending so admin can reject it
    await Post.findByIdAndUpdate(improvedDraftId, { status: 'pending' });

    const rejectRes = await fetch(`${BASE_URL}/admin/posts/reject/${improvedDraftId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(rejectRes.status, 200);
    const rejectData = await rejectRes.json();
    assert.equal(rejectData.post.status, 'rejected');
    console.log('  ✔ Post rejected by admin\n');

    // Test 15: DELETE /posts/:id (Delete own post)
    console.log(`▶ [15/15] DELETE /posts/${testPostId}`);
    const deleteRes = await fetch(`${BASE_URL}/posts/${testPostId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.equal(deleteRes.status, 200);
    const deleteData = await deleteRes.json();
    assert.equal(deleteData.success, true);
    console.log('  ✔ Post deleted successfully\n');

    console.log('======================================================');
    console.log('  ALL 15 ENDPOINT TESTS PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ Test Suite Failed with Error:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await closeDB();
  }
}

runTests();
