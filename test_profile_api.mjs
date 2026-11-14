import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extractProfile} from './profile-api.mjs';

const profile = Object.fromEntries(['name','role','met','city','phone','email','notes','gender','pronouns','appearance'].map(field => [field, field === 'name' ? 'Jamie Rivera' : '']));
profile.events = [];
profile.tags = [];
const reply = (payload, status = 200, type = 'application/json') => ({ok:status < 400, status, headers:new Headers({'Content-Type':type}), json:async()=>payload});

test('sends the note and returns a valid profile twice', async () => {
  let calls = 0;
  const fetcher = async (url, options) => {
    assert.equal(url, '/api/profile');
    assert.equal(JSON.parse(options.body).note, 'I met Jamie.');
    calls++;
    return reply({profile});
  };
  for (let i=0; i<2; i++) assert.deepEqual(await extractProfile('I met Jamie.', fetcher), profile);
  assert.equal(calls, 2);
});
test('Live Server HTML error is identified as wrong server', async () => {
  await assert.rejects(extractProfile('Jamie', async()=>reply(null,405,'text/html')), error => error.code === 'WRONG_SERVER' && error.message.includes('5500'));
});
test('opening a file directly never sends the note', async () => {
  await assert.rejects(extractProfile('Jamie', ()=>assert.fail('must not fetch'), {protocol:'file:'}), {code:'WRONG_SERVER'});
});
test('network failure gives startup instructions', async () => {
  await assert.rejects(extractProfile('Jamie', async()=>{throw new TypeError('Failed to fetch');}), /Keep the terminal running/);
});
test('Gemini errors remain visible', async () => {
  await assert.rejects(extractProfile('Jamie', async()=>reply({error:'Gemini quota is exhausted.'},503)), /Gemini quota/);
});
test('invalid JSON is not mislabeled as an unreachable server', async () => {
  await assert.rejects(extractProfile('Jamie', async()=>({...reply(null),json:async()=>{throw new SyntaxError();}})), /unreadable data/);
});
test('wrong field types cannot crash profile form', async () => {
  await assert.rejects(extractProfile('Jamie', async()=>reply({profile:{...profile,tags:'wrong'}})), /invalid profile/);
});
