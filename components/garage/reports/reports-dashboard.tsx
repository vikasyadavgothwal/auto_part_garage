"use client"

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Activity, Gauge, Target } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ActionState = { allowed: boolean; reason: string | null }

type ReportsDashboardProps = {
  planTier: "Free" | "Pro" | "Enterprise"
  usage: ActionState
  activity: ActionState
  monthlyRevenue: Array<{ month: string; revenue: number; appointments: number }>
  serviceDemand: Array<{ name: string; bookings: number; revenue: number }>
  statusMix: Array<{ name: string; value: number }>
  dailyLoad: Array<{ day: string; appointments: number; revenue: number }>
  kpis: { avgTicket: string; completionRate: string; activeServices: number }
}

const colors = ["#22c55e", "#f59e0b", "#ef4444", "#38bdf8", "#a78bfa"]
const moneyTick = (value: number) => `${Math.round(value / 1000)}k`

function LockedCard({ title, message }: { title: string; message: string }) {
  return <Card className="border-amber-500/30 bg-amber-500/10"><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="text-sm text-amber-200">{message}</CardContent></Card>
}

export function ReportsDashboard({ planTier, usage, activity, monthlyRevenue, serviceDemand, statusMix, dailyLoad, kpis }: ReportsDashboardProps) {
  const isEnterprise = planTier === "Enterprise"
  const isProOrAbove = planTier === "Pro" || isEnterprise

  return (
    <div className="space-y-5">
      {isProOrAbove ? (
        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
          <Card className="overflow-hidden border-border bg-card">
            <CardHeader><CardTitle>Revenue and appointment trend</CardTitle><p className="text-sm text-muted-foreground">Monthly revenue with appointment volume.</p></CardHeader>
            <CardContent className="h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyRevenue} margin={{ left: 0, right: 12 }}><defs><linearGradient id="garageRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0.03} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis tickFormatter={moneyTick} tickLine={false} axisLine={false} /><Tooltip formatter={(value, name) => name === "revenue" ? [`AED ${Number(value).toFixed(0)}`, "Revenue"] : [value, "Appointments"]} /><Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#garageRevenue)" strokeWidth={3} /><Line type="monotone" dataKey="appointments" stroke="#38bdf8" strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Booking status mix</CardTitle><p className="text-sm text-muted-foreground">Operational distribution by appointment status.</p></CardHeader>
            <CardContent className="h-80"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusMix} dataKey="value" nameKey="name" innerRadius={62} outerRadius={104} paddingAngle={4}>{statusMix.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent>
          </Card>
        </div>
      ) : <LockedCard title="Charts require Pro" message="Upgrade to Pro to unlock chart-based revenue, appointment, and service performance reports." />}

      {usage.allowed ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Service performance by revenue</CardTitle></CardHeader><CardContent className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={serviceDemand} layout="vertical" margin={{ left: 18, right: 12 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" tickLine={false} axisLine={false} /><YAxis type="category" dataKey="name" width={110} tickLine={false} axisLine={false} /><Tooltip formatter={(value, name) => name === "revenue" ? [`AED ${Number(value).toFixed(0)}`, "Revenue"] : [value, "Bookings"]} /><Bar dataKey="revenue" fill="#22c55e" radius={[0, 8, 8, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
          <Card><CardHeader><CardTitle>Daily appointment load</CardTitle></CardHeader><CardContent className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={dailyLoad}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="day" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip /><Bar dataKey="appointments" fill="#38bdf8" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
        </div>
      ) : <LockedCard title="Usage report locked" message={usage.reason || "Usage report depth is not enabled for this plan or role."} />}

      {isEnterprise && activity.allowed ? (
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr_1fr]">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card"><CardHeader><CardTitle className="flex items-center gap-2"><Gauge className="size-5" /> Executive control panel</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm"><div className="rounded-lg border border-border bg-background/70 p-4"><p className="text-muted-foreground">Average ticket</p><p className="text-2xl font-bold">{kpis.avgTicket}</p></div><div className="rounded-lg border border-border bg-background/70 p-4"><p className="text-muted-foreground">Completion rate</p><p className="text-2xl font-bold">{kpis.completionRate}</p></div><div className="rounded-lg border border-border bg-background/70 p-4"><p className="text-muted-foreground">Active services</p><p className="text-2xl font-bold">{kpis.activeServices}</p></div></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Target className="size-5" /> Service portfolio matrix</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-3 md:grid-cols-3">{serviceDemand.slice(0, 6).map((service, index) => <div key={service.name} className="rounded-lg border border-border p-3" style={{ backgroundColor: `${colors[index % colors.length]}18` }}><p className="truncate text-sm font-medium">{service.name}</p><p className="mt-2 text-2xl font-bold">{service.bookings}</p><p className="text-xs text-muted-foreground">AED {service.revenue.toFixed(0)}</p></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="size-5" /> Operational pulse</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">{dailyLoad.map((day, index) => <div key={day.day} className="space-y-1"><div className="flex justify-between"><span>{day.day}</span><span>{day.appointments} appointments</span></div><div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, day.appointments * 14 + index * 2)}%` }} /></div></div>)}</CardContent></Card>
        </div>
      ) : activity.allowed ? null : <LockedCard title="Enterprise activity analytics locked" message={activity.reason || "Enterprise-style activity analytics require activity report permission."} />}
    </div>
  )
}
