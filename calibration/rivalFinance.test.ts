import assert from 'node:assert/strict';
import test from 'node:test';
import {createCareer} from '../lib/career/createCareer';
import {recordOpeningPosition,saveFinanceBudget,setFinanceCoverage} from '../lib/career/financeOperations';
import {assessRivalFinanceDecision,executeRivalFinancePlan,financeTeamCareer,processRivalFinances,saveFinanceTeamCareer,type RivalFinanceProposal} from '../lib/career/rivalFinance';
import type {CareerState} from '../lib/career/types';
const ready=()=>{
 let c=createCareer('mclaren');let rival=financeTeamCareer(c,'ferrari');
 rival=recordOpeningPosition(rival,{asOf:rival.clock.date,cashCents:50_000_000_000,restrictedCents:0,debtCents:0,basis:'scenario',note:'Explicit test scenario, not a real-world budget'});
 rival=setFinanceCoverage(rival,{funding:true,operating:true});rival=saveFinanceBudget(rival,{id:'development-2027',year:2027,department:'development',limitCents:500_000_000,approvedOn:rival.clock.date,note:'Recorded development allocation'});
 return saveFinanceTeamCareer(c,rival);
};
const proposal=(id:string,amount=100_000_000):RivalFinanceProposal=>({id,title:'Recorded development proposal',priority:'strategic',objective:'Fund the recorded front-wing specification',reserveCents:0,obligation:{id:`plan:${id}`,sourceId:`proposal:${id}`,description:'Agreed development work',counterparty:'Recorded supplier',category:'development',recognitionDate:'2027-01-20',dueDate:'2027-01-20',amountCents:-amount,relevantCents:amount,basis:'career_action'}});

test('examining an unconfigured rival invents no cash or commitments and does not change the player',()=>{
 const c=createCareer('mclaren'),before=structuredClone(c);const view=financeTeamCareer(c,'ferrari');assert.equal(view.player.teamId,'ferrari');assert.equal(view.finance!.book!.cashKnown,false);assert.equal(view.finance!.book!.entries.length,0);assert.deepEqual(c,before);
 assert.equal(assessRivalFinanceDecision(c,'ferrari',proposal('unknown')).decision,'defer');
});
test('each team retains an independent opening position and financial history',()=>{
 const c=ready();assert.equal(c.player.teamId,'mclaren');assert.equal(c.finance!.book!.cashKnown,false);assert.equal(financeTeamCareer(c,'ferrari').finance!.cashBalance,500_000_000);assert.equal(financeTeamCareer(c,'haas').finance!.book!.cashKnown,false);
 assert.throws(()=>financeTeamCareer(c,'unknown-team'),/recorded/);
});
test('discretionary decisions require recorded coverage, objective and department approval',()=>{
 const c=ready();assert.equal(assessRivalFinanceDecision(c,'ferrari',proposal('wing')).decision,'approve');
 assert.equal(assessRivalFinanceDecision(c,'ferrari',{...proposal('no-objective'),objective:''}).decision,'defer');
 assert.equal(assessRivalFinanceDecision(c,'ferrari',{...proposal('no-budget'),obligation:{...proposal('no-budget').obligation,category:'facilities'}}).decision,'defer');
 assert.equal(assessRivalFinanceDecision(c,'ferrari',proposal('too-large',600_000_000)).decision,'decline');
});
test('accepted proposals consume the budget before later proposals are considered, and replay is idempotent',()=>{
 const c=ready(),plans=[proposal('first',300_000_000),proposal('second',300_000_000)];const result=executeRivalFinancePlan(c,'ferrari',plans);
 assert.equal(result.decisions[0].decision,'approve');assert.equal(result.decisions[1].decision,'decline');assert.deepEqual(result.career.finance!.book,c.finance!.book);assert.equal(financeTeamCareer(result.career,'ferrari').finance!.book!.obligations.filter(o=>o.sourceId.startsWith('proposal:')).length,1);
 const repeated=executeRivalFinancePlan(result.career,'ferrari',plans);assert.equal(financeTeamCareer(repeated.career,'ferrari').finance!.book!.obligations.filter(o=>o.sourceId.startsWith('proposal:')).length,1);
});
test('calendar processing settles only explicitly recorded rival books and preserves player identity',()=>{
 let c=executeRivalFinancePlan(ready(),'ferrari',[proposal('delivery')]).career;const player=structuredClone(c.finance!.book);
 c=processRivalFinances({...c,clock:{...c.clock,date:'2027-01-20'}},'2027-01-20');const rival=financeTeamCareer(c,'ferrari');assert.equal(c.player.teamId,'mclaren');assert.deepEqual(c.finance!.book,player);assert.ok(rival.finance!.book!.entries.some(e=>e.id==='plan:delivery:payment'));assert.deepEqual(processRivalFinances(c,'2027-01-20').finance,c.finance);
});
