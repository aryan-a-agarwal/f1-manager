import type {ContractClausePackage} from "@/lib/career/contractClauses";

export function ContractClauses({package:terms}:{package?:ContractClausePackage}) {
  if(!terms)return null;
  // Standard obligations stay implicit. Only a departure from full guaranteed
  // base pay belongs in the visible termination terms.
  const visible=terms.clauses.filter(clause=>
    !["confidentiality","role_commitment"].includes(clause.kind)&&
    !(clause.kind==="termination_protection"&&clause.parameters.remainingBaseSalaryPercent===100));
  if(!visible.length)return null;
  const exceptions=visible.filter(clause=>clause.kind==="termination_protection");
  const negotiated=visible.filter(clause=>clause.kind!=="termination_protection");
  const groups=[{title:"Negotiated clauses",clauses:negotiated},{title:"Exceptions to standard terms",clauses:exceptions}].filter(group=>group.clauses.length);
  return <details className="contract-clause-details"><summary>{visible.length} clauses · {terms.category}</summary>
    <p className="contract-muted">Game assumptions · recorded terms. Payments, obligations and breach consequences are not yet automated.</p>
    <p>{terms.rationale}</p>
    {groups.map(group=><section key={group.title}><h4>{group.title}</h4><dl>{group.clauses.map(clause=><div key={clause.kind}><dt><strong>{clause.title}</strong></dt><dd>{clause.terms.replace("3th or better","3rd or better")}</dd></div>)}</dl></section>)}
  </details>;
}
