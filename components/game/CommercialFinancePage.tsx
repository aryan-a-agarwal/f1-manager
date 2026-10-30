'use client';

import {useState} from 'react';
import {useSectionTab} from './ManagementShell';
import FinanceWorkspacePanels,{FinanceRecordForm,FinanceRecords,formatFinanceMoney,formCents,formText,financeRecordId,saveFinanceMutation,type FinanceWorkspaceProps} from './FinanceWorkspacePanels';
import {championshipFinanceState,recordChampionshipPrizePolicy,awardChampionshipEntitlement} from '@/lib/career/championshipFinance';
import {getFinanceOperations} from '@/lib/career/financeOperations';
import {teams} from '@/lib/data/grid';

function PaymentDates(){
  const [rows,setRows]=useState([0]);
  return <div className="finance-schedule-editor"><h3>Distribution payment dates</h3><p className="finance-note">The entitlement is split equally across the dates recorded here. Rounding is reconciled in the final instalment.</p><input type="hidden" name="paymentCount" value={rows.length}/><div className="finance-form-grid">{rows.map((_,index)=><label key={index}>Payment {index+1}<input type="date" name={`paymentDate${index}`} required/></label>)}</div><button type="button" onClick={()=>setRows(current=>[...current,current.length])}>Add payment date</button>{rows.length>1&&<button type="button" onClick={()=>setRows(current=>current.slice(0,-1))}>Remove last date</button>}</div>;
}

export default function CommercialFinancePage(props:FinanceWorkspaceProps){
  const {career}=props,[tab,setTab]=useSectionTab<'prize'|'sponsors'>('prize');
  const championship=championshipFinanceState(career),operations=getFinanceOperations(career);
  const commercial=operations.agreements.filter(agreement=>['sponsorship','merchandise','hospitality','licensing'].includes(agreement.kind));
  return <div className="finance-page">
    <div className="finance-heading"><div><small>COMMERCIAL · USD</small><h1>{tab==='sponsors'?'Commercial agreements':'Championship distributions'}</h1></div><span>{career.season.year} season</span></div>
    <nav className="finance-local-tabs" aria-label="Commercial pages"><button aria-current={tab==='prize'?'page':undefined} onClick={()=>setTab('prize')}>Prize money & merchandise</button><button aria-current={tab==='sponsors'?'page':undefined} onClick={()=>setTab('sponsors')}>Sponsors</button></nav>
    {tab==='sponsors'?<>
      <FinanceRecords title="Recorded commercial agreements" headers={['Agreement','Counterparty','Type','Payment / frequency','Status']} rows={commercial.map(agreement=>[agreement.title,operations.counterparties.find(party=>party.id===agreement.partyId)?.name??'Not recorded',agreement.kind,`${formatFinanceMoney(agreement.amountCents)} · ${agreement.frequency}`,agreement.status])} empty="No sponsors or commercial income agreements are recorded. The game creates no automatic commercial receipts."/>
      <FinanceWorkspacePanels {...props} tab="agreements"/>
    </>:<>
      <section className="finance-panel"><h2>Recorded distribution policy</h2><p>Championship money becomes a receivable after the standings are finalised. The payout table and payment dates must come from a recorded agreement or a deliberately chosen game rule.</p><p className="finance-note">No real-world payout formula is assumed. Merchandise, hospitality and licensing receipts are recorded through commercial agreements.</p><button className="finance-link" onClick={()=>setTab('sponsors')}>Manage commercial agreements →</button></section>
      <FinanceRecords title="Distribution policies" headers={['Year / policy','Origin','Position payouts','Payment dates','Source']} rows={championship.policies.map(policy=>[
        `${policy.year} · ${policy.name}`,policy.basis,<details key="payouts"><summary>{policy.payoutsCents.length} positions</summary>{policy.payoutsCents.map((amount,index)=><p key={index}>Position {index+1}: {formatFinanceMoney(amount)}</p>)}</details>,<span key="dates">{policy.paymentDates.map(on=><small key={on}>{on}</small>)}</span>,policy.reference,
      ])} empty="No championship distribution policy has been recorded."/>
      <FinanceRecordForm title="Record a championship distribution policy" description="Enter every constructor position explicitly, including zero if no payment is due. Distribution dates must be at or after the reporting year end." submit="Save distribution policy" fields={[
        {name:'year',label:'Championship year',type:'number',step:'1',min:String(career.season.year),required:true},{name:'name',label:'Policy / agreement name',required:true},{name:'basis',label:'Origin',required:true,options:[{value:'recorded',label:'Recorded agreement / evidence'},{value:'scenario',label:'Chosen game rule'}]},
        ...career.championship.teams.map((_,index)=>({name:`payout${index}`,label:`Position ${index+1} payout · USD`,type:'number' as const,min:'0',step:'0.01',required:true})),
        {name:'reference',label:'Source, agreement or game-rule decision',type:'textarea',required:true},
      ]} onSubmit={data=>{
        const count=Number(data.get('paymentCount')??0);
        saveFinanceMutation(props,recordChampionshipPrizePolicy(career,{id:financeRecordId('prize-policy'),year:Number(formText(data,'year')),name:formText(data,'name'),basis:formText(data,'basis') as 'recorded'|'scenario',reference:formText(data,'reference'),payoutsCents:career.championship.teams.map((_,index)=>formCents(data,`payout${index}`)!),paymentDates:Array.from({length:count},(_,index)=>formText(data,`paymentDate${index}`))}));
      }}><PaymentDates/></FinanceRecordForm>
      <FinanceRecords title="Awarded entitlements" headers={['Season','Team','Final position','Entitlement','Awarded']} rows={championship.entitlements.map(entitlement=>[
        entitlement.year,teams.find(team=>team.id===entitlement.teamId)?.name??entitlement.teamId,entitlement.position,formatFinanceMoney(entitlement.amountCents),entitlement.awardedOn,
      ])} empty="No championship entitlement has been awarded. Finalising a completed season checks its recorded policy."/>
      {championship.policies.length>0&&<FinanceRecordForm title="Check a finalised championship" description="Awarding checks completed standings and the recorded policy. Repeating the check cannot award the same entitlement twice." submit="Check entitlement" fields={[
        {name:'year',label:'Recorded policy year',required:true,options:championship.policies.map(policy=>({value:String(policy.year),label:`${policy.year} · ${policy.name}`}))},
      ]} onSubmit={data=>saveFinanceMutation(props,awardChampionshipEntitlement(career,Number(formText(data,'year'))))}/>}
    </>}
  </div>;
}
