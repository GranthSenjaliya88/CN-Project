import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deriveState,nextEventTime,eventsAtTime} from '../src/simulation/playback.ts';
import {validateConfig,DEFAULT_CONFIG,sameConfig} from '../src/services/config.ts';
import {eventCSV,comparisonCSV,csvCell} from '../src/services/exports.ts';
import {assertResult} from '../src/services/api.ts';
const delayed=JSON.parse(readFileSync(new URL('./fixtures/delayed.json',import.meta.url),'utf8'));
for(const [time,tx,dup,delivered,acks] of [[0,1,0,0,0],[100,1,0,1,0],[600,2,0,1,0],[700,2,1,1,0],[1100,2,1,1,1],[1700,2,1,1,2]]){
 test(`playback at ${time}ms matches the Python trace`,()=>{
  const s=deriveState(delayed,time);
  assert.deepEqual([s.metrics.transmissions,s.metrics.duplicates,s.metrics.delivered,s.metrics.acksSent],[tx,dup,delivered,acks]);
 });
}
test('completion does not wait for trailing ACK',()=>{assert.equal(deriveState(delayed,1100).metrics.completionTime,1100);assert.equal(deriveState(delayed,1700).metrics.completionTime,1100);});
test('packet positions use only simulation timestamps',()=>{const s=deriveState(delayed,650);assert.equal(s.inFlight.length,1);assert.equal(s.inFlight[0].isRetransmission,true);assert.equal(s.inFlight[0].launchTimeMs,600);assert.equal(s.inFlight[0].arriveTimeMs,700);});
test('seeking backward restores state without mutating results',()=>{const before=JSON.stringify(delayed);deriveState(delayed,1700);assert.equal(deriveState(delayed,50).metrics.delivered,0);assert.equal(JSON.stringify(delayed),before);});
test('next event includes all coincident events',()=>{assert.equal(nextEventTime(delayed.events,0),100);assert.equal(eventsAtTime(delayed.events,100).length,3);});
test('timer restarts and is cancelled by ACK',()=>{assert.equal(deriveState(delayed,700).sender.timerStartMs,600);assert.equal(deriveState(delayed,1100).sender.timerStartMs,null);});
for(const value of [NaN,Infinity,-1,0,1.5,21])test(`reject frame count ${value}`,()=>assert.ok(validateConfig({...DEFAULT_CONFIG,num_frames:value}).num_frames));
for(const key of ['data_travel_ms','ack_delay_ms','ack_travel_ms','timeout_ms'] as const)test(`validate ${key}`,()=>{assert.ok(validateConfig({...DEFAULT_CONFIG,[key]:NaN})[key]);assert.ok(validateConfig({...DEFAULT_CONFIG,[key]:3600001})[key]);});
test('zero receiver ACK delay is valid',()=>assert.deepEqual(validateConfig({...DEFAULT_CONFIG,ack_delay_ms:0}),{}));
test('stale settings can return to matching configuration',()=>{assert.ok(sameConfig(DEFAULT_CONFIG,{...DEFAULT_CONFIG}));assert.ok(!sameConfig(DEFAULT_CONFIG,{...DEFAULT_CONFIG,ack_delay_ms:900}));});
test('event CSV includes settings and escapes quotes',()=>{const csv=eventCSV(delayed);assert.ok(csv.includes('"model_version"'));assert.ok(csv.includes('"900"'));assert.equal(csvCell('a,"b"'),'"a,""b"""');assert.equal(csv.split('\r\n').length,delayed.events.length+1);});
test('comparison CSV contains complete settings',()=>{const csv=comparisonCSV([{id:'1',label:'Test',config:delayed.config,metrics:delayed.metrics,timestamp:0}]);assert.ok(csv.includes('"Data travel (ms)"'));assert.ok(csv.includes('"1100"'));});
test('invalid API payload is rejected before playback',()=>{for(const bad of [null,{}, {success:true}, {...delayed,events:[{time_ms:NaN}]}])assert.throws(()=>assertResult(bad));assert.doesNotThrow(()=>assertResult(delayed));});

for(const value of [600000,600001,3600000])test(`extended timing ${value} accepted`,()=>assert.deepEqual(validateConfig({num_frames:1,data_travel_ms:value,ack_delay_ms:value,ack_travel_ms:value,timeout_ms:value}),{}));
