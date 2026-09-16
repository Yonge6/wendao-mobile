import test from 'node:test';
import assert from 'node:assert/strict';
import { subscriptionOffer } from '../src/companion/subscriptionOffer.ts';
const product = { displayPrice: '¥698.00', introOfferEligible: true, introductoryOffer: { displayPrice: '¥140.00', periodUnit: 'year', periodValue: 1, periodCount: 1, paymentMode: 'payUpFront' } };
test('eligible annual offer is a single upfront year, not a monthly price', () => {
  assert.deepEqual(subscriptionOffer(product, 'zh'), { price: '¥140.00', terms: '前 1 年共 ¥140.00' });
  assert.match(subscriptionOffer(product, 'en').terms, /total for the first 1 year$/);
});
test('ineligible, unknown and missing offers never advertise a discount', () => {
  for (const p of [undefined, {}, {...product, introOfferEligible: false}, {...product, introOfferEligible: undefined}, {...product, introductoryOffer: undefined}]) assert.equal(subscriptionOffer(p, 'zh'), null);
});
test('invalid or future offer formats fail closed', () => {
  for (const change of [{periodUnit:'unknown'}, {periodValue:0}, {periodCount:0}, {paymentMode:'unknown'}]) assert.equal(subscriptionOffer({...product, introductoryOffer:{...product.introductoryOffer,...change}}, 'en'), null);
});
test('pay as you go discloses repeat charges and total duration', () => {
  const result = subscriptionOffer({...product, introductoryOffer:{...product.introductoryOffer,periodUnit:'month',periodCount:3,paymentMode:'payAsYouGo'}}, 'en');
  assert.equal(result.terms, '¥140.00 every 1 month for the first 3 months');
});
