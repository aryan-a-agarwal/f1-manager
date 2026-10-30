import type {FinanceCategory,FinanceEntry} from './financeTypes';
import type {TeamOwnershipState} from './teamOwnership';

export type FinanceAccount='cash'|'receivables'|'payables'|'prepayments'|'deferred_income'|'inventory'|'fixed_assets'|'accumulated_depreciation'|'loans'|'equity'|'revenue'|'expenses'|'opening_equity';
export type FinanceJournalLine={account:FinanceAccount;debitCents:number;creditCents:number};
export type FinanceBasis='scenario'|'recorded';
export type FinanceCounterparty={id:string;name:string;kind:'owner'|'sponsor'|'supplier'|'lender'|'employee'|'championship'|'customer'|'other'};
export type FinanceOpeningInput={asOf:string;cashCents:number|null;restrictedCents:number|null;debtCents:number|null;basis:FinanceBasis;note:string};
export type FinanceAgreementKind='owner_equity'|'loan'|'sponsorship'|'prize'|'merchandise'|'hospitality'|'licensing'|'supplier'|'staff'|'lease'|'travel'|'other';
export type FinanceClassification='relevant'|'excluded'|'mixed'|'unresolved';
export type FinanceInstalment={id:string;dueDate:string;recognitionDate:string;amountCents:number};
export type FinanceAgreementInput={
  id:string;title:string;partyId:string;kind:FinanceAgreementKind;direction:'income'|'expense';
  amountCents:number;startDate:string;endDate:string;frequency:'once'|'monthly'|'quarterly'|'annual';
  category:FinanceCategory;classification:FinanceClassification;relevantPercent:number;
  account:FinanceAccount;autoSettle:boolean;guaranteed:boolean;note:string;basis:FinanceBasis;
  instalments?:FinanceInstalment[];
  loan?:{annualInterestPercent:number;repaymentStart:string;repaymentMonths:number};
  bonus?:{trigger:'race_win'|'race_podium'|'constructors_title';amountCents:number;annualCapCents:number};
};
export type FinanceAgreement=FinanceAgreementInput & {revision:number;status:'active'|'cancelled';cancelledOn?:string;createdOn:string;amendments:{date:string;reason:string;previous:FinanceAgreementInput}[]};
export type FinanceInvoiceInput={
  id:string;description:string;partyId:string;direction:'income'|'expense';amountCents:number;
  recognitionDate:string;dueDate:string;category:FinanceCategory;classification:FinanceClassification;
  relevantPercent:number;account:FinanceAccount;autoSettle:boolean;note:string;
  agreementId?:string;sourceId?:string;basis?:FinanceBasis;openingBalance?:boolean;classificationTemplate?:string;
};
export type FinanceInvoice=FinanceInvoiceInput & {status:'open'|'cancelled'|'disputed';createdOn:string;creditCents:number;revision:number;reason?:string};
export type FinanceSettlement={id:string;invoiceId:string;date:string;amountCents:number;kind:'payment'|'refund'};
export type FinanceBudget={id:string;year:number;department:FinanceCategory;limitCents:number;approvedOn:string;note:string};
export type FinanceScenario={id:string;name:string;items:{id:string;description:string;dueDate:string;amountCents:number;relevantCents:number}[]};
export type FinancePeriod={year:number;status:'closed'|'audited';closedOn:string;cashCents:number|null;incomeCents:number;expenseCents:number;relevantCents:number;excludedCents:number;unresolvedCents:number;capCents:number;note:string};
export type FinanceComplianceFinding={id:string;year:number;date:string;kind:'warning'|'overspend'|'late_report'|'resolved';description:string;penaltyCents:number;source:string};
export type FinanceOperations={
  personnelCoverage?:boolean;
  ruleDeterminations?:{year:number;date:string;reference:string;carryForwardCents:number}[];
  appliedProfiles?:{id:string;version:string;appliedOn:string;note:string}[];
  version:1;opening?:FinanceOpeningInput;counterparties:FinanceCounterparty[];agreements:FinanceAgreement[];
  invoices:FinanceInvoice[];settlements:FinanceSettlement[];budgets:FinanceBudget[];scenarios:FinanceScenario[];
  periods:FinancePeriod[];findings:FinanceComplianceFinding[];ownership:TeamOwnershipState;
  transfers:{id:string;date:string;teamId:string;fromOwnerId:string;toOwnerId:string;percentage:number;priceCents:number|null}[];
  eventReceipts:string[];coverage:{funding:boolean;operating:boolean};
};
export type FinanceInvoiceView=FinanceInvoice & {paidCents:number;outstandingCents:number;state:'scheduled'|'due'|'part_paid'|'paid'|'overdue'|'cancelled'|'disputed'};
export type FinanceForecastMonth={date:string;income:number;expenses:number;cash:number|null;relevant:number;scenarioCash:number|null};
export type FinanceForecastResult={months:FinanceForecastMonth[];years:{year:number;income:number;expenses:number;cash:number|null;relevant:number;cap:number;headroom:number}[];minCash:number|null;minDate:string;complete:boolean;missing:string[];scenarioName:string|null};
export type FinanceOperationsSummary={operations:FinanceOperations;invoices:FinanceInvoiceView[];receivableCents:number;payableCents:number;overdueCents:number;debtCents:number|null;restrictedCents:number|null;unresolvedCents:number;accounts:Record<FinanceAccount,number>;journalBalanced:boolean;budgetRows:(FinanceBudget&{spentCents:number;committedCents:number;remainingCents:number})[];entries:FinanceEntry[]};
