import { getValidIfoodToken } from './ifood-token';

const BASE = 'https://merchant-api.ifood.com.br';

// ---------------------------------------------------------------------------
// Generic authenticated fetch
// ---------------------------------------------------------------------------
export async function ifoodFetch<T = unknown>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    extraHeaders?: Record<string, string>;
  } = {},
): Promise<{ data: T; status: number }> {
  const token = await getValidIfoodToken();
  const { method = 'GET', body, extraHeaders = {} } = options;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`iFood ${method} ${path} → ${res.status}: ${text}`);
  }

  // 202 Accepted / empty bodies
  const contentLength = res.headers.get('content-length');
  if (res.status === 202 || contentLength === '0') {
    return { data: {} as T, status: res.status };
  }

  const text = await res.text();
  if (!text) return { data: {} as T, status: res.status };

  return { data: JSON.parse(text) as T, status: res.status };
}

// ---------------------------------------------------------------------------
// Polling
// ---------------------------------------------------------------------------
export interface IfoodEvent {
  id: string;
  code: string;
  fullCode: string;
  orderId: string;
  merchantId: string;
  createdAt: string;
  metadata?: Record<string, string>;
}

export async function pollIfoodEvents(merchantIds: string[]): Promise<IfoodEvent[]> {
  const token = await getValidIfoodToken();

  const res = await fetch(`${BASE}/order/v1.0/events:polling`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-polling-merchants': merchantIds.join(','),
    },
  });

  if (res.status === 204) return [];
  if (!res.ok) throw new Error(`Polling failed: ${res.status}`);

  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text) as IfoodEvent[];
}

export async function acknowledgeIfoodEvents(
  events: Array<{ id: string; code: string; fullCode: string }>,
) {
  const token = await getValidIfoodToken();

  await fetch(`${BASE}/order/v1.0/events/acknowledgment`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ events }),
  });
}

// ---------------------------------------------------------------------------
// Order lifecycle helpers
// ---------------------------------------------------------------------------
export async function confirmOrder(orderId: string) {
  return ifoodFetch(`/order/v1.0/orders/${orderId}/confirm`, { method: 'POST', body: {} });
}

export async function startPreparation(orderId: string) {
  return ifoodFetch(`/order/v1.0/orders/${orderId}/startPreparation`, { method: 'POST', body: {} });
}

export async function dispatchOrder(orderId: string) {
  return ifoodFetch(`/order/v1.0/orders/${orderId}/dispatch`, { method: 'POST', body: {} });
}

export async function readyToPickup(orderId: string) {
  return ifoodFetch(`/order/v1.0/orders/${orderId}/readyToPickup`, { method: 'POST', body: {} });
}

export async function requestCancellation(
  orderId: string,
  cancellationCode: string,
) {
  return ifoodFetch(`/order/v1.0/orders/${orderId}/requestCancellation`, {
    method: 'POST',
    body: { cancellationCode },
  });
}

export async function getOrderDetails(orderId: string) {
  return ifoodFetch<IfoodOrderPayload>(`/order/v1.0/orders/${orderId}`);
}

export async function getCancellationReasons(orderId: string) {
  return ifoodFetch<IfoodCancellationReason[]>(
    `/order/v1.0/orders/${orderId}/cancellationReasons`,
  );
}

// ---------------------------------------------------------------------------
// Payload types (subset of iFood spec)
// ---------------------------------------------------------------------------
export interface IfoodOrderBenefit {
  target?: string;
  value?: number;
  sponsorshipValues?: Array<{ name: string; value: number; description?: string }>;
}

export interface IfoodOrderPayload {
  id: string;
  displayId: string;
  orderType: string;
  orderTiming: string;
  isTest: boolean;
  createdAt: string;
  scheduledDateTimeForDelivery?: string;
  preparationStartDateTime?: string;
  observations?: string;
  merchant: { id: string; name: string };
  customer?: {
    name?: string;
    phone?: { number?: string; localizer?: string };
    taxPayerIdentificationNumber?: string;
    documentNumber?: string;
  };
  delivery?: {
    mode?: string;
    deliveredBy?: string;
    deliveryDateTime?: string;
    deliveryAddress?: {
      streetName?: string;
      streetNumber?: string;
      complement?: string;
      formattedAddress?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      reference?: string;
    };
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    options?: Array<{ name: string; price: number; quantity?: number }>;
    observations?: string;
  }>;
  payments: {
    prepaid?: number;
    pending?: number;
    methods?: Array<{ value: number; method: string; type: string; cash?: { changeFor?: number } }>;
  };
  total: {
    subTotal: number;
    deliveryFee?: number;
    additionalFees?: number;
    benefits?: number;
    orderAmount: number;
  };
  benefits?: IfoodOrderBenefit[];
}

export interface IfoodCancellationReason {
  cancelCodeId: string;
  description: string;
}
