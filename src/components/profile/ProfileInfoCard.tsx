import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

type InfoItem = {
  icon: any;
  label: string;
  value: string | null | undefined;
};

type Props = {
  title: string;
  items: InfoItem[];
  onEdit?: () => void;
};

export function ProfileInfoCard({ title, items, onEdit }: Props) {
  return (
    <div className="glass-card p-6 rounded-[1.25rem]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {title}
        </h3>
        {onEdit && (
          <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] text-muted-foreground block">{item.label}</span>
              <span className="text-[13px] text-foreground truncate block">
                {item.value || "—"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
