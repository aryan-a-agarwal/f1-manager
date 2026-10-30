import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCareer} from '../lib/career';
import {saveContractDraft} from '../lib/career/contracts';
import {respondToOffer} from '../lib/career/offerNegotiation';
import {appointmentBlockers,signAgreedContract,applyDueContractAppointments} from '../lib/career/contractAppointments';
import {ensureWorkforceSeason} from '../lib/career/workforce';
import {negotiationCosts} from '../lib/career/negotiation';
import {effectiveContractSeat} from '../lib/career/contractEffective';
import {driverReleaseReplacementCandidates,recordDriverReleaseAgreement} from '../lib/career/personnelFinance';
import {processFinance} from '../lib/career/financeEngine';
import {parseCareerState} from '../lib/career/validation';

function agreed(role:'race_driver'|'reserve_driver',personId:string,startDate:string){
 const c=createCareer('mclaren');const terms={startDate,endDate:`${startDate.slice(0,4)}-12-31`,clauses:[]};
 const offer={role,seat:1 as const,salaryCents:1_000_000_000,terms};
 const response=respondToOffer(undefined,offer,null,{personId,teamId:'mclaren',date:c.clock.date,roleSalaryCents:{[role]:100_000_000}});
 assert.equal(response.status,'accepted');
 return saveContractDraft(c,{id:'signed-test',personId,role,seat:1,startSeason:Number(startDate.slice(0,4)),seasons:1,salaryCents:offer.salaryCents,negotiation:terms,offerState:response});
}
test('signing a concurrent reserve does not remove the driver from their main team',()=>{
 const before=agreed('reserve_driver','oliver-bearman','2027-01-04');
 assert.deepEqual(appointmentBlockers(before,before.contractDesk!.drafts[0]),[]);
 const after=signAgreedContract(before,'signed-test'),p=after.contractDesk!.baseline.people.find(p=>p.id==='oliver-bearman')!;
 assert.equal(after.contractDesk!.drafts[0].appointment?.status,'active');
 assert.ok(after.workforce.lineups.find(l=>l.teamId==='haas'&&l.season===2027)!.driverIds.includes(p.careerDriverId!));
 assert.equal(after.workforce.lineups.find(l=>l.teamId==='mclaren'&&l.season===2027)!.reserveDriverIds![0],p.careerDriverId);
 assert.equal(signAgreedContract(after,'signed-test'),after);
 assert.equal(effectiveContractSeat(after,'mclaren','reserve_driver',1,'2027-06-01').slot?.personId,'oliver-bearman');
 const costs=negotiationCosts(after,'max-verstappen','reserve_driver',1,100_000_000,{startDate:'2027-06-01',endDate:'2027-12-31',clauses:[]});
 assert.equal(costs.occupant,'oliver-bearman');assert.ok(costs.severance!>0);
});
test('a future appointment is scheduled, activates once, and survives repeated processing',()=>{
 let c=signAgreedContract(agreed('reserve_driver','oliver-bearman','2028-01-01'),'signed-test');
 assert.equal(c.contractDesk!.drafts[0].appointment?.status,'scheduled');
 c=ensureWorkforceSeason(c,2028);c=applyDueContractAppointments(c,'2028-01-04');
 assert.equal(c.contractDesk!.drafts[0].appointment?.status,'active');
 const n=c.workforce.agreements.length;c=applyDueContractAppointments(c,'2028-01-05');assert.equal(c.workforce.agreements.length,n);
});
test('driver agreement does not invent release consent for a contracted rival race driver',()=>{
 const c=agreed('race_driver','max-verstappen','2027-01-04');
 assert.match(appointmentBlockers(c,c.contractDesk!.drafts[0]).join(' '),/team must agree their release/);
 assert.throws(()=>signAgreedContract(c,'signed-test'),/team must agree their release/);
});

test('agreed release fee without a replacement cannot charge or remove an occupied rival driver',()=>{
 const before=agreed('race_driver','max-verstappen','2027-01-04');const c=recordDriverReleaseAgreement(before,{id:'release-max',personId:'max-verstappen',fromTeamId:'red-bull',toTeamId:'mclaren',role:'race_driver',startsOn:'2027-01-04',amountCents:123_000_000,agreedOn:'2027-01-04',agreementReference:'Explicit team consent'});
 const costs=negotiationCosts(c,'max-verstappen','race_driver',1,1_000_000_000,c.contractDesk!.drafts[0].negotiation!);
 assert.equal(costs.incomingRelease.total,123_000_000);assert.equal(costs.incomingRelease.contracts[0].basis,'agreed_release');
 assert.match(appointmentBlockers(c,c.contractDesk!.drafts[0]).join(' '),/replacement/);assert.throws(()=>signAgreedContract(c,'signed-test'),/replacement/);assert.equal(c.finance!.book!.entries.length,0);assert.deepEqual(c.workforce,before.workforce);
});

test('explicit consent and a named available replacement transfer both line-ups and pay the agreed fee once',()=>{
 let c=agreed('race_driver','max-verstappen','2027-01-04');const replacement=driverReleaseReplacementCandidates(c,'red-bull',c.clock.date)[0];assert.ok(replacement);
 const originalReserve=c.workforce.agreements.filter(a=>a.personId===replacement.id&&a.teamId==='red-bull'&&a.role.startsWith('reserve_'));
 c=recordDriverReleaseAgreement(c,{id:'release-with-replacement',personId:'max-verstappen',fromTeamId:'red-bull',toTeamId:'mclaren',role:'race_driver',startsOn:c.clock.date,amountCents:123_000_000,agreedOn:c.clock.date,agreementReference:'Signed team consent with reserve promotion',replacementDriverId:replacement.id});
 assert.deepEqual(appointmentBlockers(c,c.contractDesk!.drafts[0]),[]);const signed=signAgreedContract(c,'signed-test'),driver=signed.contractDesk!.baseline.people.find(p=>p.id==='max-verstappen')!.careerDriverId!;
 assert.equal(signed.contractDesk!.drafts[0].appointment!.status,'active');assert.equal(signed.contractDesk!.drafts[0].appointment!.releaseCents,123_000_000);
 assert.equal(signed.workforce.lineups.find(l=>l.teamId==='mclaren'&&l.season===2027)!.driverIds[0],driver);assert.ok(!signed.workforce.lineups.find(l=>l.teamId==='red-bull'&&l.season===2027)!.driverIds.includes(driver));assert.ok(signed.workforce.lineups.find(l=>l.teamId==='red-bull'&&l.season===2027)!.driverIds.includes(replacement.id));
 assert.ok(signed.workforce.agreements.some(a=>a.personId===driver&&a.teamId==='red-bull'&&a.role.startsWith('driver_')&&a.terminatedOn===c.clock.date));
 assert.equal(signed.workforce.agreements.find(a=>a.id==='release-replacement:signed-test')!.salary,null);assert.equal(signed.workforce.agreements.find(a=>a.id==='release-replacement:signed-test')!.termKnown,false);
 assert.equal(signed.championship.drivers.find(d=>d.driverId===driver)!.teamId,'mclaren');assert.equal(signed.championship.drivers.find(d=>d.driverId===replacement.id)!.teamId,'red-bull');assert.equal(signed.championship.drivers.find(d=>d.driverId===replacement.id)!.points,0);
 for(const reserve of originalReserve)assert.deepEqual(signed.workforce.agreements.find(a=>a.id===reserve.id),reserve);
 assert.equal(signed.finance!.book!.entries.filter(e=>e.id==='release:signed-test:payment').length,1);assert.equal(signed.finance!.book!.entries.find(e=>e.id==='release:signed-test:payment')!.cashCents,-123_000_000);
 assert.equal(signAgreedContract(signed,'signed-test'),signed);assert.equal(processFinance(signed).finance!.book!.entries.filter(e=>e.id==='release:signed-test:payment').length,1);assert.ok(parseCareerState(JSON.stringify(signed)));
});

test('replacement choices exclude other race-seat holders and activation rechecks availability',()=>{
 const c=agreed('race_driver','max-verstappen','2027-01-04'),norris=c.workforce.lineups.find(l=>l.teamId==='mclaren'&&l.season===2027)!.driverIds[0];
 assert.throws(()=>recordDriverReleaseAgreement(c,{id:'invalid-replacement',personId:'max-verstappen',fromTeamId:'red-bull',toTeamId:'mclaren',role:'race_driver',startsOn:c.clock.date,amountCents:0,agreedOn:c.clock.date,agreementReference:'Invalid occupied selection',replacementDriverId:norris}),/available/);
 const replacement=driverReleaseReplacementCandidates(c,'red-bull',c.clock.date)[0];let ready=recordDriverReleaseAgreement(c,{id:'replacement',personId:'max-verstappen',fromTeamId:'red-bull',toTeamId:'mclaren',role:'race_driver',startsOn:c.clock.date,amountCents:0,agreedOn:c.clock.date,agreementReference:'Recorded consent',replacementDriverId:replacement.id});
 ready={...ready,weekendOperations:{...ready.weekendOperations,activeWeekendId:'active-weekend'}};assert.throws(()=>signAgreedContract(ready,'signed-test'),/weekend/);assert.equal(ready.finance!.book!.entries.length,0);
});

test('future agreed releases pay and change seats on the start date, and unavailable replacements block signing',()=>{
 let c=agreed('race_driver','max-verstappen','2027-01-15');const replacement=driverReleaseReplacementCandidates(c,'red-bull','2027-01-15')[0];
 c=recordDriverReleaseAgreement(c,{id:'future-release',personId:'max-verstappen',fromTeamId:'red-bull',toTeamId:'mclaren',role:'race_driver',startsOn:'2027-01-15',amountCents:50_000_000,agreedOn:c.clock.date,agreementReference:'Future agreed transfer and reserve promotion',replacementDriverId:replacement.id});
 const signed=signAgreedContract(c,'signed-test');assert.equal(signed.contractDesk!.drafts[0].appointment!.status,'scheduled');assert.ok(!signed.finance!.book!.entries.some(e=>e.id==='release:signed-test:payment'));
 const active=processFinance(applyDueContractAppointments({...signed,clock:{...signed.clock,date:'2027-01-15'}},'2027-01-15'));assert.equal(active.contractDesk!.drafts[0].appointment!.status,'active');assert.equal(active.finance!.book!.entries.find(e=>e.id==='release:signed-test:payment')!.cashCents,-50_000_000);
 const unavailable={...c,workforce:{...c.workforce,lineups:c.workforce.lineups.map(l=>l.teamId==='haas'?{...l,driverIds:[replacement.id,l.driverIds[1]] as [string,string]}:l)}};
 assert.match(appointmentBlockers(unavailable,unavailable.contractDesk!.drafts[0]).join(' '),/no longer available/);assert.throws(()=>signAgreedContract(unavailable,'signed-test'),/no longer available/);
});
