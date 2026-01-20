#!/usr/bin/env node

import http from "http";

const tests = [
  {
    name: "Test 1: GET / (root)",
    method: "GET",
    path: "/",
    body: null,
  },
  {
    name: "Test 2: GET /api/health",
    method: "GET",
    path: "/api/health",
    body: null,
  },
  {
    name: "Test 3: POST /api/items (valid)",
    method: "POST",
    path: "/api/items",
    body: JSON.stringify({ name: "Test Item", description: "A test item" }),
  },
  {
    name: "Test 4: POST /api/items (invalid - missing name)",
    method: "POST",
    path: "/api/items",
    body: JSON.stringify({ description: "No name" }),
  },
  {
    name: "Test 5: GET /api/nonexistent (404)",
    method: "GET",
    path: "/api/nonexistent",
    body: null,
  },
];

const runTest = (test) => {
  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: test.path,
      method: test.method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          console.log(`\n✅ ${test.name}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response:`, JSON.stringify(json, null, 2));
        } catch (error) {
          console.log(`\n✅ ${test.name}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response:`, data);
        }
        resolve();
      });
    });

    req.on("error", (error) => {
      console.error(`\n❌ ${test.name}`);
      console.error(`   Error: ${error.message}`);
      resolve();
    });

    if (test.body) {
      req.write(test.body);
    }
    req.end();
  });
};

const runTests = async () => {
  console.log("🚀 Testing Charcole API Error Handling\n");
  console.log("=".repeat(60));

  for (const test of tests) {
    await runTest(test);
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ All tests completed!");
  process.exit(0);
};

// Wait for server to be ready
setTimeout(runTests, 1000);
