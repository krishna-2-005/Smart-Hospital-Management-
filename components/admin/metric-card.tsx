import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  label: string;
  value: number | string;
  helper: string;
  tone: 'primary' | 'secondary' | 'critical' | 'info';
  icon: LucideIcon;
}

const toneClasses: Record<MetricCardProps['tone'], string> = {
  primary: 'from-primary/15 via-primary/5 to-transparent text-primary',
  secondary: 'from-secondary/18 via-secondary/5 to-transparent text-secondary',
  critical: 'from-destructive/15 via-destructive/5 to-transparent text-destructive',
  info: 'from-sky-500/20 via-sky-500/5 to-transparent text-sky-600',
};

export function MetricCard({ label, value, helper, icon: Icon, tone }: MetricCardProps) {
  return (
    <Card className="group relative overflow-hidden border-border/70 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80 ${toneClasses[tone]}`}
      />
      <CardContent className="relative pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-4xl font-bold leading-none text-foreground">{value}</p>
            <p className="mt-3 text-sm text-muted-foreground">{helper}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/80 p-2.5 shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
