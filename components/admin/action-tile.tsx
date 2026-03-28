import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ActionTileProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

export function ActionTile({ title, description, icon: Icon, onClick }: ActionTileProps) {
  return (
    <Card className="border-border/70 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-secondary/20">
      <CardContent className="pt-6">
        <div className="mb-4 inline-flex rounded-xl border border-secondary/30 bg-secondary/10 p-2.5 text-secondary">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <Button className="mt-4 w-full" variant="secondary" onClick={onClick}>
          Open
        </Button>
      </CardContent>
    </Card>
  );
}
