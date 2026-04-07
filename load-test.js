import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter } from 'k6/metrics';

// Import the community HTML reporter
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const BASE_URL = __ENV.TARGET || 'http://localhost:4000';

// 1. Create custom counters for the exact error codes you want to track
const error500 = new Counter('http_500_errors');
const error503 = new Counter('http_503_errors');

export let options = {
  stages: [
    { duration: '20s', target: 100 },
    { duration: '20s', target: 500 },
    { duration: '20s', target: 1000 },
    { duration: '20s', target: 2000 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const res = http.get(BASE_URL);

  // 2. Silently count the errors without spamming the terminal console
  if (res.status === 500) {
    error500.add(1);
  } else if (res.status === 503) {
    error503.add(1);
  }

  // We only check for 200 so failures are grouped cleanly in the summary
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(0.01);
}

// 3. Export the results to an HTML graph, a JSON file, and print a clean summary to the terminal
export function handleSummary(data) {
  // Use a dynamic filename so Result 1 doesn't overwrite Result 2
  const isDistributed = BASE_URL.includes('4001');
  const testName = isDistributed ? "distributed-test" : "single-node-test";

  return {
    [`${testName}.html`]: htmlReport(data),          // The visual graph dashboard
    [`${testName}.json`]: JSON.stringify(data),      // The raw data
    stdout: textSummary(data, { indent: " ", enableColors: true }), // Keep the terminal quiet and clean
  };
}