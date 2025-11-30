export type SiteType = 'jobkorea' | 'saramin' | 'wanted' | 'jobplanet' | 'jasoseol' | 'linkareer' | 'incruit' | 'catch' | 'jobda' | 'rallit' | 'other' | null

export interface DetectResult {
  site: SiteType
  company: string | null
}