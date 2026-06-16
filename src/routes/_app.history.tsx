import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Copy } from "lucide-react";
import { toast } from "sonner";
import { sampleContent, contentTypes } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/history")({
  head: () => ({ meta: [{ title: "Content History — Medipost AI" }] }),
  component: History,
});

function History() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [range, setRange] = useState<string>("all");

  const items = useMemo(() => {
    return sampleContent.filter((c) => {
      if (type !== "all" && c.type !== type) return false;
      if (q && !(c.title.toLowerCase().includes(q.toLowerCase()) || c.body.toLowerCase().includes(q.toLowerCase()))) return false;
      if (range !== "all") {
        const days = range === "7" ? 7 : 30;
        const cutoff = Date.now() - days * 86400000;
        if (new Date(c.createdAt).getTime() < cutoff) return false;
      }
      return true;
    });
  }, [q, type, range]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Content History</h1>
        <p className="text-muted-foreground mt-1">Search, filter, and reuse your generated content.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search content…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {contentTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {items.map((c) => (
          <Card key={c.id} className="border-border/60">
            <CardContent className="py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="secondary">{c.type}</Badge>
                    <Badge variant="outline">{c.specialty}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2 whitespace-pre-wrap">{c.body}</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { navigator.clipboard.writeText(c.body); toast.success("Copied"); }}>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No content matches your filters.</p>
        )}
      </div>
    </div>
  );
}