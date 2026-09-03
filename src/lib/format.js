export const inr = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN')
export const AGE = ['age_0_30', 'age_31_60', 'age_61_90', 'age_90p']
export const AGE_LABELS = [
  ['age_0_30', '0–30'], ['age_31_60', '31–60'], ['age_61_90', '61–90'], ['age_90p', '90+'],
]
export const outstanding = (d) => AGE.reduce((s, f) => s + ((d.ageing && d.ageing[f]) || 0), 0)
