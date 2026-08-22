import express from "express";
import { db } from "../src/db/migrate.ts";
import authRouter from "../src/api/auth.ts";

const app = express();
app.use(express.json());
app.use("/api/v1/auth", authRouter);

const server = app.listen(9876, async () => {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log("  ✅ " + message);
      passed++;
    } else {
      console.error("  ❌ " + message);
      failed++;
    }
  }

  try {
    console.log("\n=== RUNNING COMPLETE NEON DB AUTH TEST SUITE ===\n");

    // 1. Neon DB Users Table
    const usersCountRes = await db.query("SELECT count(*) as count FROM users");
    assert(parseInt(usersCountRes.rows[0].count, 10) >= 2, "Neon DB users table has seeded records");

    // 2. Demo User Login
    console.log("\n[Test 1: Demo Login]");
    const loginRes = await fetch("http://localhost:9876/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "merchant@runfast.in", password: "password123", rememberMe: true }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, "Demo login returns 200 OK");
    assert(loginData.success === true, "Response contains success: true");
    assert(typeof loginData.token === "string" && loginData.token.length > 20, "Returns valid JWT token");
    assert(loginData.user.email === "merchant@runfast.in", "Returns correct user email");
    assert(loginData.user.storeName === "RunFast Sports", "Returns correct store name");

    // Verify session stored in Neon DB
    const sessionRes = await db.query("SELECT * FROM sessions WHERE token = $1", [loginData.token]);
    assert(sessionRes.rows.length === 1, "Session correctly persisted in Neon DB sessions table");

    // 3. Invalid Credentials Login
    console.log("\n[Test 2: Invalid Credentials]");
    const badLoginRes = await fetch("http://localhost:9876/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "merchant@runfast.in", password: "wrongpassword" }),
    });
    const badLoginData = await badLoginRes.json();
    assert(badLoginRes.status === 401, "Invalid password returns 401 Unauthorized");
    assert(badLoginData.error === "Invalid email or password.", "Returns appropriate error message");

    // 4. Non-existent User Login
    const unknownLoginRes = await fetch("http://localhost:9876/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nobody@nowhere.com", password: "password123" }),
    });
    assert(unknownLoginRes.status === 401, "Non-existent email returns 401 Unauthorized");

    // 5. Signup New Merchant Account
    console.log("\n[Test 3: New Merchant Signup]");
    const uniqueEmail = `founder_${Date.now()}@apexathletics.in`;
    const signupRes = await fetch("http://localhost:9876/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Ananya Sharma",
        email: uniqueEmail,
        password: "SecurePassword2026!",
        storeName: "Apex Athletics",
        phone: "+91 99887 76655",
      }),
    });
    const signupData = await signupRes.json();
    assert(signupRes.status === 201, "New signup returns 201 Created");
    assert(signupData.success === true, "Signup response has success: true");
    assert(signupData.user.name === "Ananya Sharma", "User name stored properly");
    assert(signupData.user.storeName === "Apex Athletics", "Dedicated store created in Neon DB");

    // Check user in Neon DB
    const dbUserRes = await db.query("SELECT * FROM users WHERE email = $1", [uniqueEmail]);
    assert(dbUserRes.rows.length === 1, "User persisted in Neon DB users table");
    assert(dbUserRes.rows[0].password_hash !== "SecurePassword2026!", "Password is cryptographically hashed");

    // 6. Duplicate Email Signup
    console.log("\n[Test 4: Duplicate Email Rejection]");
    const dupSignupRes = await fetch("http://localhost:9876/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Another Person",
        email: uniqueEmail,
        password: "SecurePassword2026!",
      }),
    });
    assert(dupSignupRes.status === 400, "Duplicate email returns 400 Bad Request");

    // 7. Get Current User (/me) with Token
    console.log("\n[Test 5: Authenticated /me]");
    const meRes = await fetch("http://localhost:9876/api/v1/auth/me", {
      headers: { Authorization: "Bearer " + signupData.token },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, "/me with Bearer token returns 200 OK");
    assert(meData.user.email === uniqueEmail, "/me returns authenticated user email");
    assert(meData.user.storeName === "Apex Athletics", "/me returns linked store name");

    // 8. Google Authentication
    console.log("\n[Test 6: Google Authentication]");
    const googleUrlRes = await fetch("http://localhost:9876/api/v1/auth/google/url");
    const googleUrlData = await googleUrlRes.json();
    assert(googleUrlRes.status === 200, "GET /api/v1/auth/google/url returns 200 OK");
    assert(typeof googleUrlData.configured === "boolean", "Google URL response contains configuration status");

    const googleEmail = `google_${Date.now()}@runfast.in`;
    const googleAuthRes = await fetch("http://localhost:9876/api/v1/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: googleEmail,
        fullName: "Google Merchant Partner",
        avatarUrl: "https://lh3.googleusercontent.com/a/mock_avatar",
      }),
    });
    const googleAuthData = await googleAuthRes.json();
    assert(googleAuthRes.status === 200, "POST /api/v1/auth/google returns 200 OK");
    assert(googleAuthData.success === true, "Google auth returns success: true");
    assert(googleAuthData.user.email === googleEmail, "Google auth returns correct user email");

    const googleDbUser = await db.query("SELECT * FROM users WHERE email = $1", [googleEmail]);
    assert(googleDbUser.rows.length === 1, "Google user persisted in Neon DB");
    assert(googleDbUser.rows[0].provider === "google", "Google user provider is set to google");

    // 9. Logout
    console.log("\n[Test 7: Logout Session Invalidation]");
    const logoutRes = await fetch("http://localhost:9876/api/v1/auth/logout", {
      method: "POST",
      headers: { Authorization: "Bearer " + signupData.token },
    });
    const logoutData = await logoutRes.json();
    assert(logoutRes.status === 200, "Logout returns 200 OK");
    assert(logoutData.success === true, "Logout succeeded");

    const sessionCheck = await db.query("SELECT * FROM sessions WHERE token = $1", [signupData.token]);
    assert(sessionCheck.rows.length === 0, "Session record deleted from Neon DB");

    console.log("\n================================================");
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log("================================================\n");

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution error:", err);
    server.close();
    process.exit(1);
  }
});
