import { useRef } from "react";
import { NavLink } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";

type Stat = {
  icon: any;
  label: string;
  value: number;
  color: string;
  iconColor: string;
};

type ProfileBadge = {
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
};

type Props = {
  name: string;
  subtitle?: string;
  avatarUrl?: string | null;
  avatarFallback: string;
  onAvatarChange?: (file: File) => void;
  isUploading?: boolean;
  badges?: ProfileBadge[];
  stats?: Stat[];
  backLink: { label: string; href: string };
  actions?: React.ReactNode;
  glowColor?: string;
  loading?: boolean;
};

export function ProfileHero({
  name, subtitle, avatarUrl, avatarFallback, onAvatarChange, isUploading,
  badges = [], stats = [], backLink, actions, glowColor = "accent", loading,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
      <div className={`absolute -top-24 -right-24 w-[400px] h-[400px] bg-${glowColor}/8 rounded-full blur-[120px] pointer-events-none`} />
      <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10">
        {/* Back link */}
        <NavLink
          to={backLink.href}
          className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLink.label}
        </NavLink>

        {/* Top row: avatar + info + actions */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={avatarUrl ?? undefined} alt={name} />
                <AvatarFallback className="text-xl font-bold bg-muted text-muted-foreground">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              {onAvatarChange && (
                <>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    {isUploading ? (
                      <div className="h-5 w-5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onAvatarChange(f);
                      e.target.value = "";
                    }}
                  />
                </>
              )}
            </div>

            {/* Name + badges */}
            <div>
              {loading ? (
                <Skeleton className="h-8 w-48 mb-2" />
              ) : (
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{name}</h1>
              )}
              {subtitle && (
                <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>
              )}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {badges.map((b) => (
                    <Badge key={b.label} variant={b.variant ?? "secondary"} className="text-[11px] rounded-full px-2.5">
                      {b.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {/* Stats */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center shrink-0">
                  <s.icon className={`h-[18px] w-[18px] ${s.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium block mb-0.5">
                    {s.label}
                  </span>
                  {loading ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <span className={`text-lg font-bold tracking-tight ${s.color}`}>
                      {formatCurrency(s.value)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
