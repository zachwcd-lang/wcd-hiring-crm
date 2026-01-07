import { useState, useEffect } from 'react'
import { Copy, Check, ExternalLink, Users, Webhook, Palette, Database, Sparkles, Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { STAGES, SOURCES, type CriterionConfig } from '@/types'
import {
  useActiveScreeningCriteria,
  useUpdateScreeningCriteria,
  useCreateScreeningCriteria,
  DEFAULT_CRITERIA,
  DEFAULT_PROMPT_TEMPLATE,
} from '@/hooks/useScreeningCriteria'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function Settings() {
  const [copied, setCopied] = useState<string | null>(null)
  const [criteria, setCriteria] = useState<Record<string, CriterionConfig>>(DEFAULT_CRITERIA)
  const [promptTemplate, setPromptTemplate] = useState(DEFAULT_PROMPT_TEMPLATE)
  const [hasChanges, setHasChanges] = useState(false)

  const { data: activeCriteria } = useActiveScreeningCriteria()
  const updateCriteria = useUpdateScreeningCriteria()
  const createCriteria = useCreateScreeningCriteria()

  // Load active criteria when available
  useEffect(() => {
    if (activeCriteria) {
      setCriteria(activeCriteria.criteria)
      setPromptTemplate(activeCriteria.prompt_template)
    }
  }, [activeCriteria])

  const webhookUrl = `${window.location.origin}/api/webhooks/calendly`

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    toast.success('Copied!')
    setTimeout(() => setCopied(null), 2000)
  }

  const handleCriterionChange = (key: string, field: 'weight' | 'description', value: string | number) => {
    setCriteria(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === 'weight' ? Number(value) : value,
      },
    }))
    setHasChanges(true)
  }

  const handlePromptChange = (value: string) => {
    setPromptTemplate(value)
    setHasChanges(true)
  }

  const handleSaveScreeningConfig = async () => {
    if (activeCriteria) {
      await updateCriteria.mutateAsync({
        id: activeCriteria.id,
        updates: {
          criteria,
          prompt_template: promptTemplate,
        },
      })
    } else {
      await createCriteria.mutateAsync({
        name: 'Default Criteria',
        criteria,
        prompt_template: promptTemplate,
        is_active: true,
      })
    }
    setHasChanges(false)
  }

  const handleResetToDefaults = () => {
    setCriteria(DEFAULT_CRITERIA)
    setPromptTemplate(DEFAULT_PROMPT_TEMPLATE)
    setHasChanges(true)
  }

  const totalWeight = Object.values(criteria).reduce((sum, c) => sum + c.weight, 0)

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader
        title="Settings"
        description="Configure your hiring CRM"
      />

      <div className="space-y-6">
        {/* Stages */}
        <Card className="bg-white/80 backdrop-blur border-slate-200/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-slate-500" />
              <CardTitle>Pipeline Stages</CardTitle>
            </div>
            <CardDescription>Current pipeline stages and their colors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((stage) => (
                <Badge
                  key={stage.id}
                  className={cn(stage.bgColor, stage.color, 'border', stage.borderColor, 'text-sm py-1.5 px-3')}
                >
                  {stage.label}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Stage customization coming in a future update
            </p>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card className="bg-white/80 backdrop-blur border-slate-200/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-500" />
              <CardTitle>Candidate Sources</CardTitle>
            </div>
            <CardDescription>Available source options for tracking where candidates come from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map((source) => (
                <Badge key={source.value} variant="outline" className="text-sm py-1.5 px-3 capitalize">
                  {source.label}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Source customization coming in a future update
            </p>
          </CardContent>
        </Card>

        {/* AI Screening */}
        <Card className="bg-white/80 backdrop-blur border-slate-200/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                <CardTitle>AI Screening</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Unsaved changes
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetToDefaults}
                  disabled={updateCriteria.isPending || createCriteria.isPending}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveScreeningConfig}
                  disabled={!hasChanges || updateCriteria.isPending || createCriteria.isPending}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
            <CardDescription>Configure how AI evaluates candidate applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Criteria Weights */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-[var(--text-primary)]">Scoring Criteria</h4>
                <span className={cn(
                  'text-xs font-medium',
                  totalWeight === 100 ? 'text-emerald-600' : 'text-red-600'
                )}>
                  Total: {totalWeight}% {totalWeight !== 100 && '(must equal 100%)'}
                </span>
              </div>
              <div className="space-y-3">
                {Object.entries(criteria).map(([key, config]) => (
                  <div key={key} className="p-3 rounded-lg bg-[var(--background-subtle)] border border-[var(--border)]">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-[var(--text-primary)] min-w-32 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={config.weight}
                          onChange={(e) => handleCriterionChange(key, 'weight', e.target.value)}
                          className="w-20 h-8 text-sm"
                        />
                        <span className="text-xs text-[var(--text-muted)]">%</span>
                      </div>
                    </div>
                    <Input
                      value={config.description}
                      onChange={(e) => handleCriterionChange(key, 'description', e.target.value)}
                      placeholder="Description of this criterion"
                      className="text-sm h-8 bg-[var(--background)]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Prompt Template */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Prompt Template</h4>
              <Textarea
                value={promptTemplate}
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder="Enter the AI prompt template..."
                className="min-h-[200px] font-mono text-sm bg-[var(--background-subtle)]"
              />
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Use {'{{screening_answers}}'} for candidate responses and {'{{weights.criterion_name}}'} for weights
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card className="bg-white/80 backdrop-blur border-slate-200/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-slate-500" />
              <CardTitle>Integrations</CardTitle>
            </div>
            <CardDescription>Connect external services to your CRM</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Calendly */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <span className="text-lg">📅</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">Calendly</h4>
                    <p className="text-xs text-slate-500">Automatically create candidates from Calendly bookings</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Coming Soon
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Webhook URL</label>
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="bg-white font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(webhookUrl, 'webhook')}
                  >
                    {copied === 'webhook' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-400">
                  Add this URL to your Calendly webhook settings to auto-import candidates
                </p>
              </div>
            </div>

            {/* Indeed */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <span className="text-lg">💼</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">Indeed</h4>
                    <p className="text-xs text-slate-500">Import candidates from Indeed job postings</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-slate-50 text-slate-500">
                  Planned
                </Badge>
              </div>
            </div>

            {/* LinkedIn */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                    <span className="text-lg">💬</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">LinkedIn</h4>
                    <p className="text-xs text-slate-500">Import candidates from LinkedIn applications</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-slate-50 text-slate-500">
                  Planned
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card className="bg-white/80 backdrop-blur border-slate-200/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-500" />
              <CardTitle>Team</CardTitle>
            </div>
            <CardDescription>Manage team members who can access this CRM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-medium">
                  WC
                </div>
                <div>
                  <h4 className="font-medium text-slate-800">West Coast Deals</h4>
                  <p className="text-xs text-slate-500">Admin</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                You
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Multi-user support coming in a future update
            </p>
          </CardContent>
        </Card>

        {/* Database */}
        <Card className="bg-white/80 backdrop-blur border-slate-200/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-500" />
              <CardTitle>Database</CardTitle>
            </div>
            <CardDescription>Your data is stored securely in Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <span className="text-lg">⚡</span>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800">Supabase</h4>
                  <p className="text-xs text-slate-500">PostgreSQL database with real-time sync</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                  Dashboard <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
