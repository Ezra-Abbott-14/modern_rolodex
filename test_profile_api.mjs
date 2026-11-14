import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extractProfile, populateProfileForm} from './profile-api.mjs';

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
test('opening a file directly explains that a web server is required', async () => {
  await assert.rejects(extractProfile('Jamie', () => assert.fail('must not fetch'), {protocol:'file:'}), {code:'WRONG_SERVER'});
});

test('profile form fills events and tags even when optional pronouns field is hidden', () => {
  const fields=Object.fromEntries(['name','appearance','events','tags'].map(name=>[name,{value:''}]));
  const form={elements:{namedItem:name=>fields[name] || null}};
  populateProfileForm(form,{...profile,appearance:'Red glasses',events:['Gallery show','Book club'],tags:['art','books']});
  assert.equal(fields.name.value,'Jamie Rivera');
  assert.equal(fields.appearance.value,'Red glasses');
  assert.equal(fields.events.value,'Gallery show\nBook club');
  assert.equal(fields.tags.value,'art, books');
});
test('network failure gives startup instructions', async () => {
  await assert.rejects(extractProfile('Jamie', async()=>{throw new TypeError('Failed to fetch');}), /Keep the terminal running/);
});

test('Live Server calls the Python backend instead of its static server', async () => {
  for (const hostname of ['localhost', '127.0.0.1']) {
    const fetcher = async url => {
      assert.equal(url, `http://${hostname}:8000/api/profile`);
      return reply({profile});
    };
    assert.deepEqual(await extractProfile('Jamie', fetcher, {protocol:'http:',hostname,port:'5500'}), profile);
  }
});

test('other hosts and custom backend ports stay same-origin', async () => {
  for (const page of [{protocol:'http:',hostname:'localhost',port:'9000'}, {protocol:'https:',hostname:'example.com',port:''}]) {
    await extractProfile('Jamie', async url => {assert.equal(url,'/api/profile');return reply({profile});}, page);
  }
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
