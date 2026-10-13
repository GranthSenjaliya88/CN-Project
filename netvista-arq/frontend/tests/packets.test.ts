import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {packetJourneys,packetStatus} from '../src/simulation/packets.ts';
const result=JSON.parse(readFileSync(new URL('./fixtures/delayed.json',import.meta.url),'utf8'));
const rows=packetJourneys(result);
test('each data and ACK transmission has a distinct journey',()=>{assert.equal(rows.length,4);assert.deepEqual(rows.map(p=>[p.kind,p.sent,p.received,p.outcome]),[['DATA',0,100,'Payload delivered'],['DATA',600,700,'Duplicate discarded'],['ACK',1000,1100,'ACK accepted'],['ACK',1600,1700,'ACK ignored']]);});
test('no future receipt is reported and backward seeking restores status',()=>{assert.equal(packetStatus(rows[1],599),'Scheduled');assert.equal(packetStatus(rows[1],650),'In transit');assert.equal(packetStatus(rows[1],700),'Duplicate discarded');assert.equal(packetStatus(rows[1],0),'Scheduled');});
test('ACK reverses sender and receiver',()=>{assert.equal(rows[2].sender,'Receiver');assert.equal(rows[2].receiver,'Sender');assert.equal(rows[2].received-rows[2].sent,100);});
