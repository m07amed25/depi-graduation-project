import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'], // < 1% errors
    http_req_duration: ['p(99)<1000'], // 95% of requests < 500ms
  },
  cloud: {
    // Project: Default project
    projectID: 7730805,
    // Test runs with the same name groups test runs together.
    name: 'Test - CodeCatch (04/06/2026-13:05:45)'
  }
};

export default function() {
  http.get('https://codecatch.dev');
  sleep(1);
}