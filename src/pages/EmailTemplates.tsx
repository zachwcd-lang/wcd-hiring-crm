import { useState } from 'react'
import { Plus, Edit2, Trash2, Mail, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  useEmailTemplates,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
} from '@/hooks/useEmailTemplates'
import type { EmailTemplate } from '@/types'
import { toast } from 'sonner'

const MERGE_TAGS = [
  { tag: '{{name}}', description: 'Candidate name' },
  { tag: '{{first_name}}', description: 'First name only' },
  { tag: '{{position}}', description: 'Position applied for' },
  { tag: '{{company}}', description: 'Company name (West Coast Deals)' },
]

export function EmailTemplates() {
  const { data: templates, isLoading } = useEmailTemplates()
  const createTemplate = useCreateEmailTemplate()
  const updateTemplate = useUpdateEmailTemplate()
  const deleteTemplate = useDeleteEmailTemplate()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
  })
  const [copiedTag, setCopiedTag] = useState<string | null>(null)

  const handleOpenModal = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({
        name: template.name,
        subject: template.subject || '',
        body: template.body || '',
      })
    } else {
      setEditingTemplate(null)
      setFormData({ name: '', subject: '', body: '' })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = () => {
    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate.id, updates: formData })
    } else {
      createTemplate.mutate(formData)
    }
    setIsModalOpen(false)
  }

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag)
    setCopiedTag(tag)
    toast.success('Copied!')
    setTimeout(() => setCopiedTag(null), 2000)
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Email Templates"
        description="Manage email templates for candidate communication"
        actions={
          <Button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-white/80 backdrop-blur border-slate-200/50">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          ) : templates?.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur border-slate-200/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">No templates yet</h3>
                <p className="text-sm text-slate-500 mb-4">Create your first email template</p>
                <Button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-slate-800">
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            templates?.map((template) => (
              <Card key={template.id} className="bg-white/80 backdrop-blur border-slate-200/50 hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenModal(template)}>
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this template?')) {
                            deleteTemplate.mutate(template.id)
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {template.subject && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-slate-500 mb-1">Subject</p>
                      <p className="text-sm text-slate-700">{template.subject}</p>
                    </div>
                  )}
                  {template.body && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Body</p>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-4">{template.body}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Merge Tags Reference */}
        <Card className="bg-white/80 backdrop-blur border-slate-200/50 h-fit">
          <CardHeader>
            <CardTitle className="text-base">Merge Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              Use these tags in your templates. They'll be replaced with actual values when sending.
            </p>
            <div className="space-y-2">
              {MERGE_TAGS.map(({ tag, description }) => (
                <button
                  key={tag}
                  onClick={() => handleCopyTag(tag)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  <div>
                    <code className="text-sm font-mono text-slate-700">{tag}</code>
                    <p className="text-xs text-slate-500">{description}</p>
                  </div>
                  {copiedTag === tag ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg bg-white/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Template'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Template Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Phone Screen Invite"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Subject Line</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Next steps for your application at {{company}}"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Email Body</label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Hi {{first_name}},&#10;&#10;Thank you for applying..."
                rows={8}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim()} className="bg-slate-900 hover:bg-slate-800">
              {editingTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
