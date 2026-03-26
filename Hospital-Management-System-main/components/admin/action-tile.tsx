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
    <Card className="group border-border/70 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-secondary/20 hover:scale-105 cursor-pointer" onClick={onClick}>
      <CardContent className="pt-6">
        <div className="mb-4 inline-flex rounded-xl border border-secondary/30 bg-secondary/10 p-2.5 text-secondary group-hover:bg-secondary/20 group-hover:border-secondary/50 group-hover:scale-110 transition-all duration-300">
          <Icon className="h-5 w-5 group-hover:text-secondary group-hover:scale-110 transition-all duration-300" />
        </div>
        <h3 className="text-base font-semibold text-foreground group-hover:text-secondary transition-colors duration-300">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <Button className="mt-4 w-full hover:scale-105 transition-all duration-200" variant="secondary" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          Open
        </Button>
      </CardContent>
    </Card>
  );
}
