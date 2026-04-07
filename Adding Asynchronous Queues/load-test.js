import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter } from 'k6/metrics';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const BASE_URL = __ENV.TARGET || 'http://localhost:4002';

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

  if (res.status === 500) {
    error500.add(1);
  } else if (res.status === 503) {
    error503.add(1);
  }

  // We now accept 200 (OK) or 202 (Accepted - Eventual Consistency)
  check(res, {
    'status is 200 or 202': (r) => r.status === 200 || r.status === 202,
  });

  sleep(0.01);
}

export function handleSummary(data) {
  return {
    "queued-test.html": htmlReport(data),          
    "queued-test.json": JSON.stringify(data),      
    stdout: textSummary(data, { indent: " ", enableColors: true }), 
  };
}