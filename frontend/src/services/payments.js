import { api } from './api';

// payload = { items: [{menuItem, quantity}], fulfillment?, address? }
export async function createPaymentIntent(payload) {
  return api('/api/payments/create-intent', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
