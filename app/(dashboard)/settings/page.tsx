import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">Workspace Settings</h1>
        <p className="text-brand-muted">
          Manage the fleet workspace details used across the dashboard.
        </p>
      </div>

      <Card className="rounded-lg border border-border bg-brand-panel shadow-none">
        <CardHeader>
          <CardTitle className="text-foreground">Organization Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              defaultValue="ABC Logistics"
              className="border-border bg-brand-surface"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ops-email">Operations Email</Label>
            <Input
              id="ops-email"
              type="email"
              defaultValue="ops@autopartspro.com"
              className="border-border bg-brand-surface"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Preferred Currency</Label>
            <Input
              id="currency"
              defaultValue="USD"
              className="border-border bg-brand-surface"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              defaultValue="America/Chicago"
              className="border-border bg-brand-surface"
            />
          </div>

          <div className="md:col-span-2">
            <Button className="bg-primary text-primary-foreground hover:bg-brand-primary-hover">
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
