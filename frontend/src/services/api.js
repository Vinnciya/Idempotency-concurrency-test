const API_BASE = '';

export async function fetchWithAuth(url, options = {}) {
  const activeTenant = localStorage.getItem('activeTenant') || 'org_001';
  const activeRole = localStorage.getItem('activeRole') || 'ADMIN';
  const activeUserId = localStorage.getItem('activeUserId') || 'usr_admin';

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': activeTenant,
    'X-Role': activeRole,
    'X-User-Id': activeUserId
  };

  const mergedHeaders = {
    ...defaultHeaders,
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: mergedHeaders
  });

  if (!response.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const errData = await response.json();
      errorDetail = errData.detail || errData.message || JSON.stringify(errData);
    } catch (e) {
      errorDetail = await response.text();
    }
    const err = new Error(errorDetail);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

export const api = {
  // Health
  getHealth: () => fetchWithAuth('/health'),
  
  // Tenants
  getTenants: () => fetchWithAuth('/api/tenants'),
  
  // Orders
  createOrderBaseline: (data, params = {}) => {
    const qp = new URLSearchParams(params).toString();
    return fetchWithAuth(`/baseline/orders?${qp}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  createOrderSafe: (data, idempotencyKey, headers = {}, params = {}) => {
    const qp = new URLSearchParams(params).toString();
    return fetchWithAuth(`/safe/orders?${qp}`, {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
        ...headers
      },
      body: JSON.stringify(data)
    });
  },

  listOrders: (tenantId) => fetchWithAuth(`/api/orders?tenant_id=${tenantId}`),

  // Webhooks
  submitWebhook: (data, idempotencyKey) => fetchWithAuth('/api/webhooks', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(data)
  }),

  // Test Harness
  runTestHarness: (config) => fetchWithAuth('/api/test/run', {
    method: 'POST',
    body: JSON.stringify(config)
  }),

  listTestRuns: () => fetchWithAuth('/api/test/runs'),
  getTestRunDetails: (runId) => fetchWithAuth(`/api/test/runs/${runId}`),

  // Metrics
  getMetrics: () => fetchWithAuth('/api/metrics'),

  // Traces
  getTraces: (params = {}) => {
    const qp = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/traces?${qp}`);
  },

  // Audit Logs
  getAuditLogs: (tenantId) => fetchWithAuth(`/api/audit?${tenantId ? `tenant_id=${tenantId}` : ''}`),

  // Architecture & Permissions
  getArchitecture: () => fetchWithAuth('/api/architecture'),
  getPermissions: () => fetchWithAuth('/api/permissions'),

  // Stakeholder Feedback
  getStakeholderSummary: () => fetchWithAuth('/api/stakeholder/feedback'),
  submitStakeholderFeedback: (data) => fetchWithAuth('/api/stakeholder/feedback', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
