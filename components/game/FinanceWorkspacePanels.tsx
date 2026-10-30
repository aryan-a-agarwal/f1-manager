'use client';
import {INVOICE_TEMPLATES} from '@/lib/career/financeOperations';

import {useState,type FormEvent,type ReactNode} from 'react';
import type {CareerState} from '@/lib/career/types';
import {saveCareer} from '@/lib/career/storage';
import {
  getFinanceOperations,financeOperationsSummary,financeForecast,recordOpeningPosition,saveFinanceCounterparty,
  createFinanceAgreement,amendFinanceAgreement,cancelFinanceAgreement,recordFinanceInvoice,settleFinanceInvoice,
  refundFinanceInvoice,creditFinanceInvoice,cancelFinanceInvoice,disputeFinanceInvoice,saveFinanceBudget,
  saveFinanceScenario,setFinanceCoverage,closeFinancePeriod,recordFinanceOwnershipTransfer,saveFinanceOwner,recordFinanceStake,recordFinanceRules,
  classifyFinanceInvoice,recordFinanceFinding,
  loanOutstandingCents,repayFinanceLoanEarly,
} from '@/lib/career/financeOperations';
import {currentFinanceRules,registerFinanceAsset,recordOpeningFinanceAsset,disposeFinanceAsset} from '@/lib/career/financeEngine';
import type {FinanceCategory} from '@/lib/career/financeTypes';
import type {FinanceAccount,FinanceAgreementInput,FinanceAgreementKind,FinanceBasis,FinanceClassification,FinanceCounterparty,FinanceInstalment,FinanceComplianceFinding} from '@/lib/career/financeOperationsTypes';
import {teams} from '@/lib/data/grid';

export type FinanceWorkspaceProps={career:CareerState;updateCareer:(career:CareerState)=>void};
export const formatFinanceMoney=(amount:number|null|undefined)=>amount==null?'Not set':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(amount/100);
export const financeRecordId=(prefix:string)=>`${prefix}:${crypto.randomUUID()}`;
export const formText=(data:FormData,key:string)=>String(data.get(key)??'').trim();
export function formCents(data:FormData,key:string,optional=false):number|null {
  const value=formText(data,key);
  if(optional&&!value)return null;
  if(!/^-?\d+(?:\.\d{1,2})?$/.test(value))throw new Error('Enter money as a number with at most two decimal places.');
  const amount=Math.round(Number(value)*100);
  if(!Number.isSafeInteger(amount))throw new Error('The amount is too large.');
  return amount;
}
export type FinanceField={name:string;label:string;type?:'text'|'number'|'date'|'textarea';required?:boolean;optional?:boolean;min?:string;max?:string;step?:string;help?:string;options?:{value:string;label:string}[]};

export function FinanceRecordForm({title,description,fields,submit,onSubmit,children}:{title:string;description?:string;fields:FinanceField[];submit:string;onSubmit:(data:FormData)=>void;children?:ReactNode}){
  const [error,setError]=useState(''),[success,setSuccess]=useState('');
  function handleSubmit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget;
    try{onSubmit(new FormData(form));setError('');setSuccess('Saved in this career.');form.reset();}
    catch(cause){setSuccess('');setError(cause instanceof Error?cause.message:'This record could not be saved.');}
  }
  return <section className="finance-panel finance-record-form"><h2>{title}</h2>{description&&<p className="finance-note">{description}</p>}
    <form onSubmit={handleSubmit}>
      <div className="finance-form-grid">{fields.map(field=><label key={field.name} className={field.type==='textarea'?'finance-form-wide':undefined}><span>{field.label}{field.optional&&<small> Optional</small>}</span>
        {field.options?<select name={field.name} required={field.required} defaultValue=""><option value="">Select…</option>{field.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>:field.type==='textarea'?<textarea name={field.name} required={field.required} rows={3}/>:<input name={field.name} type={field.type??'text'} required={field.required} min={field.min} max={field.max} step={field.step??(field.type==='number'?'0.01':undefined)}/>}
        {field.help&&<small>{field.help}</small>}
      </label>)}</div>{children}
      <div className="finance-form-footer"><button className="finance-primary" type="submit">{submit}</button>{error&&<p role="alert" className="finance-negative">{error}</p>}{success&&<p role="status" className="finance-positive">{success}</p>}</div>
    </form>
  </section>;
}

export function FinanceRecordAction({label,run,disabled=false}:{label:string;run:()=>void;disabled?:boolean}){
  const [error,setError]=useState('');
  return <span className="finance-record-action"><button type="button" disabled={disabled} onClick={()=>{try{run();setError('');}catch(cause){setError(cause instanceof Error?cause.message:'The action failed.');}}}>{label}</button>{error&&<small className="finance-negative" role="alert">{error}</small>}</span>;
}

export function FinanceRecords({title,headers,rows,empty}:{title:string;headers:string[];rows:ReactNode[][];empty:string}){
  return <section className="finance-panel"><div className="finance-panel-title"><h2>{title}</h2><span className="finance-note">{rows.length} records</span></div>{rows.length?<table className="finance-table"><thead><tr>{headers.map(header=><th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((cells,index)=><tr key={index}>{cells.map((cell,column)=><td key={column}>{cell}</td>)}</tr>)}</tbody></table>:<p className="finance-empty">{empty}</p>}</section>;
}

export function saveFinanceMutation(props:FinanceWorkspaceProps,next:CareerState){props.updateCareer(saveCareer(next));}

const categoryOptions:{value:FinanceCategory;label:string}[]=[
  {value:'owner_funding',label:'Owner funding'},{value:'sponsorship',label:'Sponsorship'},{value:'prize_receipts',label:'Championship distributions'},
  {value:'commercial_income',label:'Commercial income'},{value:'driver_pay',label:'Driver payroll'},{value:'driver_bonus',label:'Driver bonuses'},
  {value:'contract_exit',label:'Contract exits'},{value:'staff_pay',label:'Staff payroll'},{value:'facilities',label:'Facilities'},{value:'travel',label:'Travel'},
  {value:'development',label:'Development'},{value:'production',label:'Production'},{value:'capital',label:'Capital investment'},{value:'depreciation',label:'Depreciation'},{value:'other',label:'Other'},
];
const classificationOptions=[{value:'relevant',label:'Relevant'},{value:'excluded',label:'Excluded'},{value:'mixed',label:'Mixed'},{value:'unresolved',label:'Needs review'}];
const basisOptions=[{value:'recorded',label:'Recorded agreement / evidence'},{value:'scenario',label:'Chosen game scenario'}];
const yesNo=[{value:'yes',label:'Yes'},{value:'no',label:'No'}];
const accountOptions: {value:FinanceAccount;label:string}[]=[{value:'revenue',label:'Revenue'},{value:'expenses',label:'Operating expense'},{value:'prepayments',label:'Prepayment / deposit'},{value:'inventory',label:'Inventory / work in progress'},{value:'fixed_assets',label:'Fixed asset'},{value:'loans',label:'Loan principal'},{value:'equity',label:'Owner equity'}];
const currencyField=(name:string,label:string,optional=false):FinanceField=>({name,label,type:'number',required:!optional,optional,min:'0',step:'0.01'});
const percent=(data:FormData,key:string)=>formText(data,key)?Number(formText(data,key)):0;
const partyOptions=(career:CareerState)=>getFinanceOperations(career).counterparties.map(p=>({value:p.id,label:p.name}));
const categoryLabel=(category:string)=>categoryOptions.find(option=>option.value===category)?.label??category;
const human=(value:string)=>value.replaceAll('_',' ');
const accountFor=(data:FormData,kind?:string):FinanceAccount=>(formText(data,'account')||(kind==='owner_equity'?'equity':kind==='loan'?'loans':formText(data,'direction')==='income'?'revenue':'expenses')) as FinanceAccount;
const relevantPercent=(data:FormData)=>formText(data,'classification')==='relevant'?100:formText(data,'classification')==='mixed'?percent(data,'relevantPercent'):0;
const centsRequired=(data:FormData,key:string)=>formCents(data,key)!;
const positiveInteger=(data:FormData,key:string)=>{const value=Number(formText(data,key));if(!Number.isInteger(value)||value<1)throw new Error('Enter a whole number greater than zero.');return value;};

function InstalmentFields(){
  const [rows,setRows]=useState<number[]>([]);
  return <details className="finance-schedule-editor"><summary>Set an exact instalment schedule</summary><p className="finance-note">An explicit schedule replaces the frequency schedule. Enter the full agreed instalment list.</p><input name="instalmentCount" type="hidden" value={rows.length}/>{rows.map((_,index)=><div className="finance-form-grid" key={index}><label>Payment date<input name={`instalmentDue${index}`} type="date" required/></label><label>Recognition date<input name={`instalmentRecognition${index}`} type="date" required/></label><label>Amount · USD<input name={`instalmentAmount${index}`} type="number" min="0.01" step="0.01" required/></label></div>)}<button type="button" onClick={()=>setRows(current=>[...current,current.length])}>Add instalment</button>{rows.length>0&&<button type="button" onClick={()=>setRows(current=>current.slice(0,-1))}>Remove last instalment</button>}</details>;
}
function instalments(data:FormData):FinanceInstalment[]|undefined{
  const count=Number(data.get('instalmentCount')??0);if(!count)return undefined;
  return Array.from({length:count},(_,index)=>({id:financeRecordId('instalment'),dueDate:formText(data,`instalmentDue${index}`),recognitionDate:formText(data,`instalmentRecognition${index}`),amountCents:centsRequired(data,`instalmentAmount${index}`)}));
}

function OpeningPanel(props:FinanceWorkspaceProps){
  const {career}=props,summary=financeOperationsSummary(career),opening=summary.operations.opening;
  return <>
    <FinanceRecords title="Recorded opening position" headers={['Balance date','Cash','Restricted funds','Debt','Origin']} rows={opening?[[opening.asOf,formatFinanceMoney(opening.cashCents),formatFinanceMoney(opening.restrictedCents),formatFinanceMoney(opening.debtCents),<span key="origin">{human(opening.basis)}<small>{opening.note}</small></span>]]:[]} empty="Opening balances have not been recorded. Blank values remain unknown."/>
    <FinanceRecordForm title={opening?'Update the balance record':'Record an opening position'} description="Use a dated balance from records or deliberately choose a game starting position. Leaving an amount blank keeps it unknown; entering zero records that it is zero." submit="Save opening position" fields={[
      {name:'asOf',label:'Balance date',type:'date',required:true,min:career.clock.date,max:career.clock.date,help:`Record the balance as at today, ${career.clock.date}.`},currencyField('cash','Bank cash balance · USD',true),currencyField('restricted','Restricted part of bank cash · USD',true),currencyField('debt','Outstanding debt · USD',true),
      {name:'basis',label:'Origin',required:true,options:basisOptions},{name:'note',label:'Evidence or scenario reason',type:'textarea',required:true},
    ]} onSubmit={data=>saveFinanceMutation(props,recordOpeningPosition(career,{asOf:formText(data,'asOf'),cashCents:formCents(data,'cash',true),restrictedCents:formCents(data,'restricted',true),debtCents:formCents(data,'debt',true),basis:formText(data,'basis') as FinanceBasis,note:formText(data,'note')}))}/>
    <section className="finance-panel"><h2>Complete the starting records</h2><p className="finance-note">Add opening receivables and payables as invoices, existing loans as agreements, and owned equipment in the asset register. Their balances stay separate from new funding and income.</p><ul className="finance-checklist"><li>Record funding agreements and payment dates.</li><li>Record outstanding bills and earned receipts.</li><li>Record debt terms and assets where known.</li><li>Review the forecast before enabling new commitments.</li></ul></section>
    <FinanceRecordForm title="Confirm forecast coverage" description="These confirmations describe whether the records are complete. They create no payments and no funding." submit="Save coverage review" fields={[
      {name:'funding',label:'All existing funding and income arrangements recorded',required:true,options:yesNo},{name:'operating',label:'All existing operating commitments recorded',required:true,options:yesNo},
    ]} onSubmit={data=>saveFinanceMutation(props,setFinanceCoverage(career,{funding:formText(data,'funding')==='yes',operating:formText(data,'operating')==='yes'}))}/>
  </>;
}

function AgreementPanel(props:FinanceWorkspaceProps){
  const {career}=props,operations=getFinanceOperations(career),parties=partyOptions(career);
  const loans=operations.agreements.filter(agreement=>agreement.kind==='loan');
  return <>
    <FinanceRecords title="Counterparties" headers={['Name','Type']} rows={operations.counterparties.map(p=>[p.name,human(p.kind)])} empty="No counterparties are recorded. Add an owner, sponsor, supplier or lender before creating an agreement."/>
    <FinanceRecordForm title="Add a counterparty" submit="Add counterparty" fields={[
      {name:'name',label:'Name',required:true},{name:'kind',label:'Type',required:true,options:['owner','sponsor','supplier','lender','employee','championship','customer','other'].map(value=>({value,label:human(value)}))},
    ]} onSubmit={data=>saveFinanceMutation(props,saveFinanceCounterparty(career,{id:financeRecordId('party'),name:formText(data,'name'),kind:formText(data,'kind') as FinanceCounterparty['kind']}))}/>
    <FinanceRecords title="Agreements" headers={['Agreement / counterparty','Term','Payments','Classification','Status']} rows={operations.agreements.map(agreement=>[
      <span key="name"><strong>{agreement.title}</strong><small>{operations.counterparties.find(p=>p.id===agreement.partyId)?.name} · {human(agreement.kind)}</small></span>,
      `${agreement.startDate} → ${agreement.endDate}`,<span key="amount">{formatFinanceMoney(agreement.amountCents)}<small>{human(agreement.direction)} · {human(agreement.frequency)}{agreement.guaranteed?' · guaranteed':' · conditional'}</small></span>,human(agreement.classification),
      <span key="status"><span className="finance-chip">{human(agreement.status)}</span><small>Revision {agreement.revision}</small><details><summary>History & terms</summary><p>{agreement.note}</p>{agreement.amendments.map((amendment,index)=><p key={index}>{amendment.date} · {amendment.reason}</p>)}</details></span>,
    ])} empty="No financial agreements are recorded. Creating an agreement is the source of its future receipts or expenses."/>
    <FinanceRecordForm title="Record an agreement" description="Choose the actual payment terms. Owner equity and loan principal do not become trading revenue. Conditional agreements remain separate from guaranteed receipts." submit="Record agreement" fields={[
      {name:'title',label:'Agreement name',required:true},{name:'partyId',label:'Counterparty',required:true,options:parties},
      {name:'kind',label:'Agreement type',required:true,options:['owner_equity','loan','sponsorship','prize','merchandise','hospitality','licensing','supplier','staff','lease','travel','other'].map(value=>({value,label:human(value)}))},
      {name:'direction',label:'Cash direction',required:true,options:[{value:'income',label:'Money received'},{value:'expense',label:'Money paid'}]},currencyField('amount','Payment amount · USD'),
      {name:'frequency',label:'Payment frequency',required:true,options:['once','monthly','quarterly','annual'].map(value=>({value,label:human(value)}))},
      {name:'startDate',label:'Starts',type:'date',required:true},{name:'endDate',label:'Ends',type:'date',required:true},{name:'category',label:'Department',required:true,options:categoryOptions},
      {name:'classification',label:'Cost-cap treatment',required:true,options:classificationOptions},{name:'relevantPercent',label:'Relevant share for mixed costs · %',type:'number',optional:true,min:'0',max:'100'},
      {name:'account',label:'Accounting treatment',optional:true,options:accountOptions,help:'Blank uses the treatment determined by the agreement type.'},
      {name:'autoSettle',label:'Settle automatically when due',required:true,options:yesNo},{name:'guaranteed',label:'Guaranteed payment',required:true,options:yesNo},
      {name:'basis',label:'Origin',required:true,options:basisOptions},
      {name:'interest',label:'Loan annual interest · %',type:'number',optional:true,min:'0',help:'Required for a loan, including zero for an interest-free agreement.'},
      {name:'repaymentStart',label:'Loan repayments start',type:'date',optional:true},{name:'repaymentMonths',label:'Loan repayment months',type:'number',step:'1',optional:true,min:'1'},
      {name:'bonusTrigger',label:'Conditional performance payment',optional:true,options:[{value:'race_win',label:'Race win'},{value:'race_podium',label:'Race podium'},{value:'constructors_title',label:'Constructors’ title'}]},
      currencyField('bonusAmount','Bonus amount · USD',true),currencyField('bonusCap','Annual bonus cap · USD',true),
      {name:'note',label:'Terms and supporting information',type:'textarea',required:true},
    ]} onSubmit={data=>{
      const kind=formText(data,'kind') as FinanceAgreementKind;
      if(kind==='loan'&&!formText(data,'interest'))throw new Error('Record the annual loan interest, including zero for an interest-free loan.');
      const input:FinanceAgreementInput={id:financeRecordId('agreement'),title:formText(data,'title'),partyId:formText(data,'partyId'),kind,direction:formText(data,'direction') as 'income'|'expense',amountCents:centsRequired(data,'amount'),startDate:formText(data,'startDate'),endDate:formText(data,'endDate'),frequency:formText(data,'frequency') as FinanceAgreementInput['frequency'],category:formText(data,'category') as FinanceCategory,classification:formText(data,'classification') as FinanceClassification,relevantPercent:relevantPercent(data),account:accountFor(data,kind),autoSettle:formText(data,'autoSettle')==='yes',guaranteed:formText(data,'guaranteed')==='yes',basis:formText(data,'basis') as FinanceBasis,note:formText(data,'note'),instalments:instalments(data),
        ...(kind==='loan'?{loan:{annualInterestPercent:Number(formText(data,'interest')),repaymentStart:formText(data,'repaymentStart'),repaymentMonths:positiveInteger(data,'repaymentMonths')}}:{}),
        ...(formText(data,'bonusTrigger')?{bonus:{trigger:formText(data,'bonusTrigger') as 'race_win'|'race_podium'|'constructors_title',amountCents:centsRequired(data,'bonusAmount'),annualCapCents:centsRequired(data,'bonusCap')}}:{}),
      };saveFinanceMutation(props,createFinanceAgreement(career,input));
    }}><InstalmentFields/></FinanceRecordForm>
    {operations.agreements.length>0&&<FinanceRecordForm title="Amend or cancel an agreement" description="Changes keep the original agreement history. A drawn loan must be repaid or refinanced through a new agreement; its outstanding debt cannot be cancelled or replaced by an amendment." submit="Apply change" fields={[
      {name:'id',label:'Agreement',required:true,options:operations.agreements.filter(a=>a.status==='active'&&(a.kind!=='loan'||loanOutstandingCents(career,a.id)===0)).map(a=>({value:a.id,label:a.title}))},{name:'action',label:'Change',required:true,options:[{value:'amend',label:'Amend future payment amount'},{value:'cancel',label:'Cancel agreement'}]},currencyField('amount','Revised payment amount · USD',true),{name:'reason',label:'Reason and agreement evidence',type:'textarea',required:true},
    ]} onSubmit={data=>saveFinanceMutation(props,formText(data,'action')==='cancel'?cancelFinanceAgreement(career,formText(data,'id'),formText(data,'reason')):amendFinanceAgreement(career,formText(data,'id'),{amountCents:centsRequired(data,'amount')},formText(data,'reason')))}/>}
    {loans.length>0&&<FinanceRecords title="Loan principal" headers={['Loan','Lender','Original principal','Outstanding principal']} rows={loans.map(loan=>[
      loan.title,operations.counterparties.find(party=>party.id===loan.partyId)?.name??'Not recorded',formatFinanceMoney(loan.amountCents),formatFinanceMoney(loanOutstandingCents(career,loan.id)),
    ])} empty="No loan agreements are recorded."/>}
    {loans.some(loan=>loanOutstandingCents(career,loan.id)>0)&&<FinanceRecordForm title="Repay a loan early" description="This settles the full outstanding principal and the explicitly agreed repayment fee. Enter zero if no fee applies. Future unearned interest is removed; accrued interest remains payable." submit="Repay full principal" fields={[
      {name:'id',label:'Outstanding loan',required:true,options:loans.filter(loan=>loanOutstandingCents(career,loan.id)>0).map(loan=>({value:loan.id,label:`${loan.title} · ${formatFinanceMoney(loanOutstandingCents(career,loan.id))} outstanding`}))},currencyField('fee','Agreed early repayment fee · USD'),{name:'reference',label:'Lender agreement and repayment reference',type:'textarea',required:true},
    ]} onSubmit={data=>saveFinanceMutation(props,repayFinanceLoanEarly(career,formText(data,'id'),centsRequired(data,'fee'),formText(data,'reference')))}/>}
  </>;
}

function InvoicePanel(props:FinanceWorkspaceProps){
  const {career}=props,summary=financeOperationsSummary(career),operations=summary.operations;
  return <>
    <div className="finance-metrics"><article className="finance-metric"><small>Receivables</small><strong>{formatFinanceMoney(summary.receivableCents)}</strong></article><article className="finance-metric"><small>Payables</small><strong>{formatFinanceMoney(summary.payableCents)}</strong></article><article className="finance-metric"><small>Overdue</small><strong>{formatFinanceMoney(summary.overdueCents)}</strong></article></div>
    <FinanceRecords title="Invoices and receivables" headers={['Invoice / counterparty','Due / recognised','Total / outstanding','Treatment','State']} rows={summary.invoices.map(invoice=>[
      <span key="invoice"><strong>{invoice.description}</strong><small>{operations.counterparties.find(p=>p.id===invoice.partyId)?.name}</small></span>,<span key="dates">{invoice.dueDate}<small>Recognised {invoice.recognitionDate}</small></span>,<span key="balance">{formatFinanceMoney(invoice.amountCents)}<small>Outstanding {formatFinanceMoney(invoice.outstandingCents)} · {human(invoice.direction)}</small></span>,human(invoice.classification),<span key="state" className="finance-chip">{human(invoice.state)}</span>,
    ])} empty="No invoices are recorded. Bills and receipts appear here when an agreement or explicit transaction creates them."/>
    <FinanceRecordForm title="Record an operating cost" description="Standard treatments are fixed to their classification policy. Use Manufacturing for project purchases, the asset register for equipment, and contracts for recurring salaries so they are not entered twice." submit="Record operating invoice" fields={[
      {name:'template',label:'Cost policy',required:true,options:Object.entries(INVOICE_TEMPLATES).map(([value,t])=>({value,label:t.label}))},
      {name:'description',label:'Description',required:true},{name:'partyId',label:'Counterparty',required:true,options:partyOptions(career)},currencyField('amount','Amount · USD'),
      {name:'recognitionDate',label:'Incurred date',type:'date',required:true},{name:'dueDate',label:'Payment due',type:'date',required:true},{name:'note',label:'Invoice reference',required:true}
    ]} onSubmit={d=>{const key=formText(d,'template') as keyof typeof INVOICE_TEMPLATES,t=INVOICE_TEMPLATES[key];saveFinanceMutation(props,recordFinanceInvoice(career,{id:financeRecordId('invoice'),description:formText(d,'description'),partyId:formText(d,'partyId'),direction:'expense',amountCents:centsRequired(d,'amount'),recognitionDate:formText(d,'recognitionDate'),dueDate:formText(d,'dueDate'),category:t.category,classification:t.classification,classificationTemplate:key,relevantPercent:t.classification==='relevant'?100:0,account:'expenses',autoSettle:false,basis:'recorded',note:`${formText(d,'note')} · ${t.rule}`}));}}/>
    <FinanceRecordForm title="Advanced accounting entry" description="For an opening payable or receivable already recognised before this financial setup, select Opening balance. Use today’s recognition date; its due date can be in the past. It will not become a new expense or income." submit="Record invoice" fields={[
      {name:'description',label:'Description',required:true},{name:'partyId',label:'Counterparty',required:true,options:partyOptions(career)},{name:'direction',label:'Direction',required:true,options:[{value:'expense',label:'Bill to pay'},{value:'income',label:'Receivable to collect'}]},currencyField('amount','Amount · USD'),
      {name:'openingBalance',label:'Opening balance already recognised before setup',required:true,options:yesNo},{name:'recognitionDate',label:'Recognition date',type:'date',required:true},{name:'dueDate',label:'Payment due',type:'date',required:true},{name:'category',label:'Department',required:true,options:categoryOptions},{name:'classification',label:'Cost-cap treatment',required:true,options:classificationOptions},{name:'relevantPercent',label:'Relevant share for mixed costs · %',type:'number',optional:true,min:'0',max:'100'},
      {name:'account',label:'Accounting treatment',required:true,options:accountOptions},{name:'autoSettle',label:'Settle automatically when due',required:true,options:yesNo},{name:'basis',label:'Origin',required:true,options:basisOptions},{name:'note',label:'Invoice reference and supporting information',type:'textarea',required:true},
    ]} onSubmit={data=>saveFinanceMutation(props,recordFinanceInvoice(career,{id:financeRecordId('invoice'),description:formText(data,'description'),partyId:formText(data,'partyId'),direction:formText(data,'direction') as 'income'|'expense',amountCents:centsRequired(data,'amount'),recognitionDate:formText(data,'recognitionDate'),dueDate:formText(data,'dueDate'),category:formText(data,'category') as FinanceCategory,classification:formText(data,'openingBalance')==='yes'?'excluded':formText(data,'classification') as FinanceClassification,relevantPercent:formText(data,'openingBalance')==='yes'?0:relevantPercent(data),account:formText(data,'openingBalance')==='yes'?'opening_equity':accountFor(data),autoSettle:formText(data,'autoSettle')==='yes',basis:formText(data,'basis') as FinanceBasis,openingBalance:formText(data,'openingBalance')==='yes',note:formText(data,'note')}))}/>
    {summary.invoices.length>0&&<FinanceRecordForm title="Settle or adjust an invoice" description="Partial payments leave the remaining balance outstanding. Refunds, credits and disputes retain their supporting history." submit="Apply invoice action" fields={[
      {name:'id',label:'Invoice',required:true,options:summary.invoices.map(invoice=>({value:invoice.id,label:`${invoice.description} · ${human(invoice.state)}`}))},{name:'action',label:'Action',required:true,options:[{value:'settle',label:'Record payment / collection'},{value:'refund',label:'Record refund'},{value:'credit',label:'Issue credit note'},{value:'dispute',label:'Open or resolve a dispute'},{value:'cancel',label:'Cancel invoice'}]},currencyField('amount','Amount · USD',true),{name:'reason',label:'Reason / payment reference',type:'textarea',required:true},
    ]} onSubmit={data=>{
      const id=formText(data,'id'),action=formText(data,'action'),reason=formText(data,'reason');
      const next=action==='settle'?settleFinanceInvoice(career,id,centsRequired(data,'amount'),financeRecordId('settlement')):action==='refund'?refundFinanceInvoice(career,id,centsRequired(data,'amount'),reason):action==='credit'?creditFinanceInvoice(career,id,centsRequired(data,'amount'),reason):action==='dispute'?disputeFinanceInvoice(career,id,reason):cancelFinanceInvoice(career,id,reason);
      saveFinanceMutation(props,next);
    }}/>}
    {summary.invoices.some(invoice=>invoice.status!=='cancelled')&&<FinanceRecordForm title="Review an invoice classification" description="Resolve an unknown treatment or record a supported correction. The original invoice and journal history are retained." submit="Record classification review" fields={[
      {name:'id',label:'Invoice',required:true,options:summary.invoices.filter(invoice=>invoice.status!=='cancelled').map(invoice=>({value:invoice.id,label:`${invoice.description} · ${human(invoice.classification)}`}))},
      {name:'classification',label:'Reviewed cost-cap treatment',required:true,options:classificationOptions},{name:'relevantPercent',label:'Relevant share for mixed costs · %',type:'number',optional:true,min:'0',max:'100'},
      {name:'reason',label:'Classification evidence and reason',type:'textarea',required:true},
    ]} onSubmit={data=>{
      if(formText(data,'classification')==='mixed'&&!formText(data,'relevantPercent'))throw new Error('Record the relevant percentage for a mixed cost, including zero where applicable.');
      saveFinanceMutation(props,classifyFinanceInvoice(career,formText(data,'id'),formText(data,'classification') as FinanceClassification,relevantPercent(data),formText(data,'reason')));
    }}/>}
  </>;
}

function BudgetPanel(props:FinanceWorkspaceProps){
  const {career}=props,summary=financeOperationsSummary(career),operations=summary.operations;
  return <>
    <FinanceRecords title="Department budgets" headers={['Year / department','Approved limit','Recognised','Committed','Remaining']} rows={summary.budgetRows.map(budget=>[
      `${budget.year} · ${categoryLabel(budget.department)}`,formatFinanceMoney(budget.limitCents),formatFinanceMoney(budget.spentCents),formatFinanceMoney(budget.committedCents),<strong key="remaining" className={budget.remainingCents<0?'finance-negative':''}>{formatFinanceMoney(budget.remainingCents)}</strong>,
    ])} empty="No departmental spending limits are recorded. A budget allocates permission; it does not create a payment."/>
    <FinanceRecordForm title="Approve or revise a budget" description="Revising the same year and department updates its spending limit. Approval does not add cash to the team." submit="Save department budget" fields={[
      {name:'year',label:'Reporting year',type:'number',step:'1',min:'1950',required:true},{name:'department',label:'Department',required:true,options:categoryOptions},currencyField('limit','Approved limit · USD'),{name:'note',label:'Approval and reason',type:'textarea',required:true},
    ]} onSubmit={data=>{
      const year=positiveInteger(data,'year'),department=formText(data,'department') as FinanceCategory,existing=operations.budgets.find(budget=>budget.year===year&&budget.department===department);
      saveFinanceMutation(props,saveFinanceBudget(career,{id:existing?.id??financeRecordId('budget'),year,department,limitCents:centsRequired(data,'limit'),approvedOn:career.clock.date,note:formText(data,'note')}));
    }}/>
    <FinanceRecords title="Planning scenarios" headers={['Scenario','Items','Cash movement','Relevant exposure']} rows={operations.scenarios.map(scenario=>[
      <span key="name"><strong>{scenario.name}</strong><details><summary>View planning items</summary>{scenario.items.map(item=><p key={item.id}>{item.dueDate} · {item.description}<small>{formatFinanceMoney(item.amountCents)} · relevant {formatFinanceMoney(item.relevantCents)}</small></p>)}</details></span>,scenario.items.length,formatFinanceMoney(scenario.items.reduce((sum,item)=>sum+item.amountCents,0)),formatFinanceMoney(scenario.items.reduce((sum,item)=>sum+item.relevantCents,0)),
    ])} empty="No planning scenarios are saved. Scenario items only affect their selected forecast."/>
    <FinanceRecordForm title="Add a planning item" description="Create a scenario or add another item to an existing one. Planning does not change bank cash, invoices or the actual ledger." submit="Save planning item" fields={[
      {name:'scenarioId',label:'Existing scenario',optional:true,options:operations.scenarios.map(scenario=>({value:scenario.id,label:scenario.name}))},{name:'name',label:'New scenario name',optional:true},{name:'description',label:'Planning item',required:true},{name:'dueDate',label:'Expected date',type:'date',required:true},{name:'direction',label:'Direction',required:true,options:[{value:'expense',label:'Proposed spending'},{value:'income',label:'Assumed receipt'}]},currencyField('amount','Cash amount · USD'),currencyField('relevant','Relevant cost · USD'),
    ]} onSubmit={data=>{
      const existing=operations.scenarios.find(scenario=>scenario.id===formText(data,'scenarioId')),name=existing?.name??formText(data,'name');if(!name)throw new Error('Enter a new scenario name or choose an existing scenario.');
      const amount=centsRequired(data,'amount')*(formText(data,'direction')==='expense'?-1:1);
      saveFinanceMutation(props,saveFinanceScenario(career,{id:existing?.id??financeRecordId('scenario'),name,items:[...(existing?.items??[]),{id:financeRecordId('plan'),description:formText(data,'description'),dueDate:formText(data,'dueDate'),amountCents:amount,relevantCents:centsRequired(data,'relevant')}]}));
    }}/>
    {operations.scenarios.some(scenario=>scenario.items.length>0)&&<FinanceRecordForm title="Remove a planning item" description="Removing a scenario item changes only the plan. Recorded agreements and payments are unaffected." submit="Remove planning item" fields={[
      {name:'item',label:'Scenario item',required:true,options:operations.scenarios.flatMap(scenario=>scenario.items.map(item=>({value:`${scenario.id}|${item.id}`,label:`${scenario.name} · ${item.description}`})))},
    ]} onSubmit={data=>{
      const [scenarioId,itemId]=formText(data,'item').split('|'),scenario=operations.scenarios.find(item=>item.id===scenarioId);if(!scenario)throw new Error('The selected scenario no longer exists.');
      saveFinanceMutation(props,saveFinanceScenario(career,{...scenario,items:scenario.items.filter(item=>item.id!==itemId)}));
    }}/>}
  </>;
}

function AssetPanel(props:FinanceWorkspaceProps){
  const {career}=props,assets=career.finance?.book?.assets??[];
  return <>
    <FinanceRecords title="Asset register" headers={['Asset','Acquired','Purchase cost','Useful life','Status / treatment']} rows={assets.map(asset=>[
      asset.name,asset.acquiredOn,formatFinanceMoney(asset.costCents),`${asset.lifeMonths} months`,<span key="status">{asset.disposedOn?`Disposed ${asset.disposedOn}`:'Registered'}<small>{asset.relevant?'Relevant depreciation':'Excluded depreciation'}</small></span>,
    ])} empty="No owned equipment is recorded. Facility ratings do not create asset values."/>
    <FinanceRecordForm title="Record an equipment purchase" description="The purchase creates its cash obligation separately from depreciation. Record only equipment actually acquired or ordered for this career." submit="Record asset" fields={[
      {name:'name',label:'Asset name',required:true},{name:'acquiredOn',label:'Acquisition / commissioning date',type:'date',required:true},currencyField('cost','Purchase cost · USD'),currencyField('residual','Residual value · USD'),{name:'lifeMonths',label:'Useful life · months',type:'number',step:'1',min:'1',max:'600',required:true},{name:'relevant',label:'Relevant depreciation',required:true,options:yesNo},
    ]} onSubmit={data=>saveFinanceMutation(props,registerFinanceAsset(career,{id:financeRecordId('asset'),name:formText(data,'name'),acquiredOn:formText(data,'acquiredOn'),costCents:centsRequired(data,'cost'),residualCents:centsRequired(data,'residual'),lifeMonths:positiveInteger(data,'lifeMonths'),relevant:formText(data,'relevant')==='yes'}))}/>
    <FinanceRecordForm title="Record existing equipment" description="Record equipment already owned at the opening date. Its original purchase is not paid again. Depreciation continues from the recorded accumulated amount over the remaining useful life." submit="Add opening asset" fields={[
      {name:'name',label:'Asset name',required:true},{name:'acquiredOn',label:'Original acquisition date',type:'date',max:career.clock.date,required:true},currencyField('cost','Original purchase cost · USD'),currencyField('accumulated','Accumulated depreciation · USD'),currencyField('residual','Residual value · USD'),{name:'lifeMonths',label:'Remaining useful life · months',type:'number',step:'1',min:'1',max:'600',required:true},{name:'relevant',label:'Relevant depreciation',required:true,options:yesNo},
    ]} onSubmit={data=>saveFinanceMutation(props,recordOpeningFinanceAsset(career,{id:financeRecordId('asset'),name:formText(data,'name'),acquiredOn:formText(data,'acquiredOn'),costCents:centsRequired(data,'cost'),residualCents:centsRequired(data,'residual'),lifeMonths:positiveInteger(data,'lifeMonths'),relevant:formText(data,'relevant')==='yes'},centsRequired(data,'accumulated')))}/>
    {assets.length>0&&<FinanceRecordForm title="Dispose of an asset" description="Record the actual sale proceeds, including zero for scrapped equipment. The ledger retains its purchase and depreciation history." submit="Record asset disposal" fields={[
      {name:'id',label:'Asset',required:true,options:assets.filter(asset=>!asset.disposedOn).map(asset=>({value:asset.id,label:asset.name}))},currencyField('proceeds','Disposal proceeds · USD'),{name:'reason',label:'Disposal reason and reference',type:'textarea',required:true},
    ]} onSubmit={data=>saveFinanceMutation(props,disposeFinanceAsset(career,formText(data,'id'),centsRequired(data,'proceeds'),formText(data,'reason')))}/>}
  </>;
}

function OwnershipPanel(props:FinanceWorkspaceProps){
  const {career}=props,operations=getFinanceOperations(career),ownership=operations.ownership;
  const owners=ownership.owners.map(owner=>({value:owner.id,label:owner.name}));
  const teamOptions=teams.map(team=>({value:team.id,label:team.name}));
  const ownerName=(id:string)=>ownership.owners.find(owner=>owner.id===id)?.name??id;
  return <>
    <section className="finance-panel"><h2>Ownership and funding</h2><p>Share transfers change ownership. Payments for shares go to the seller; capital injections and shareholder loans require their own funding agreements.</p></section>
    <FinanceRecords title="Owners" headers={['Owner','Type']} rows={ownership.owners.map(owner=>[owner.name,human(owner.kind)])} empty="No owners have been recorded in this career's financial workspace."/>
    <FinanceRecordForm title="Record an owner" submit="Save owner" fields={[{name:'name',label:'Owner name',required:true},{name:'kind',label:'Type',required:true,options:[{value:'company',label:'Company'},{value:'individual',label:'Individual'},{value:'fund',label:'Investment fund'},{value:'manufacturer',label:'Manufacturer'},{value:'other',label:'Other'}]}]} onSubmit={data=>saveFinanceMutation(props,saveFinanceOwner(career,{id:financeRecordId('owner'),name:formText(data,'name'),kind:formText(data,'kind')}))}/>
    <FinanceRecords title="Ownership periods" headers={['Team','Owner','Share','From','Until']} rows={ownership.periods.map(period=>[
      teams.find(team=>team.id===period.teamId)?.name??period.teamId,ownerName(period.ownerId),period.percentage===null?'Not recorded':`${period.percentage}%`,period.from,period.until??'Ongoing',
    ])} empty="No ownership stakes are recorded. Unknown shares stay unknown."/>
    <FinanceRecordForm title="Record a starting stake" submit="Save stake" fields={[
      {name:'teamId',label:'Team',required:true,options:teamOptions},{name:'ownerId',label:'Owner',required:true,options:owners},{name:'percentage',label:'Share · %',type:'number',step:'0.0001',min:'0',max:'100',optional:true},{name:'from',label:'Effective date',type:'date',required:true},
    ]} onSubmit={data=>saveFinanceMutation(props,recordFinanceStake(career,{teamId:formText(data,'teamId'),ownerId:formText(data,'ownerId'),percentage:formText(data,'percentage')?Number(formText(data,'percentage')):null,from:formText(data,'from'),until:null,basis:'career_generated'}))}/>
    <FinanceRecordForm title="Record a share transfer" description="Existing shares must be recorded before they can be transferred. Team liabilities and loan agreements continue unless separately amended." submit="Record transfer" fields={[
      {name:'teamId',label:'Team',required:true,options:teamOptions},{name:'fromOwnerId',label:'Selling owner',required:true,options:owners},{name:'toOwnerId',label:'Buying owner',required:true,options:owners},{name:'date',label:'Transfer date',type:'date',required:true},{name:'percentage',label:'Share transferred · %',type:'number',step:'0.0001',min:'0.0001',max:'100',required:true},currencyField('price','Share purchase price · USD',true),
    ]} onSubmit={data=>saveFinanceMutation(props,recordFinanceOwnershipTransfer(career,{id:financeRecordId('transfer'),teamId:formText(data,'teamId'),fromOwnerId:formText(data,'fromOwnerId'),toOwnerId:formText(data,'toOwnerId'),date:formText(data,'date'),percentage:Number(formText(data,'percentage')),priceCents:formCents(data,'price',true)}))}/>
    <FinanceRecords title="Transfer history" headers={['Date','Team','Seller → buyer','Share','Purchase price']} rows={operations.transfers.map(transfer=>[
      transfer.date,teams.find(team=>team.id===transfer.teamId)?.name??transfer.teamId,`${ownerName(transfer.fromOwnerId)} → ${ownerName(transfer.toOwnerId)}`,`${transfer.percentage}%`,formatFinanceMoney(transfer.priceCents),
    ])} empty="No share transfers have been recorded."/>
  </>;
}

function ReportingPanel(props:FinanceWorkspaceProps){
  const {career}=props,summary=financeOperationsSummary(career),operations=summary.operations;
  return <>
    <section className={summary.journalBalanced?'finance-check':'finance-alert'} role="status">{summary.journalBalanced?'Journal debits and credits balance.':'The journal requires reconciliation.'}</section>
    <FinanceRecords title="Account balances" headers={['Account','Recorded balance']} rows={Object.entries(summary.accounts).map(([account,balance])=>[human(account),formatFinanceMoney(balance)])} empty="No account balances are recorded."/>
    <FinanceRecords title="Reporting periods" headers={['Year / status','Closed','Cash','Relevant / excluded','Review']} rows={operations.periods.map(period=>[
      `${period.year} · ${human(period.status)}`,period.closedOn,formatFinanceMoney(period.cashCents),<span key="cost">{formatFinanceMoney(period.relevantCents)}<small>Excluded {formatFinanceMoney(period.excludedCents)}</small></span>,<span key="review">Unresolved {formatFinanceMoney(period.unresolvedCents)}<small>{period.note}</small></span>,
    ])} empty="No reporting period has been closed. Outstanding bills and agreements carry forward when a season ends."/>
    <FinanceRecordForm title="Close a reporting period" description="Close only after reviewing recognised costs and unresolved classifications. Audited status records your completed review; it does not invent an allowance." submit="Close reporting period" fields={[
      {name:'year',label:'Reporting year',type:'number',step:'1',min:'1950',required:true},{name:'audited',label:'Review completed / audited',required:true,options:yesNo},{name:'note',label:'Close report and supporting review',type:'textarea',required:true},
    ]} onSubmit={data=>saveFinanceMutation(props,closeFinancePeriod(career,positiveInteger(data,'year'),formText(data,'note'),formText(data,'audited')==='yes'))}/>
    <FinanceRecords title="Compliance findings" headers={['Date / year','Finding','Description','Recorded penalty']} rows={operations.findings.map(finding=>[
      `${finding.date} · ${finding.year}`,human(finding.kind),finding.description,formatFinanceMoney(finding.penaltyCents),
    ])} empty="No compliance findings have been recorded."/>
    <FinanceRecordForm title="Record a compliance decision" description="Record an actual regulatory finding or an explicit game decision, with its supporting reference. No penalty amount or sanction formula is assumed." submit="Save compliance decision" fields={[
      {name:'year',label:'Reporting year',type:'number',step:'1',min:'1950',required:true},{name:'date',label:'Decision date',type:'date',required:true},
      {name:'kind',label:'Decision type',required:true,options:[{value:'warning',label:'Warning'},{value:'overspend',label:'Overspend finding'},{value:'late_report',label:'Late reporting finding'},{value:'resolved',label:'Resolved finding'}]},
      currencyField('penalty','Approved monetary penalty · USD'),{name:'description',label:'Decision and scope',type:'textarea',required:true},{name:'source',label:'Regulatory reference or approved game decision',type:'textarea',required:true},
    ]} onSubmit={data=>saveFinanceMutation(props,recordFinanceFinding(career,{id:financeRecordId('finding'),year:positiveInteger(data,'year'),date:formText(data,'date'),kind:formText(data,'kind') as FinanceComplianceFinding['kind'],description:formText(data,'description'),penaltyCents:centsRequired(data,'penalty'),source:formText(data,'source')}))}/>
    <FinanceRecords title="Settlement history" headers={['Date','Invoice','Movement','Amount']} rows={operations.settlements.map(settlement=>[
      settlement.date,operations.invoices.find(invoice=>invoice.id===settlement.invoiceId)?.description??settlement.invoiceId,human(settlement.kind),formatFinanceMoney(settlement.amountCents),
    ])} empty="No invoice settlements have been recorded."/>
  </>;
}

export function FinanceForecastPanel(props:FinanceWorkspaceProps){
  const {career}=props,operations=getFinanceOperations(career),[throughYear,setThroughYear]=useState(String(career.season.year+2)),[scenarioId,setScenarioId]=useState('');
  const forecast=financeForecast(career,{throughYear:Math.max(career.season.year,Math.min(career.season.year+10,Number(throughYear)||career.season.year)),...(scenarioId?{scenarioId}:{})});
  return <>
    <section className="finance-panel"><div className="finance-panel-title"><h2>Contracted and planned cashflow</h2><span className="finance-chip">{forecast.complete?'Recorded coverage complete':'Incomplete starting records'}</span></div><div className="finance-calculator"><label>Forecast through year<input type="number" min={career.season.year} max={career.season.year+10} step="1" value={throughYear} onChange={event=>setThroughYear(event.target.value)}/></label><label>Planning scenario<select value={scenarioId} onChange={event=>setScenarioId(event.target.value)}><option value="">Recorded commitments only</option>{operations.scenarios.map(scenario=><option key={scenario.id} value={scenario.id}>{scenario.name}</option>)}</select></label><div><small>Lowest recorded forecast cash</small><p><strong>{formatFinanceMoney(forecast.minCash)}</strong><small> · {forecast.minDate}</small></p></div></div>{forecast.missing.length>0&&<ul className="finance-checklist">{forecast.missing.map(missing=><li key={missing}>{missing}</li>)}</ul>}<p className="finance-note">A selected planning scenario changes this preview only. It creates no invoice or payment.</p></section>
    <FinanceRecords title="Annual outlook" headers={['Year','Receipts','Payments','Closing cash','Relevant costs / headroom']} rows={forecast.years.map(year=>[
      year.year,formatFinanceMoney(year.income),formatFinanceMoney(year.expenses),formatFinanceMoney(year.cash),<span key="cap">{formatFinanceMoney(year.relevant)}<small>Headroom {formatFinanceMoney(year.headroom)}</small></span>,
    ])} empty="No forecast years are available."/>
    <FinanceRecords title="Monthly cashflow" headers={['Month ending','Receipts','Payments','Recorded closing cash',forecast.scenarioName?'With planning scenario':'Relevant costs']} rows={forecast.months.map(month=>[
      month.date,formatFinanceMoney(month.income),formatFinanceMoney(month.expenses),formatFinanceMoney(month.cash),formatFinanceMoney(forecast.scenarioName?month.scenarioCash:month.relevant),
    ])} empty="No payment schedule has been recorded."/>
  </>;
}

export function FinanceRulesPanel(props:FinanceWorkspaceProps){
  const {career}=props;
  return <FinanceRecordForm title="Record a seasonal rule or allowance" description="Record a verified rate or an explicit game-rule decision with its reason. Adjustments require supporting records; they are never inferred from an owner or facility rating." submit="Record rule decision" fields={[
    {name:'year',label:'Reporting year',type:'number',step:'1',min:'1950',required:true},{name:'field',label:'Rule input',required:true,options:[{value:'baseCapCents',label:'Regulatory base · USD'},{value:'indexationPercent',label:'Indexation · %'},{value:'carryForwardCents',label:'Audited carry-forward · USD'},{value:'integrationAdjustmentCents',label:'PU integration allocation · USD'},{value:'extraRaceCents',label:'Additional-race allowance · USD'},{value:'sprintAdjustmentCents',label:'Sprint adjustment · USD'}]},currencyField('value','Recorded amount / rate'),{name:'note',label:'Evidence and reason',type:'textarea',required:true},
  ]} onSubmit={data=>{
    const year=positiveInteger(data,'year'),field=formText(data,'field'),rules=currentFinanceRules(career,year),value=field==='indexationPercent'?Number(formText(data,'value')):centsRequired(data,'value');
    saveFinanceMutation(props,recordFinanceRules(career,{...rules,year,[field]:value},formText(data,'note')));
  }}/>;
}

export default function FinanceWorkspacePanels(props:FinanceWorkspaceProps&{tab:string}){
  if(props.tab==='setup')return <OpeningPanel {...props}/>;
  if(props.tab==='agreements')return <AgreementPanel {...props}/>;
  if(props.tab==='invoices')return <InvoicePanel {...props}/>;
  if(props.tab==='budgets')return <BudgetPanel {...props}/>;
  if(props.tab==='assets')return <AssetPanel {...props}/>;
  if(props.tab==='ownership')return <OwnershipPanel {...props}/>;
  if(props.tab==='reporting')return <ReportingPanel {...props}/>;
  return null;
}
